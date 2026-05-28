import { Market } from '../entities/market.entity';

export const MARKETS_REPOSITORY = Symbol('MARKETS_REPOSITORY');

export interface MarketsRepository {
  findAvailable(): Market[] | Promise<Market[]>;
}
