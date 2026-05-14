import { Injectable } from '@nestjs/common';
import { MarketQuote } from '../entities/market-quote.entity';
import type {
  MarketDataSyncEvent,
  QuotesRepository,
} from './quotes.repository';

@Injectable()
export class InMemoryQuotesRepository implements QuotesRepository {
  private readonly latestQuotes = new Map<string, MarketQuote>();
  private readonly events: MarketDataSyncEvent[] = [];

  saveQuotes(quotes: MarketQuote[]): void {
    for (const quote of quotes) {
      const snapshot = quote.toSnapshot();
      this.latestQuotes.set(snapshot.symbol, quote);
    }
  }

  findLatestBySymbol(symbol: string): MarketQuote | null {
    return this.latestQuotes.get(symbol.trim().toUpperCase()) ?? null;
  }

  recordSyncEvent(event: MarketDataSyncEvent): void {
    this.events.push(event);
  }
}
