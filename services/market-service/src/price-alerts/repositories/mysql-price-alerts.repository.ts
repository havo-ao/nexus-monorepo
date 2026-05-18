import { Inject, Injectable } from '@nestjs/common';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { MYSQL_POOL } from '../../../database/database.module';
import { PriceAlert } from '../entities/price-alert.entity';
import type {
  PriceAlertCondition,
  PriceAlertStatus,
} from '../entities/price-alert.entity';
import { PriceAlertEvent } from '../entities/price-alert-event.entity';
import type { PriceAlertsRepository } from './price-alerts.repository';

interface PriceAlertRow extends RowDataPacket {
  id: number;
  trader_id: string;
  symbol: string;
  target_price: string;
  condition_type: PriceAlertCondition;
  status: PriceAlertStatus;
  created_at: Date;
  triggered_at: Date | null;
}

@Injectable()
export class MysqlPriceAlertsRepository implements PriceAlertsRepository {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  async saveAlert(alert: PriceAlert): Promise<PriceAlert> {
    const snapshot = alert.toSnapshot();
    const [result] = await this.pool.execute(
      `INSERT INTO market_price_alerts (
         trader_id, symbol, target_price, condition_type, status, created_at, triggered_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        snapshot.traderId,
        snapshot.symbol,
        snapshot.targetPrice,
        snapshot.condition,
        snapshot.status,
        snapshot.createdAt,
        snapshot.triggeredAt,
      ],
    );

    return PriceAlert.restore({
      ...snapshot,
      id: (result as ResultSetHeader).insertId,
    });
  }

  async findByTraderId(traderId: string): Promise<PriceAlert[]> {
    const [rows] = await this.pool.query<PriceAlertRow[]>(
      `SELECT id, trader_id, symbol, target_price, condition_type, status, created_at, triggered_at
       FROM market_price_alerts
       WHERE trader_id = ?
       ORDER BY created_at DESC, id DESC`,
      [traderId.trim()],
    );

    return rows.map((row) => this.toAlert(row));
  }

  async findActiveAlerts(): Promise<PriceAlert[]> {
    const [rows] = await this.pool.query<PriceAlertRow[]>(
      `SELECT id, trader_id, symbol, target_price, condition_type, status, created_at, triggered_at
       FROM market_price_alerts
       WHERE status = ?
       ORDER BY created_at ASC, id ASC`,
      ['ACTIVE'],
    );

    return rows.map((row) => this.toAlert(row));
  }

  async markTriggered(alert: PriceAlert): Promise<void> {
    const snapshot = alert.toSnapshot();

    await this.pool.execute(
      `UPDATE market_price_alerts
       SET status = ?, triggered_at = ?
       WHERE id = ?`,
      [snapshot.status, snapshot.triggeredAt, snapshot.id as number],
    );
  }

  async recordEvent(event: PriceAlertEvent): Promise<void> {
    const snapshot = event.toSnapshot();

    await this.pool.execute(
      `INSERT INTO market_price_alert_events (
         alert_id, trader_id, symbol, target_price, market_price, condition_type, occurred_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        snapshot.alertId,
        snapshot.traderId,
        snapshot.symbol,
        snapshot.targetPrice,
        snapshot.marketPrice,
        snapshot.condition,
        snapshot.occurredAt,
      ],
    );
  }

  private toAlert(row: PriceAlertRow): PriceAlert {
    return PriceAlert.restore({
      id: row.id,
      traderId: row.trader_id,
      symbol: row.symbol,
      targetPrice: Number(row.target_price),
      condition: row.condition_type,
      status: row.status,
      createdAt: new Date(row.created_at),
      triggeredAt: row.triggered_at ? new Date(row.triggered_at) : null,
    });
  }
}
