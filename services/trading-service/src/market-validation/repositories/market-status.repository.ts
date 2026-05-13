import type { MarketStatus } from '../entities/market-validation.entity';

export const MARKET_STATUS_REPOSITORY = Symbol('MARKET_STATUS_REPOSITORY');

export type MarketSchedule = {
  exchangeId: string;
  timezone: string;
  openTime: string;
  closeTime: string;
};

export type MarketValidationResult = {
  canOperate: boolean;
  exchangeId: string;
  marketStatus: MarketStatus;
  evaluatedAt: Date;
  timezone?: string;
  openTime?: string;
  closeTime?: string;
  reason?: string;
};

export interface MarketStatusRepository {
  validateMarketStatus(
    exchangeId: string,
    evaluatedAt: Date,
  ): Promise<MarketValidationResult>;
}
