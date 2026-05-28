import { Injectable } from '@nestjs/common';
import type { ProviderQuoteSnapshot } from '../entities/market-quote.entity';
import type { MarketHistoryProvider } from './market-history-provider';

const SYNTHETIC_HALF_SPREAD = 0.05;
const DEFAULT_HISTORY_POINTS = 30;

@Injectable()
export class StaticMarketHistoryProvider implements MarketHistoryProvider {
  readonly name = 'alpha-vantage-history-compatible';

  fetchDailyHistory(symbol: string): ProviderQuoteSnapshot[] {
    const normalizedSymbol = symbol.trim().toUpperCase();

    if (!normalizedSymbol) {
      throw new TypeError('Symbol is required to synchronize quote history');
    }

    const basePrice = this.resolveBasePrice(normalizedSymbol);
    const startDate = new Date('2026-04-01T00:00:00.000Z');

    return Array.from({ length: DEFAULT_HISTORY_POINTS }, (_, index) => {
      const price = Number((basePrice + index * 0.75).toFixed(2));
      const asOf = new Date(startDate);
      asOf.setUTCDate(startDate.getUTCDate() + index);

      return {
        symbol: normalizedSymbol,
        price,
        bid: Number((price - SYNTHETIC_HALF_SPREAD).toFixed(2)),
        ask: Number((price + SYNTHETIC_HALF_SPREAD).toFixed(2)),
        currency: 'USD',
        provider: this.name,
        asOf,
      };
    });
  }

  private resolveBasePrice(symbol: string): number {
    const score = [...symbol].reduce(
      (total, character) => total + (character.codePointAt(0) ?? 0),
      0,
    );

    return Number((100 + (score % 200) + symbol.length / 10).toFixed(2));
  }
}
