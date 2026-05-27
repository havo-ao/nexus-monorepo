import { Injectable } from '@nestjs/common';
import { stripTrailingSlashes } from '../../common/url';
import {
  MarketPriceClientError,
  type MarketPriceClient,
  type MarketPriceSnapshot,
} from './market-price.client';

type MarketQuoteResponse = {
  symbol?: string;
  price?: number;
  asOf?: string;
};

@Injectable()
export class HttpMarketPriceClient implements MarketPriceClient {
  async getLatestPrice(symbol: string): Promise<MarketPriceSnapshot> {
    const normalizedSymbol = symbol.trim().toUpperCase();
    if (!normalizedSymbol) {
      throw new MarketPriceClientError('Symbol is required');
    }

    const baseUrl = process.env.MARKET_SERVICE_URL?.trim();
    if (!baseUrl) {
      throw new MarketPriceClientError('Market service URL is not configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.getTimeoutMs());

    try {
      const response = await fetch(
        `${stripTrailingSlashes(baseUrl)}/api/v1/quotes/${encodeURIComponent(
          normalizedSymbol,
        )}`,
        {
          headers: { accept: 'application/json' },
          signal: controller.signal,
        },
      );
      const body = (await this.parseResponse(response)) as MarketQuoteResponse;

      if (!response.ok) {
        throw new MarketPriceClientError(
          this.getErrorMessage(body, response.status),
        );
      }

      if (!Number.isFinite(body.price) || Number(body.price) <= 0) {
        throw new MarketPriceClientError('Market quote price is not available');
      }

      return {
        symbol: body.symbol?.trim().toUpperCase() || normalizedSymbol,
        price: Number(body.price),
        asOf: body.asOf,
      };
    } catch (error) {
      if (error instanceof MarketPriceClientError) {
        throw error;
      }

      throw new MarketPriceClientError(
        error instanceof Error && error.name === 'AbortError'
          ? 'Market quote request timed out'
          : 'Market quote service is unavailable',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private async parseResponse(response: Response): Promise<unknown> {
    const responseText = await response.text();
    if (!responseText) {
      return {};
    }

    try {
      return JSON.parse(responseText) as unknown;
    } catch {
      return { message: responseText };
    }
  }

  private getErrorMessage(body: MarketQuoteResponse, status: number): string {
    const message =
      'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined;
    return message || `Market quote service rejected request with ${status}`;
  }

  private getTimeoutMs(): number {
    const configuredTimeout = Number(process.env.MARKET_SERVICE_TIMEOUT_MS);
    return Number.isFinite(configuredTimeout) && configuredTimeout > 0
      ? configuredTimeout
      : 3000;
  }
}
