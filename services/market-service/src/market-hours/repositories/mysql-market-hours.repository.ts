import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MYSQL_POOL } from '../../../database/database.module';
import { MarketHours } from '../entities/market-hours.entity';
import type {
  MarketConfigurationChange,
  MarketHoursRepository,
} from './market-hours.repository';

interface MarketHoursConfigRow extends RowDataPacket {
  market_code: string;
  timezone: string;
  open_hour: number;
  open_minute: number;
  close_hour: number;
  close_minute: number;
  operating_days: string | number[];
}

interface MarketRestrictionRow extends RowDataPacket {
  restriction_date: string;
  status: 'CLOSED' | 'RESTRICTED';
  reason: string;
}

@Injectable()
export class MysqlMarketHoursRepository implements MarketHoursRepository {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  async findByMarketCode(marketCode: string): Promise<MarketHours | null> {
    const normalizedMarketCode = marketCode.toUpperCase();
    const [configRows] = await this.pool.query<MarketHoursConfigRow[]>(
      `SELECT market_code, timezone, open_hour, open_minute, close_hour, close_minute, operating_days
       FROM market_hours_configs
       WHERE market_code = ?`,
      [normalizedMarketCode],
    );

    const config = configRows[0];

    if (!config) {
      return null;
    }

    const [restrictionRows] = await this.pool.query<MarketRestrictionRow[]>(
      `SELECT DATE_FORMAT(restriction_date, '%Y-%m-%d') AS restriction_date, status, reason
       FROM market_restrictions
       WHERE market_code = ?
       ORDER BY restriction_date ASC`,
      [normalizedMarketCode],
    );

    return MarketHours.restore({
      marketCode: config.market_code,
      timezone: config.timezone,
      openTime: {
        hour: config.open_hour,
        minute: config.open_minute,
      },
      closeTime: {
        hour: config.close_hour,
        minute: config.close_minute,
      },
      operatingDays: this.parseOperatingDays(config.operating_days),
      restrictions: restrictionRows.map((row) => ({
        date: row.restriction_date,
        status: row.status,
        reason: row.reason,
      })),
    });
  }

  async save(
    marketHours: MarketHours,
    change: MarketConfigurationChange,
  ): Promise<MarketHours> {
    const snapshot = marketHours.toSnapshot();
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();
      await connection.execute(
        `INSERT INTO market_hours_configs
          (market_code, timezone, open_hour, open_minute, close_hour, close_minute, operating_days)
         VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON))
         ON DUPLICATE KEY UPDATE
          timezone = VALUES(timezone),
          open_hour = VALUES(open_hour),
          open_minute = VALUES(open_minute),
          close_hour = VALUES(close_hour),
          close_minute = VALUES(close_minute),
          operating_days = VALUES(operating_days)`,
        [
          snapshot.marketCode,
          snapshot.timezone,
          snapshot.openTime.hour,
          snapshot.openTime.minute,
          snapshot.closeTime.hour,
          snapshot.closeTime.minute,
          JSON.stringify(snapshot.operatingDays),
        ],
      );

      await connection.execute(
        'DELETE FROM market_restrictions WHERE market_code = ?',
        [snapshot.marketCode],
      );

      for (const restriction of snapshot.restrictions) {
        await connection.execute(
          `INSERT INTO market_restrictions
            (market_code, restriction_date, status, reason)
           VALUES (?, ?, ?, ?)`,
          [
            snapshot.marketCode,
            restriction.date,
            restriction.status,
            restriction.reason,
          ],
        );
      }

      await connection.execute(
        `INSERT INTO market_configuration_events
          (market_code, change_type, actor, context)
         VALUES (?, ?, ?, ?)`,
        [change.marketCode, change.changeType, change.actor, change.context],
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return marketHours;
  }

  private parseOperatingDays(value: string | number[]): number[] {
    if (Array.isArray(value)) {
      return value;
    }

    try {
      const parsedValue = JSON.parse(value) as unknown;

      if (Array.isArray(parsedValue)) {
        const operatingDays: number[] = [];

        for (const day of parsedValue as unknown[]) {
          if (!Number.isInteger(day)) {
            throw new InternalServerErrorException(
              'Stored market operating days must contain only integers',
            );
          }

          operatingDays.push(day as number);
        }

        return operatingDays;
      }
    } catch {
      throw new InternalServerErrorException(
        'Stored market operating days are invalid',
      );
    }

    throw new InternalServerErrorException(
      'Stored market operating days must be an array of weekdays',
    );
  }
}
