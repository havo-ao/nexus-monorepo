import { Injectable } from '@nestjs/common';
import { MarketQuote } from '../entities/market-quote.entity';
import type {
  MarketDataSyncEvent,
  QuotesRepository,
} from './quotes.repository';

@Injectable()
export class InMemoryQuotesRepository implements QuotesRepository {
  private readonly latestQuotes = new Map<string, MarketQuote>();
  private readonly quoteHistory = new Map<string, MarketQuote[]>();
  private readonly events: MarketDataSyncEvent[] = [];

  saveQuotes(quotes: MarketQuote[]): void {
    for (const quote of quotes) {
      const snapshot = quote.toSnapshot();
      this.latestQuotes.set(snapshot.symbol, quote);
      this.upsertHistoryQuote(quote);
    }
  }

  saveQuoteHistory(quotes: MarketQuote[]): void {
    for (const quote of quotes) {
      this.upsertHistoryQuote(quote);
    }
  }

  findLatestBySymbol(symbol: string): MarketQuote | null {
    return this.latestQuotes.get(symbol.trim().toUpperCase()) ?? null;
  }

  findHistoryBySymbol(symbol: string): MarketQuote[] {
    return [...(this.quoteHistory.get(symbol.trim().toUpperCase()) ?? [])].sort(
      (leftQuote, rightQuote) =>
        leftQuote.toSnapshot().asOf.getTime() -
        rightQuote.toSnapshot().asOf.getTime(),
    );
  }

  recordSyncEvent(event: MarketDataSyncEvent): void {
    this.events.push(event);
  }

  private upsertHistoryQuote(quote: MarketQuote): void {
    const snapshot = quote.toSnapshot();
    const existingQuotes = this.quoteHistory.get(snapshot.symbol) ?? [];
    const existingIndex = existingQuotes.findIndex(
      (existingQuote) =>
        existingQuote.toSnapshot().asOf.getTime() === snapshot.asOf.getTime(),
    );

    if (existingIndex >= 0) {
      existingQuotes[existingIndex] = quote;
      this.quoteHistory.set(snapshot.symbol, existingQuotes);
      return;
    }

    this.quoteHistory.set(snapshot.symbol, [...existingQuotes, quote]);
  }
}
