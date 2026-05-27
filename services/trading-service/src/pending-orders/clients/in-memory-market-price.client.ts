import { Injectable } from '@nestjs/common';
import {
  MarketPriceClientError,
  type MarketPriceClient,
  type MarketPriceSnapshot,
} from './market-price.client';

@Injectable()
export class InMemoryMarketPriceClient implements MarketPriceClient {
  private readonly prices = new Map<string, MarketPriceSnapshot>([
    ['AAPL', { symbol: 'AAPL', price: 250, asOf: '2026-05-12T14:30:00.000Z' }],
  ]);

  setPrice(symbol: string, price: number): void {
    const normalizedSymbol = symbol.trim().toUpperCase();
    this.prices.set(normalizedSymbol, {
      symbol: normalizedSymbol,
      price,
      asOf: new Date().toISOString(),
    });
  }

  getLatestPrice(symbol: string): Promise<MarketPriceSnapshot> {
    const normalizedSymbol = symbol.trim().toUpperCase();
    const price = this.prices.get(normalizedSymbol);

    if (!price) {
      return Promise.reject(
        new MarketPriceClientError('Market quote price is not available'),
      );
    }

    return Promise.resolve(price);
  }
}
