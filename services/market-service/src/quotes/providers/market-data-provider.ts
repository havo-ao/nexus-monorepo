import type { ProviderQuoteSnapshot } from '../entities/market-quote.entity';

export const MARKET_DATA_PROVIDER = Symbol('MARKET_DATA_PROVIDER');

export interface MarketDataProvider {
  readonly name: string;
  fetchQuote(
    symbol: string,
  ): ProviderQuoteSnapshot | Promise<ProviderQuoteSnapshot>;
}
