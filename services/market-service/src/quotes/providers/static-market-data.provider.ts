import { Injectable } from '@nestjs/common';
import type { ProviderQuoteSnapshot } from '../entities/market-quote.entity';
import type { MarketDataProvider } from './market-data-provider';

@Injectable()
export class StaticMarketDataProvider implements MarketDataProvider {
  readonly name = 'alpha-vantage-compatible';

  private readonly quoteSequenceBySymbol = new Map<string, number>();

  fetchQuote(symbol: string): ProviderQuoteSnapshot {
    const normalizedSymbol = symbol.trim().toUpperCase();

    if (!normalizedSymbol) {
      throw new TypeError('Symbol is required to synchronize market data');
    }

    const price = this.resolveMarketPrice(normalizedSymbol);
    const bid = Number((price - 0.05).toFixed(2));
    const ask = Number((price + 0.05).toFixed(2));

    return {
      symbol: normalizedSymbol,
      price,
      bid,
      ask,
      currency: 'USD',
      provider: this.name,
      asOf: new Date(),
    };
  }

  private resolveMarketPrice(symbol: string): number {
    const nextSequence = (this.quoteSequenceBySymbol.get(symbol) ?? 0) + 1;
    this.quoteSequenceBySymbol.set(symbol, nextSequence);

    const basePrice = this.resolveBasePrice(symbol);
    const direction = this.resolveTrendDirection(symbol);
    const variation = direction * (nextSequence - 1) * 1.25;

    return Number(Math.max(basePrice + variation, 1).toFixed(2));
  }

  private resolveBasePrice(symbol: string): number {
    const score = this.resolveSymbolScore(symbol);

    return Number((100 + (score % 200) + symbol.length / 10).toFixed(2));
  }

  private resolveTrendDirection(symbol: string): 1 | -1 {
    return this.resolveSymbolScore(symbol) % 3 === 2 ? -1 : 1;
  }

  private resolveSymbolScore(symbol: string): number {
    let score = 0;

    for (const character of symbol) {
      score += character.codePointAt(0) ?? 0;
    }

    return score;
  }
}
