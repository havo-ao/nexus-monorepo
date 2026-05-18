import type { ProviderQuoteSnapshot } from '../entities/market-quote.entity';

export const MARKET_HISTORY_PROVIDER = Symbol('MARKET_HISTORY_PROVIDER');

export interface MarketHistoryProvider {
  readonly name: string;
  fetchDailyHistory(
    symbol: string,
  ): ProviderQuoteSnapshot[] | Promise<ProviderQuoteSnapshot[]>;
}
