export interface WatchlistItemSnapshot {
  traderId: string;
  symbol: string;
  addedAt: Date;
}

export class WatchlistItem {
  private constructor(private readonly snapshot: WatchlistItemSnapshot) {}

  static create(snapshot: WatchlistItemSnapshot): WatchlistItem {
    if (typeof snapshot.traderId !== 'string' || !snapshot.traderId.trim()) {
      throw new TypeError('Watchlist trader id is required');
    }

    if (typeof snapshot.symbol !== 'string' || !snapshot.symbol.trim()) {
      throw new TypeError('Watchlist symbol is required');
    }

    if (
      !(snapshot.addedAt instanceof Date) ||
      Number.isNaN(snapshot.addedAt.getTime())
    ) {
      throw new TypeError('Watchlist added timestamp must be valid');
    }

    return new WatchlistItem({
      traderId: snapshot.traderId.trim(),
      symbol: snapshot.symbol.trim().toUpperCase(),
      addedAt: new Date(snapshot.addedAt),
    });
  }

  toSnapshot(): WatchlistItemSnapshot {
    return {
      ...this.snapshot,
      addedAt: new Date(this.snapshot.addedAt),
    };
  }
}
