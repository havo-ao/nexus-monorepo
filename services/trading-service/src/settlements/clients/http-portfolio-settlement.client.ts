import { Injectable } from '@nestjs/common';
import { stripTrailingSlashes } from '../../common/url';
import type {
  ApplyPortfolioSettlementCommand,
  PortfolioSettlementClient,
  PortfolioSettlementResult,
} from './portfolio-settlement.client';
import { PortfolioSettlementError } from './portfolio-settlement.client';

@Injectable()
export class HttpPortfolioSettlementClient implements PortfolioSettlementClient {
  async applyExecutedOrder(
    command: ApplyPortfolioSettlementCommand,
  ): Promise<PortfolioSettlementResult> {
    const baseUrl = process.env.PORTFOLIO_SERVICE_URL?.trim();
    if (!baseUrl) {
      return {
        portfolioUpdated: false,
        fundsUpdated: false,
        reason: 'PORTFOLIO_SERVICE_URL is not configured',
      };
    }

    if (!command.authorizationHeader?.trim()) {
      throw new PortfolioSettlementError(
        'Authorization header is required to settle portfolio operations',
      );
    }

    const authorizationHeader = command.authorizationHeader.trim();
    const executedAt = command.executedAt;
    const headers = {
      Accept: 'application/json',
      Authorization: authorizationHeader,
      'Content-Type': 'application/json',
    };

    const fundsUpdated =
      command.side === 'BUY'
        ? await this.captureReservedFunds(baseUrl, headers, command, executedAt)
        : await this.depositSellProceeds(baseUrl, headers, command, executedAt);

    const portfolioUpdated = command.stockId
      ? await this.recordExecutedTrade(baseUrl, headers, command, executedAt)
      : false;

    return { portfolioUpdated, fundsUpdated };
  }

  private async captureReservedFunds(
    baseUrl: string,
    headers: Record<string, string>,
    command: ApplyPortfolioSettlementCommand,
    executedAt: string,
  ): Promise<boolean> {
    await this.post(
      baseUrl,
      `/api/v1/portfolio/${encodeURIComponent(command.traderId)}/reservations/captures`,
      headers,
      {
        amount: command.reservedAmount,
        currency: command.currency,
        sourceOrderId: command.orderReference,
        capturedAt: executedAt,
      },
    );
    return true;
  }

  private async depositSellProceeds(
    baseUrl: string,
    headers: Record<string, string>,
    command: ApplyPortfolioSettlementCommand,
    executedAt: string,
  ): Promise<boolean> {
    await this.post(
      baseUrl,
      `/api/v1/portfolio/${encodeURIComponent(command.traderId)}/deposits`,
      headers,
      {
        amount: command.netAmount,
        currency: command.currency,
        sourceTransactionId: command.externalOrderId,
        depositedAt: executedAt,
      },
    );
    return true;
  }

  private async recordExecutedTrade(
    baseUrl: string,
    headers: Record<string, string>,
    command: ApplyPortfolioSettlementCommand,
    executedAt: string,
  ): Promise<boolean> {
    await this.post(
      baseUrl,
      command.side === 'BUY'
        ? '/api/v1/portfolio/positions/purchases'
        : '/api/v1/portfolio/positions/sales',
      headers,
      {
        traderId: command.traderId,
        stockId: command.stockId,
        quantity: command.quantity,
        executionPrice: command.executionPrice,
        sourceOrderId: command.orderReference,
        sourceTransactionId: command.externalOrderId,
        executedAt,
      },
    );
    return true;
  }

  private async post(
    baseUrl: string,
    path: string,
    headers: Record<string, string>,
    body: Record<string, unknown>,
  ): Promise<void> {
    const response = await fetch(`${stripTrailingSlashes(baseUrl)}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const message = await this.readErrorMessage(response);
      throw new PortfolioSettlementError(message);
    }
  }

  private async readErrorMessage(response: Response): Promise<string> {
    const body = await response.text();
    if (!body) {
      return `Portfolio service returned HTTP ${response.status}`;
    }

    try {
      const parsed = JSON.parse(body) as { message?: unknown };
      if (parsed.message) {
        if (Array.isArray(parsed.message)) {
          return parsed.message.map((message) => String(message)).join(', ');
        }
        if (typeof parsed.message === 'string') {
          return parsed.message;
        }
        return JSON.stringify(parsed.message);
      }
    } catch {
      return body;
    }

    return body;
  }
}
