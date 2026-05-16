import { PriceAlert } from '../entities/price-alert.entity';
import { PriceAlertEvent } from '../entities/price-alert-event.entity';

export const PRICE_ALERTS_REPOSITORY = Symbol('PRICE_ALERTS_REPOSITORY');

export interface PriceAlertsRepository {
  saveAlert(alert: PriceAlert): PriceAlert | Promise<PriceAlert>;
  findByTraderId(traderId: string): PriceAlert[] | Promise<PriceAlert[]>;
  findActiveAlerts(): PriceAlert[] | Promise<PriceAlert[]>;
  markTriggered(alert: PriceAlert): void | Promise<void>;
  recordEvent(event: PriceAlertEvent): void | Promise<void>;
}
