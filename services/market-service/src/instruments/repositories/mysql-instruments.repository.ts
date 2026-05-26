import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MYSQL_POOL } from '../../../database/database.module';
import {
  Instrument,
  type InstrumentSnapshot,
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
  asset_type: string | null;
  industry: string | null;
  country: string | null;
  description: string | null;
  metadata_provider: string | null;
  metadata_updated_at: Date | null;
}

interface InstrumentPersistenceSnapshot {
  symbol: string;
  name: string;
  marketCode: string;
  currency: string;
  sector: string;
  status: InstrumentStatus;
  assetType?: string | null;
  industry?: string | null;
  country?: string | null;
  description?: string | null;
  metadataProvider?: string | null;
  metadataUpdatedAt?: Date | null;
}

const INSERT_CHUNK_SIZE = 500;
const DEFAULT_SECTOR = 'Unclassified';

@Injectable()
export class MysqlInstrumentsRepository implements InstrumentsRepository {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  async saveInstruments(instruments: Instrument[]): Promise<void> {
    if (instruments.length === 0) {
      return;
    }

    const snapshots = instruments.map((instrument) => instrument.toSnapshot());

    for (const chunk of this.chunkSnapshots(snapshots)) {
      await this.pool.query(
        `INSERT INTO market_instruments
          (symbol, name, market_code, currency, sector, status, asset_type, industry, country, description, metadata_provider, metadata_updated_at)
         VALUES ${this.buildInstrumentValuePlaceholders(chunk.length)}
         ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          market_code = VALUES(market_code),
          currency = VALUES(currency),
          sector = CASE
            WHEN market_instruments.sector = 'Unclassified' THEN VALUES(sector)
            ELSE market_instruments.sector
          END,
          status = VALUES(status)`,
        this.toInsertParameters(chunk),
      );
    }

    await this.deactivateOutOfCatalogInstruments(snapshots);
    await this.deleteUnreferencedOutOfCatalogInstruments(snapshots);
  }

  async updateInstrumentMetadata(
    symbol: string,
    metadata: Partial<InstrumentSnapshot>,
  ): Promise<void> {
    const normalizedSymbol = symbol.trim().toUpperCase();

    await this.pool.query(
      `UPDATE market_instruments
       SET name = ?,
        sector = ?,
        asset_type = ?,
        industry = ?,
        country = ?,
        description = ?,
        metadata_provider = ?,
        metadata_updated_at = ?
       WHERE symbol = ?`,
      [
        metadata.name,
        metadata.sector,
        metadata.assetType ?? null,
        metadata.industry ?? null,
        metadata.country ?? null,
        metadata.description ?? null,
        metadata.metadataProvider ?? null,
        metadata.metadataUpdatedAt ?? null,
        normalizedSymbol,
      ],
    );
  }

  async findAvailable(): Promise<Instrument[]> {
    const [rows] = await this.pool.query<InstrumentRow[]>(
      `SELECT symbol, name, market_code, currency, sector, status,
        asset_type, industry, country, description, metadata_provider, metadata_updated_at
       FROM market_instruments
       WHERE status = 'ACTIVE'
       ORDER BY symbol ASC`,
    );

    return rows.map((row) => this.toInstrument(row));
  }

  async findBySymbol(symbol: string): Promise<Instrument | null> {
    const normalizedSymbol = symbol.trim().toUpperCase();
    const [rows] = await this.pool.query<InstrumentRow[]>(
      `SELECT symbol, name, market_code, currency, sector, status,
        asset_type, industry, country, description, metadata_provider, metadata_updated_at
       FROM market_instruments
       WHERE symbol = ? AND status = 'ACTIVE'`,
      [normalizedSymbol],
    );
    const row = rows[0];

    if (!row) {
      return null;
    }

    return this.toInstrument(row);
  }

  private chunkSnapshots(
    snapshots: InstrumentPersistenceSnapshot[],
  ): InstrumentPersistenceSnapshot[][] {
    const chunks: InstrumentPersistenceSnapshot[][] = [];

    for (let index = 0; index < snapshots.length; index += INSERT_CHUNK_SIZE) {
      chunks.push(snapshots.slice(index, index + INSERT_CHUNK_SIZE));
    }

    return chunks;
  }

  private buildInstrumentValuePlaceholders(count: number): string {
    return Array.from(
      { length: count },
      () => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).join(', ');
  }

  private buildSymbolPlaceholders(count: number): string {
    return Array.from({ length: count }, () => '?').join(', ');
  }

  private toInsertParameters(
    snapshots: InstrumentPersistenceSnapshot[],
  ): Array<string | Date | null> {
    return snapshots.flatMap((snapshot) => [
      snapshot.symbol,
      snapshot.name,
      snapshot.marketCode,
      snapshot.currency,
      snapshot.sector,
      snapshot.status,
      snapshot.assetType ?? null,
      snapshot.industry ?? null,
      snapshot.country ?? null,
      snapshot.description ?? null,
      snapshot.metadataProvider ?? null,
      snapshot.metadataUpdatedAt ?? null,
    ]);
  }

  private getSymbols(snapshots: InstrumentPersistenceSnapshot[]): string[] {
    return snapshots.map((snapshot) => snapshot.symbol);
  }

  private async deactivateOutOfCatalogInstruments(
    snapshots: InstrumentPersistenceSnapshot[],
  ): Promise<void> {
    const symbols = this.getSymbols(snapshots);

    await this.pool.query(
      `UPDATE market_instruments
       SET status = 'INACTIVE'
       WHERE symbol NOT IN (${this.buildSymbolPlaceholders(symbols.length)})`,
      symbols,
    );
  }

  private async deleteUnreferencedOutOfCatalogInstruments(
    snapshots: InstrumentPersistenceSnapshot[],
  ): Promise<void> {
    const symbols = this.getSymbols(snapshots);

    await this.pool.query(
      `DELETE instruments
       FROM market_instruments instruments
       LEFT JOIN market_watchlist_items watchlist
        ON watchlist.symbol = instruments.symbol
       LEFT JOIN market_price_alerts alerts
        ON alerts.symbol = instruments.symbol
       WHERE instruments.symbol NOT IN (${this.buildSymbolPlaceholders(
         symbols.length,
       )})
        AND watchlist.symbol IS NULL
        AND alerts.symbol IS NULL`,
      symbols,
    );
  }

  private toInstrument(row: InstrumentRow): Instrument {
    return Instrument.restore({
      symbol: row.symbol,
      name: row.name,
      marketCode: row.market_code,
      currency: row.currency,
      sector: this.normalizeRequiredText(row.sector, DEFAULT_SECTOR),
      status: row.status,
      assetType: row.asset_type,
      industry: row.industry,
      country: row.country,
      description: row.description,
      metadataProvider: row.metadata_provider,
      metadataUpdatedAt: row.metadata_updated_at,
    });
  }

  private normalizeRequiredText(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value : fallback;
  }
}
