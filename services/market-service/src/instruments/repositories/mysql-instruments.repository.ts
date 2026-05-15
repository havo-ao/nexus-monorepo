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
}
