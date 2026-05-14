import { MarketQuote } from '../entities/market-quote.entity';

export const QUOTES_REPOSITORY = Symbol('QUOTES_REPOSITORY');

export type MarketDataSyncStatus = 'SUCCESS' | 'PARTIAL_FAILURE' | 'FAILED';

export interface MarketDataSyncEvent {
  status: MarketDataSyncStatus;
  provider: string;
  requestedBy: string;
  symbolsCount: number;
  updatedCount: number;
  failedCount: number;
  message: string;
}

export interface QuotesRepository {
  saveQuotes(quotes: MarketQuote[]): void | Promise<void>;
  findLatestBySymbol(
    symbol: string,
  ): MarketQuote | null | Promise<MarketQuote | null>;
  recordSyncEvent(event: MarketDataSyncEvent): void | Promise<void>;
}
