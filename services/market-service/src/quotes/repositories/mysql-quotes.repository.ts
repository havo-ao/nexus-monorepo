import { Inject, Injectable } from '@nestjs/common';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { MYSQL_POOL } from '../../../database/database.module';
import { MarketQuote } from '../entities/market-quote.entity';
import type {
  MarketDataSyncEvent,
  QuotesRepository,
} from './quotes.repository';

interface MarketQuoteRow extends RowDataPacket {
  symbol: string;
  price: string;
  bid: string;
  ask: string;
  spread: string;
  currency: string;
  provider: string;
  as_of: Date;
}

type QuotePersistenceValues = [
  string,
  number,
  number,
  number,
  number,
  string,
  string,
  Date,
];

@Injectable()
export class MysqlQuotesRepository implements QuotesRepository {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  async saveQuotes(quotes: MarketQuote[]): Promise<void> {
    if (quotes.length === 0) {
      return;
    }

    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      for (const quote of quotes) {
        const snapshot = quote.toSnapshot();
        const values: QuotePersistenceValues = [
          snapshot.symbol,
          snapshot.price,
          snapshot.bid,
          snapshot.ask,
          snapshot.spread,
          snapshot.currency,
          snapshot.provider,
          snapshot.asOf,
        ];

        await connection.execute(
          `INSERT INTO market_quotes
            (symbol, price, bid, ask, spread, currency, provider, as_of)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
            price = VALUES(price),
            bid = VALUES(bid),
            ask = VALUES(ask),
            spread = VALUES(spread),
            currency = VALUES(currency),
            provider = VALUES(provider),
            as_of = VALUES(as_of)`,
          values,
        );

        await this.upsertQuoteHistory(connection, values);
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findLatestBySymbol(symbol: string): Promise<MarketQuote | null> {
    const normalizedSymbol = symbol.trim().toUpperCase();
    const [rows] = await this.pool.query<MarketQuoteRow[]>(
      `SELECT symbol, price, bid, ask, spread, currency, provider, as_of
       FROM market_quotes
       WHERE symbol = ?`,
      [normalizedSymbol],
    );
    const row = rows[0];

    if (!row) {
      return null;
    }

    return MarketQuote.restore({
      symbol: row.symbol,
      price: this.parseDecimal(row.price, 'price'),
      bid: this.parseDecimal(row.bid, 'bid'),
      ask: this.parseDecimal(row.ask, 'ask'),
      spread: this.parseDecimal(row.spread, 'spread'),
      currency: row.currency,
      provider: row.provider,
      asOf: new Date(row.as_of),
    });
  }

  async saveQuoteHistory(quotes: MarketQuote[]): Promise<void> {
    if (quotes.length === 0) {
      return;
    }

    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      for (const quote of quotes) {
        const snapshot = quote.toSnapshot();
        await this.upsertQuoteHistory(connection, [
          snapshot.symbol,
          snapshot.price,
          snapshot.bid,
          snapshot.ask,
          snapshot.spread,
          snapshot.currency,
          snapshot.provider,
          snapshot.asOf,
        ]);
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findHistoryBySymbol(symbol: string): Promise<MarketQuote[]> {
    const normalizedSymbol = symbol.trim().toUpperCase();
    const [rows] = await this.pool.query<MarketQuoteRow[]>(
      `SELECT symbol, price, bid, ask, spread, currency, provider, as_of
       FROM market_quote_history
       WHERE symbol = ?
       ORDER BY as_of ASC`,
      [normalizedSymbol],
    );

    return rows.map((row) =>
      MarketQuote.restore({
        symbol: row.symbol,
        price: this.parseDecimal(row.price, 'price'),
        bid: this.parseDecimal(row.bid, 'bid'),
        ask: this.parseDecimal(row.ask, 'ask'),
        spread: this.parseDecimal(row.spread, 'spread'),
        currency: row.currency,
        provider: row.provider,
        asOf: new Date(row.as_of),
      }),
    );
  }

  async recordSyncEvent(event: MarketDataSyncEvent): Promise<void> {
    await this.pool.execute(
      `INSERT INTO market_data_sync_events
        (status, provider, requested_by, symbols_count, updated_count, failed_count, message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        event.status,
        event.provider,
        event.requestedBy,
        event.symbolsCount,
        event.updatedCount,
        event.failedCount,
        event.message,
      ],
    );
  }

  private parseDecimal(value: string, fieldName: string): number {
    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue)) {
      throw new TypeError(`Stored quote ${fieldName} must be numeric`);
    }

    return parsedValue;
  }

  private async upsertQuoteHistory(
    connection: PoolConnection,
    values: QuotePersistenceValues,
  ): Promise<void> {
    await connection.execute(
      `INSERT INTO market_quote_history
        (symbol, price, bid, ask, spread, currency, provider, as_of)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        price = VALUES(price),
        bid = VALUES(bid),
        ask = VALUES(ask),
        spread = VALUES(spread),
        currency = VALUES(currency),
        provider = VALUES(provider)`,
      values,
    );
  }
}
