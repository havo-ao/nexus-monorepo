export type PriceAlertCondition = 'ABOVE_OR_EQUAL' | 'BELOW_OR_EQUAL';
export type PriceAlertStatus = 'ACTIVE' | 'TRIGGERED';

export interface PriceAlertSnapshot {
  id?: number;
  traderId: string;
  symbol: string;
  targetPrice: number;
  condition: PriceAlertCondition;
  status: PriceAlertStatus;
  createdAt: Date;
  triggeredAt: Date | null;
}

export class PriceAlert {
  private constructor(private readonly snapshot: PriceAlertSnapshot) {}

  static create(
    snapshot: Omit<PriceAlertSnapshot, 'status' | 'createdAt' | 'triggeredAt'> &
      Partial<Pick<PriceAlertSnapshot, 'status' | 'createdAt' | 'triggeredAt'>>,
  ): PriceAlert {
    return PriceAlert.restore({
      ...snapshot,
      status: snapshot.status ?? 'ACTIVE',
      createdAt: snapshot.createdAt ?? new Date(),
      triggeredAt: snapshot.triggeredAt ?? null,
    });
  }

  static restore(snapshot: PriceAlertSnapshot): PriceAlert {
    if (typeof snapshot.traderId !== 'string' || !snapshot.traderId.trim()) {
      throw new TypeError('Price alert trader id is required');
    }

    if (typeof snapshot.symbol !== 'string' || !snapshot.symbol.trim()) {
      throw new TypeError('Price alert symbol is required');
    }

    if (!Number.isFinite(snapshot.targetPrice) || snapshot.targetPrice <= 0) {
      throw new RangeError('Price alert target price must be positive');
    }

    if (
      snapshot.condition !== 'ABOVE_OR_EQUAL' &&
      snapshot.condition !== 'BELOW_OR_EQUAL'
    ) {
      throw new TypeError('Price alert condition is not supported');
    }

    if (snapshot.status !== 'ACTIVE' && snapshot.status !== 'TRIGGERED') {
      throw new TypeError('Price alert status is not supported');
    }

    this.assertValidDate(snapshot.createdAt, 'created timestamp');

    if (snapshot.triggeredAt) {
      this.assertValidDate(snapshot.triggeredAt, 'triggered timestamp');
    }

    return new PriceAlert({
      id: snapshot.id,
      traderId: snapshot.traderId.trim(),
      symbol: snapshot.symbol.trim().toUpperCase(),
      targetPrice: snapshot.targetPrice,
      condition: snapshot.condition,
      status: snapshot.status,
      createdAt: new Date(snapshot.createdAt),
      triggeredAt: snapshot.triggeredAt ? new Date(snapshot.triggeredAt) : null,
    });
  }

  isTriggeredBy(price: number): boolean {
    if (!Number.isFinite(price) || price <= 0) {
      throw new RangeError('Market price must be positive');
    }

    if (this.snapshot.condition === 'ABOVE_OR_EQUAL') {
      return price >= this.snapshot.targetPrice;
    }

    return price <= this.snapshot.targetPrice;
  }

  markTriggered(triggeredAt: Date): PriceAlert {
    PriceAlert.assertValidDate(triggeredAt, 'triggered timestamp');

    return PriceAlert.restore({
      ...this.snapshot,
      status: 'TRIGGERED',
      triggeredAt,
    });
  }

  toSnapshot(): PriceAlertSnapshot {
    return {
      ...this.snapshot,
      createdAt: new Date(this.snapshot.createdAt),
      triggeredAt: this.snapshot.triggeredAt
        ? new Date(this.snapshot.triggeredAt)
        : null,
    };
  }

  private static assertValidDate(value: Date, name: string): void {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new TypeError(`Price alert ${name} must be valid`);
    }
  }
}
