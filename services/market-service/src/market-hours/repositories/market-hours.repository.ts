import { MarketHours } from '../entities/market-hours.entity';

export const MARKET_HOURS_REPOSITORY = Symbol('MARKET_HOURS_REPOSITORY');

export interface MarketHoursRepository {
  findByMarketCode(marketCode: string): Promise<MarketHours | null>;
}
