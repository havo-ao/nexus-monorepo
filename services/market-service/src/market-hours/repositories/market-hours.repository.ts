import { MarketHours } from '../entities/market-hours.entity';

export const MARKET_HOURS_REPOSITORY = Symbol('MARKET_HOURS_REPOSITORY');

export interface MarketConfigurationChange {
  marketCode: string;
  changeType: 'SCHEDULE_CONFIGURED' | 'RESTRICTION_CONFIGURED';
  actor: string;
  context: string;
}

export interface MarketHoursRepository {
  findByMarketCode(marketCode: string): Promise<MarketHours | null>;
  save(
    marketHours: MarketHours,
    change: MarketConfigurationChange,
  ): Promise<MarketHours>;
}
