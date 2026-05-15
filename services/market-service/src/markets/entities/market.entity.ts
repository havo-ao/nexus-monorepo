export type MarketStatus = 'ACTIVE' | 'INACTIVE';

export interface MarketSnapshot {
  code: string;
  name: string;
  country: string;
  currency: string;
  timezone: string;
  status: MarketStatus;
  representativeSymbols: string[];
}

export class Market {
  private constructor(private readonly snapshot: MarketSnapshot) {}

  static restore(snapshot: MarketSnapshot): Market {
    if (typeof snapshot.code !== 'string' || !snapshot.code.trim()) {
      throw new TypeError('Market code is required');
    }

    if (typeof snapshot.name !== 'string' || !snapshot.name.trim()) {
      throw new TypeError('Market name is required');
    }

    if (typeof snapshot.country !== 'string' || !snapshot.country.trim()) {
      throw new TypeError('Market country is required');
    }

    if (!/^[A-Za-z]{3}$/.test(snapshot.currency.trim())) {
      throw new TypeError('Market currency must use ISO 4217 format');
    }

    if (typeof snapshot.timezone !== 'string' || !snapshot.timezone.trim()) {
      throw new TypeError('Market timezone is required');
    }

    if (snapshot.status !== 'ACTIVE' && snapshot.status !== 'INACTIVE') {
      throw new TypeError('Market status must be ACTIVE or INACTIVE');
    }

    if (!Array.isArray(snapshot.representativeSymbols)) {
      throw new TypeError('Market representative symbols must be an array');
    }

    return new Market({
      code: snapshot.code.trim().toUpperCase(),
      name: snapshot.name.trim(),
      country: snapshot.country.trim(),
      currency: snapshot.currency.trim().toUpperCase(),
      timezone: snapshot.timezone.trim(),
      status: snapshot.status,
      representativeSymbols: snapshot.representativeSymbols
        .map((symbol) => {
          if (typeof symbol !== 'string' || !symbol.trim()) {
            throw new TypeError(
              'Market representative symbols must be non-empty strings',
            );
          }

          return symbol.trim().toUpperCase();
        })
        .sort((leftSymbol, rightSymbol) =>
          leftSymbol.localeCompare(rightSymbol),
        ),
    });
  }

  isAvailable(): boolean {
    return this.snapshot.status === 'ACTIVE';
  }

  toSnapshot(): MarketSnapshot {
    return {
      ...this.snapshot,
      representativeSymbols: [...this.snapshot.representativeSymbols],
    };
  }
}
