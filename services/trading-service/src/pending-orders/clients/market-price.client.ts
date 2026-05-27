export const MARKET_PRICE_CLIENT = Symbol('MARKET_PRICE_CLIENT');

export type MarketPriceSnapshot = {
  symbol: string;
  price: number;
  asOf?: string;
};

export interface MarketPriceClient {
  getLatestPrice(symbol: string): Promise<MarketPriceSnapshot>;
}

export class MarketPriceClientError extends Error {}
