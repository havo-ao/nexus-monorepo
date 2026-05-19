import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MYSQL_POOL } from '../../../database/database.module';
import {
  Instrument,
  type InstrumentStatus,
} from '../entities/instrument.entity';
import type { InstrumentsRepository } from './instruments.repository';

interface InstrumentRow extends RowDataPacket {
  symbol: string;
  name: string;
  market_code: string;
  currency: string;
  sector: string;
  status: InstrumentStatus;
}

@Injectable()
export class MysqlInstrumentsRepository implements InstrumentsRepository {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  async saveInstruments(instruments: Instrument[]): Promise<void> {
    if (instruments.length === 0) {
      return;
    }

    for (const instrument of instruments) {
      const snapshot = instrument.toSnapshot();

      await this.pool.query(
        `INSERT INTO market_instruments
          (symbol, name, market_code, currency, sector, status)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          market_code = VALUES(market_code),
          currency = VALUES(currency),
          sector = VALUES(sector),
          status = VALUES(status)`,
        [
          snapshot.symbol,
          snapshot.name,
          snapshot.marketCode,
          snapshot.currency,
          snapshot.sector,
          snapshot.status,
        ],
      );
    }
  }

  async findAvailable(): Promise<Instrument[]> {
    const [rows] = await this.pool.query<InstrumentRow[]>(
      `SELECT symbol, name, market_code, currency, sector, status
       FROM market_instruments
       WHERE status = 'ACTIVE'
       ORDER BY symbol ASC`,
    );

    return rows.map((row) =>
      Instrument.restore({
        symbol: row.symbol,
        name: row.name,
        marketCode: row.market_code,
        currency: row.currency,
        sector: row.sector,
        status: row.status,
      }),
    );
  }

  async findBySymbol(symbol: string): Promise<Instrument | null> {
    const normalizedSymbol = symbol.trim().toUpperCase();
    const [rows] = await this.pool.query<InstrumentRow[]>(
      `SELECT symbol, name, market_code, currency, sector, status
       FROM market_instruments
       WHERE symbol = ? AND status = 'ACTIVE'`,
      [normalizedSymbol],
    );
    const row = rows[0];

    if (!row) {
      return null;
    }

    return Instrument.restore({
      symbol: row.symbol,
      name: row.name,
      marketCode: row.market_code,
      currency: row.currency,
      sector: row.sector,
      status: row.status,
    });
  }
}
