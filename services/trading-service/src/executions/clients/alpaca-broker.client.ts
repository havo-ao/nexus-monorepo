import { Injectable } from '@nestjs/common';
import { stripTrailingSlashes } from '../../common/url';
import type {
  BrokerOrderStatusResponse,
  BrokerOrderResponse,
  ExternalBrokerClient,
  SendBrokerOrderCommand,
} from './external-broker.client';
import { BrokerOrderSubmissionError } from './external-broker.client';

type AlpacaBrokerMode = 'mock' | 'real';

type AlpacaOrderPayload = {
  symbol: string;
  qty: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  time_in_force: 'day';
  client_order_id: string;
  limit_price?: string;
  stop_price?: string;
};

type AlpacaOrderResponse = {
  id?: string;
  status?: string;
  client_order_id?: string;
  symbol?: string;
  qty?: string;
  filled_qty?: string;
  filled_avg_price?: string;
  side?: string;
  type?: string;
  message?: string;
  code?: number | string;
};

@Injectable()
export class AlpacaBrokerClient implements ExternalBrokerClient {
  async sendOrder(
    command: SendBrokerOrderCommand,
  ): Promise<BrokerOrderResponse> {
    if (this.getMode() === 'mock') {
      return this.sendMockOrder(command);
    }

    return this.sendRealOrder(command);
  }

  async getOrderStatus(
    externalOrderId: string,
  ): Promise<BrokerOrderStatusResponse> {
    const normalizedExternalOrderId = externalOrderId.trim();
    if (this.getMode() === 'mock') {
      return {
        brokerName: process.env.BROKER_NAME?.trim() || 'ALPACA',
        externalOrderId: normalizedExternalOrderId,
        brokerStatus: 'filled',
        filledQuantity: 1,
        averageFilledPrice: undefined,
        responseSummary: `Broker order ${normalizedExternalOrderId} returned status filled`,
      };
    }

    return this.getRealOrderStatus(normalizedExternalOrderId);
  }

  private sendMockOrder(
    command: SendBrokerOrderCommand,
  ): Promise<BrokerOrderResponse> {
    const brokerName = process.env.BROKER_NAME?.trim() || 'ALPACA';
    const externalOrderId = `${brokerName.toLowerCase()}-${command.orderReference}`;
    const requestSummary = `${command.side} ${command.quantity} ${command.symbol} ${command.orderType}`;

    if (command.symbol === 'FAIL') {
      return Promise.reject(
        new BrokerOrderSubmissionError(
          brokerName,
          'FAILED',
          requestSummary,
          'Broker rejected the order submission',
        ),
      );
    }

    return Promise.resolve({
      brokerName,
      externalOrderId,
      brokerStatus: 'ACCEPTED',
      requestSummary,
      responseSummary: `Broker accepted order ${externalOrderId}`,
    });
  }

