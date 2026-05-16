import { Injectable } from '@nestjs/common';
import { PriceAlert } from '../entities/price-alert.entity';
import { PriceAlertEvent } from '../entities/price-alert-event.entity';
import type { PriceAlertsRepository } from './price-alerts.repository';

@Injectable()
export class InMemoryPriceAlertsRepository implements PriceAlertsRepository {
  private nextAlertId = 1;
  private readonly alerts = new Map<number, PriceAlert>();
  private readonly events: PriceAlertEvent[] = [];

  saveAlert(alert: PriceAlert): PriceAlert {
    const snapshot = alert.toSnapshot();
    const id = snapshot.id ?? this.nextAlertId;
    this.nextAlertId = Math.max(this.nextAlertId, id + 1);

    const savedAlert = PriceAlert.restore({ ...snapshot, id });
    this.alerts.set(id, savedAlert);

    return savedAlert;
  }

  findByTraderId(traderId: string): PriceAlert[] {
    return [...this.alerts.values()]
      .filter((alert) => alert.toSnapshot().traderId === traderId.trim())
      .sort((leftAlert, rightAlert) =>
        leftAlert
          .toSnapshot()
          .symbol.localeCompare(rightAlert.toSnapshot().symbol),
      );
  }

  findActiveAlerts(): PriceAlert[] {
    return [...this.alerts.values()].filter(
      (alert) => alert.toSnapshot().status === 'ACTIVE',
    );
  }

  markTriggered(alert: PriceAlert): void {
    const snapshot = alert.toSnapshot();

    if (snapshot.id) {
      this.alerts.set(snapshot.id, alert);
    }
  }

  recordEvent(event: PriceAlertEvent): void {
    this.events.push(event);
  }
}
