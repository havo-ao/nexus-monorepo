import { Injectable } from '@nestjs/common';
import { WatchlistItem } from '../entities/watchlist-item.entity';
import type { WatchlistsRepository } from './watchlists.repository';

@Injectable()
export class InMemoryWatchlistsRepository implements WatchlistsRepository {
  private readonly itemsByTrader = new Map<
    string,
    Map<string, WatchlistItem>
  >();

  findByTraderId(traderId: string): WatchlistItem[] {
    const traderItems = this.itemsByTrader.get(traderId.trim());

    return [...(traderItems?.values() ?? [])].sort((leftItem, rightItem) =>
      leftItem.toSnapshot().symbol.localeCompare(rightItem.toSnapshot().symbol),
    );
  }

  addItem(item: WatchlistItem): void {
    const snapshot = item.toSnapshot();
    const traderItems =
      this.itemsByTrader.get(snapshot.traderId) ??
      new Map<string, WatchlistItem>();

    traderItems.set(snapshot.symbol, item);
    this.itemsByTrader.set(snapshot.traderId, traderItems);
  }

  removeItem(traderId: string, symbol: string): void {
    this.itemsByTrader
      .get(traderId.trim())
      ?.delete(symbol.trim().toUpperCase());
  }
}
