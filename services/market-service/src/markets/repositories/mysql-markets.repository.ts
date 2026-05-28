import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MYSQL_POOL } from '../../../database/database.module';
import { resolveSupportedSymbols } from '../../instruments/utils/supported-symbols.util';
import { Market } from '../entities/market.entity';
import type { MarketStatus } from '../entities/market.entity';
import type { MarketsRepository } from './markets.repository';

interface MarketCatalogRow extends RowDataPacket {
  code: string;
  name: string;
  country: string;
  currency: string;
  timezone: string;
  status: MarketStatus;
}

interface MarketSymbolRow extends RowDataPacket {
  market_code: string;
  symbol: string;
}

const REPRESENTATIVE_SYMBOLS_LIMIT = 5;

@Injectable()
export class MysqlMarketsRepository implements MarketsRepository {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  async findAvailable(): Promise<Market[]> {
    const [rows] = await this.pool.query<MarketCatalogRow[]>(
      `SELECT code, name, country, currency, timezone, status
       FROM market_catalog
       WHERE status = 'ACTIVE'
         AND EXISTS (
           SELECT 1
           FROM market_instruments instruments
           WHERE instruments.market_code = market_catalog.code
             AND instruments.status = 'ACTIVE'
         )
       ORDER BY code ASC`,
    );

    const symbolsByMarket = await this.findRepresentativeSymbols();

    return rows
      .map((row) => this.toMarket(row, symbolsByMarket))
      .filter((market) => market.toSnapshot().representativeSymbols.length > 0);
  }

  private async findRepresentativeSymbols(): Promise<Map<string, string[]>> {
    const [rows] = await this.pool.query<MarketSymbolRow[]>(
      `SELECT instruments.market_code, instruments.symbol
       FROM market_instruments instruments
       INNER JOIN market_catalog markets ON markets.code = instruments.market_code
       WHERE markets.status = 'ACTIVE'
         AND instruments.status = 'ACTIVE'
       ORDER BY instruments.market_code ASC, instruments.symbol ASC`,
    );

    const symbolsByMarket = new Map<string, string[]>();

    const supportedSymbols = resolveSupportedSymbols();

    for (const row of rows) {
      if (!supportedSymbols.has(row.symbol.trim().toUpperCase())) {
        continue;
      }

      const marketSymbols = symbolsByMarket.get(row.market_code) ?? [];
      if (marketSymbols.length >= REPRESENTATIVE_SYMBOLS_LIMIT) {
        continue;
      }

      marketSymbols.push(row.symbol);
      symbolsByMarket.set(row.market_code, marketSymbols);
    }

    return symbolsByMarket;
  }

  private toMarket(
    row: MarketCatalogRow,
    symbolsByMarket: Map<string, string[]>,
  ): Market {
    return Market.restore({
      code: row.code,
      name: row.name,
      country: row.country,
      currency: row.currency,
      timezone: row.timezone,
      status: row.status,
      representativeSymbols: symbolsByMarket.get(row.code) ?? [],
    });
  }
}
