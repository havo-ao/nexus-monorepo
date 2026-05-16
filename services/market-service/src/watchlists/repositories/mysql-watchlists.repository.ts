import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MYSQL_POOL } from '../../../database/database.module';
import { WatchlistItem } from '../entities/watchlist-item.entity';
import type { WatchlistsRepository } from './watchlists.repository';

interface WatchlistItemRow extends RowDataPacket {
  trader_id: string;
  symbol: string;
  created_at: Date;
}

@Injectable()
export class MysqlWatchlistsRepository implements WatchlistsRepository {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  async findByTraderId(traderId: string): Promise<WatchlistItem[]> {
    const [rows] = await this.pool.query<WatchlistItemRow[]>(
      `SELECT trader_id, symbol, created_at
       FROM market_watchlist_items
       WHERE trader_id = ?
       ORDER BY symbol ASC`,
      [traderId.trim()],
    );

    return rows.map((row) =>
      WatchlistItem.create({
        traderId: row.trader_id,
        symbol: row.symbol,
        addedAt: new Date(row.created_at),
      }),
    );
  }

  async addItem(item: WatchlistItem): Promise<void> {
    const snapshot = item.toSnapshot();

    await this.pool.execute(
      `INSERT INTO market_watchlist_items (trader_id, symbol, created_at)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE symbol = VALUES(symbol)`,
      [snapshot.traderId, snapshot.symbol, snapshot.addedAt],
    );
  }

  async removeItem(traderId: string, symbol: string): Promise<void> {
    await this.pool.execute(
      `DELETE FROM market_watchlist_items
       WHERE trader_id = ? AND symbol = ?`,
      [traderId.trim(), symbol.trim().toUpperCase()],
    );
  }
}