  private async sendRealOrder(
    command: SendBrokerOrderCommand,
  ): Promise<BrokerOrderResponse> {
    const brokerName = 'ALPACA';
    const payload = this.buildOrderPayload(command);
    const requestSummary = this.buildRequestSummary(payload);
    const { apiKey, apiSecret } = this.getCredentials();

    if (!apiKey || !apiSecret) {
      throw new BrokerOrderSubmissionError(
        brokerName,
        'CONFIGURATION_ERROR',
        requestSummary,
        'Alpaca credentials are required when ALPACA_BROKER_MODE=real',
      );
    }

    const timeoutMs = this.getTimeoutMs();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.getBaseUrl()}/v2/orders`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'APCA-API-KEY-ID': apiKey,
          'APCA-API-SECRET-KEY': apiSecret,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const responseBody = await this.parseResponse(response);

      if (!response.ok) {
        throw new BrokerOrderSubmissionError(
          brokerName,
          response.status.toString(),
          requestSummary,
          this.getErrorMessage(responseBody, response.statusText),
        );
      }

      return {
        brokerName,
        externalOrderId:
          responseBody.id ||
          responseBody.client_order_id ||
          command.orderReference,
        brokerStatus: responseBody.status || 'ACCEPTED',
        requestSummary,
        responseSummary: this.buildResponseSummary(responseBody),
      };
    } catch (error) {
      if (error instanceof BrokerOrderSubmissionError) {
        throw error;
      }

      throw new BrokerOrderSubmissionError(
        brokerName,
        error instanceof Error && error.name === 'AbortError'
          ? 'TIMEOUT'
          : 'FAILED',
        requestSummary,
        error instanceof Error
          ? error.message
          : 'Alpaca order submission failed unexpectedly',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private async getRealOrderStatus(
    externalOrderId: string,
  ): Promise<BrokerOrderStatusResponse> {
    const brokerName = 'ALPACA';
    const requestSummary = `GET ORDER ${externalOrderId}`;
    const { apiKey, apiSecret } = this.getCredentials();

    if (!apiKey || !apiSecret) {
      throw new BrokerOrderSubmissionError(
        brokerName,
        'CONFIGURATION_ERROR',
        requestSummary,
        'Alpaca credentials are required when ALPACA_BROKER_MODE=real',
      );
    }

    const timeoutMs = this.getTimeoutMs();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(
        `${this.getBaseUrl()}/v2/orders/${encodeURIComponent(externalOrderId)}`,
        {
          headers: {
            accept: 'application/json',
            'APCA-API-KEY-ID': apiKey,
            'APCA-API-SECRET-KEY': apiSecret,
          },
          signal: controller.signal,
        },
      );
      const responseBody = await this.parseResponse(response);

      if (!response.ok) {
        throw new BrokerOrderSubmissionError(
          brokerName,
          response.status.toString(),
          requestSummary,
          this.getErrorMessage(responseBody, response.statusText),
        );
      }

      const brokerStatus = responseBody.status || 'unknown';
      return {
        brokerName,
        externalOrderId: responseBody.id || externalOrderId,
        brokerStatus,
        filledQuantity: Number(responseBody.filled_qty ?? 0),
        averageFilledPrice: responseBody.filled_avg_price
          ? Number(responseBody.filled_avg_price)
          : undefined,
        responseSummary: `Alpaca order ${responseBody.id || externalOrderId} returned status ${brokerStatus}`,
      };
    } catch (error) {
      if (error instanceof BrokerOrderSubmissionError) {
        throw error;
      }

      throw new BrokerOrderSubmissionError(
        brokerName,
        error instanceof Error && error.name === 'AbortError'
          ? 'TIMEOUT'
          : 'FAILED',
        requestSummary,
        error instanceof Error
          ? error.message
          : 'Alpaca order status lookup failed unexpectedly',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private getMode(): AlpacaBrokerMode {
    return process.env.ALPACA_BROKER_MODE?.trim().toLowerCase() === 'real'
      ? 'real'
      : 'mock';
  }

  private getCredentials(): { apiKey?: string; apiSecret?: string } {
    return {
      apiKey: process.env.ALPACA_API_KEY?.trim(),
      apiSecret: process.env.ALPACA_SECRET_KEY?.trim(),
    };
  }

  private getBaseUrl(): string {
    const baseUrl = stripTrailingSlashes(
      process.env.ALPACA_API_BASE_URL?.trim() ||
        'https://paper-api.alpaca.markets',
    );
    return baseUrl.endsWith('/v2') ? baseUrl.slice(0, -3) : baseUrl;
  }

  private getTimeoutMs(): number {
    const configuredTimeout = Number(process.env.ALPACA_TIMEOUT_MS);
    return Number.isFinite(configuredTimeout) && configuredTimeout > 0
      ? configuredTimeout
      : 5000;
  }

  private buildOrderPayload(
    command: SendBrokerOrderCommand,
  ): AlpacaOrderPayload {
    const payload: AlpacaOrderPayload = {
      symbol: command.symbol,
      qty: command.quantity.toString(),
      side: command.side.toLowerCase() as 'buy' | 'sell',
      type: this.mapOrderType(command.orderType),
      time_in_force: 'day',
      client_order_id: command.orderReference,
    };

    if (payload.type === 'limit') {
      payload.limit_price = this.getLimitPrice(command).toString();
    }

    if (payload.type === 'stop') {
      payload.stop_price = this.getLimitPrice(command).toString();
    }

    return payload;
  }

  private mapOrderType(
    orderType: SendBrokerOrderCommand['orderType'],
  ): AlpacaOrderPayload['type'] {
    if (orderType === 'LIMIT' || orderType === 'TAKE_PROFIT') {
      return 'limit';
    }

    if (orderType === 'STOP_LOSS') {
      return 'stop';
    }

    return 'market';
  }

  private getLimitPrice(command: SendBrokerOrderCommand): number {
    return command.limitPrice ?? command.estimatedUnitPrice;
  }

  private buildRequestSummary(payload: AlpacaOrderPayload): string {
    return `${payload.side.toUpperCase()} ${payload.qty} ${payload.symbol} ${payload.type.toUpperCase()}`;
  }

  private async parseResponse(
    response: Response,
  ): Promise<AlpacaOrderResponse> {
    const responseText = await response.text();
    if (!responseText) {
      return {};
    }

    try {
      return JSON.parse(responseText) as AlpacaOrderResponse;
    } catch {
      return { message: responseText };
    }
  }

  private getErrorMessage(
    responseBody: AlpacaOrderResponse,
    fallback: string,
  ): string {
    return responseBody.message || fallback || 'Alpaca rejected the order';
  }

  private buildResponseSummary(responseBody: AlpacaOrderResponse): string {
    const id = responseBody.id || responseBody.client_order_id || 'unknown';
    const status = responseBody.status || 'ACCEPTED';
    return `Alpaca order ${id} returned status ${status}`;
  }
}
