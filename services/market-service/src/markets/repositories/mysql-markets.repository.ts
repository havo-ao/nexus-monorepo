import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MYSQL_POOL } from '../../../database/database.module';
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

@Injectable()
export class MysqlMarketsRepository implements MarketsRepository {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  async findAvailable(): Promise<Market[]> {
    const [rows] = await this.pool.query<MarketCatalogRow[]>(
      `SELECT code, name, country, currency, timezone, status
       FROM market_catalog
       WHERE status = 'ACTIVE'
       ORDER BY code ASC`,
    );

    const symbolsByMarket = await this.findRepresentativeSymbols();

    return rows.map((row) => this.toMarket(row, symbolsByMarket));
  }

  private async findRepresentativeSymbols(): Promise<Map<string, string[]>> {
    const [rows] = await this.pool.query<MarketSymbolRow[]>(
      `SELECT symbols.market_code, symbols.symbol
       FROM market_representative_symbols symbols
       INNER JOIN market_catalog markets ON markets.code = symbols.market_code
       WHERE markets.status = 'ACTIVE'
       ORDER BY symbols.market_code ASC, symbols.symbol ASC`,
    );

    const symbolsByMarket = new Map<string, string[]>();

    for (const row of rows) {
      const marketSymbols = symbolsByMarket.get(row.market_code) ?? [];
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
