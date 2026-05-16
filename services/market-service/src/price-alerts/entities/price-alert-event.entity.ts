export interface PriceAlertEventSnapshot {
  id?: number;
  alertId: number;
  traderId: string;
  symbol: string;
  targetPrice: number;
  marketPrice: number;
  condition: string;
  occurredAt: Date;
}

export class PriceAlertEvent {
  private constructor(private readonly snapshot: PriceAlertEventSnapshot) {}

  static create(snapshot: PriceAlertEventSnapshot): PriceAlertEvent {
    if (!Number.isInteger(snapshot.alertId) || snapshot.alertId <= 0) {
      throw new RangeError('Price alert event alert id must be positive');
    }

    if (typeof snapshot.traderId !== 'string' || !snapshot.traderId.trim()) {
      throw new TypeError('Price alert event trader id is required');
    }

    if (typeof snapshot.symbol !== 'string' || !snapshot.symbol.trim()) {
      throw new TypeError('Price alert event symbol is required');
    }

    if (!Number.isFinite(snapshot.targetPrice) || snapshot.targetPrice <= 0) {
      throw new RangeError('Price alert event target price must be positive');
    }

    if (!Number.isFinite(snapshot.marketPrice) || snapshot.marketPrice <= 0) {
      throw new RangeError('Price alert event market price must be positive');
    }

    if (typeof snapshot.condition !== 'string' || !snapshot.condition.trim()) {
      throw new TypeError('Price alert event condition is required');
    }

    if (
      !(snapshot.occurredAt instanceof Date) ||
      Number.isNaN(snapshot.occurredAt.getTime())
    ) {
      throw new TypeError('Price alert event timestamp must be valid');
    }

    return new PriceAlertEvent({
      id: snapshot.id,
      alertId: snapshot.alertId,
      traderId: snapshot.traderId.trim(),
      symbol: snapshot.symbol.trim().toUpperCase(),
      targetPrice: snapshot.targetPrice,
      marketPrice: snapshot.marketPrice,
      condition: snapshot.condition.trim(),
      occurredAt: new Date(snapshot.occurredAt),
    });
  }

  toSnapshot(): PriceAlertEventSnapshot {
    return {
      ...this.snapshot,
      occurredAt: new Date(this.snapshot.occurredAt),
    };
  }
}
