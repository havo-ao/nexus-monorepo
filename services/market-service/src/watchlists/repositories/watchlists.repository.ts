import { WatchlistItem } from '../entities/watchlist-item.entity';

export const WATCHLISTS_REPOSITORY = Symbol('WATCHLISTS_REPOSITORY');

export interface WatchlistsRepository {
  findByTraderId(traderId: string): WatchlistItem[] | Promise<WatchlistItem[]>;
  addItem(item: WatchlistItem): void | Promise<void>;
  removeItem(traderId: string, symbol: string): void | Promise<void>;
}
