import { Injectable } from '@nestjs/common';
import type { ProviderQuoteSnapshot } from '../entities/market-quote.entity';
import type { MarketDataProvider } from './market-data-provider';

@Injectable()
export class StaticMarketDataProvider implements MarketDataProvider {
  readonly name = 'alpha-vantage-compatible';

  fetchQuote(symbol: string): ProviderQuoteSnapshot {
    const normalizedSymbol = symbol.trim().toUpperCase();

    if (!normalizedSymbol) {
      throw new TypeError('Symbol is required to synchronize market data');
    }

    const basePrice = this.resolveBasePrice(normalizedSymbol);
    const bid = Number((basePrice - 0.05).toFixed(2));
    const ask = Number((basePrice + 0.05).toFixed(2));

    return {
      symbol: normalizedSymbol,
      price: basePrice,
      bid,
      ask,
      currency: 'USD',
      provider: this.name,
      asOf: new Date(),
    };
  }

  private resolveBasePrice(symbol: string): number {
    let score = 0;

    for (const character of symbol) {
      score += character.codePointAt(0) ?? 0;
    }

    return Number((100 + (score % 200) + symbol.length / 10).toFixed(2));
  }
}
