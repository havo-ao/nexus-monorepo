export const INSTRUMENT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type InstrumentStatus =
  (typeof INSTRUMENT_STATUS)[keyof typeof INSTRUMENT_STATUS];

export interface InstrumentSnapshot {
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

export class Instrument {
  private constructor(private readonly snapshot: InstrumentSnapshot) {}

  static restore(snapshot: InstrumentSnapshot): Instrument {
    if (typeof snapshot.symbol !== 'string' || !snapshot.symbol.trim()) {
      throw new TypeError('Instrument symbol is required');
    }

    if (typeof snapshot.name !== 'string' || !snapshot.name.trim()) {
      throw new TypeError('Instrument name is required');
    }

    if (
      typeof snapshot.marketCode !== 'string' ||
      !snapshot.marketCode.trim()
    ) {
      throw new TypeError('Instrument market code is required');
    }

    if (!/^[A-Za-z]{3}$/.test(snapshot.currency.trim())) {
      throw new TypeError('Instrument currency must use ISO 4217 format');
    }

    if (typeof snapshot.sector !== 'string' || !snapshot.sector.trim()) {
      throw new TypeError('Instrument sector is required');
    }

    if (
      snapshot.status !== INSTRUMENT_STATUS.ACTIVE &&
      snapshot.status !== INSTRUMENT_STATUS.INACTIVE
    ) {
      throw new TypeError('Instrument status must be ACTIVE or INACTIVE');
    }

    return new Instrument({
      symbol: snapshot.symbol.trim().toUpperCase(),
      name: snapshot.name.trim(),
      marketCode: snapshot.marketCode.trim().toUpperCase(),
      currency: snapshot.currency.trim().toUpperCase(),
      sector: snapshot.sector.trim(),
      status: snapshot.status,
      assetType: this.normalizeOptionalText(snapshot.assetType),
      industry: this.normalizeOptionalText(snapshot.industry),
      country: this.normalizeOptionalText(snapshot.country),
      description: this.normalizeOptionalText(snapshot.description),
      metadataProvider: this.normalizeOptionalText(snapshot.metadataProvider),
      metadataUpdatedAt: this.normalizeOptionalDate(snapshot.metadataUpdatedAt),
    });
  }

  isAvailable(): boolean {
    return this.snapshot.status === INSTRUMENT_STATUS.ACTIVE;
  }

  toSnapshot(): InstrumentSnapshot {
    return { ...this.snapshot };
  }

  private static normalizeOptionalText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private static normalizeOptionalDate(value: unknown): Date | undefined {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      return undefined;
    }

    return new Date(value);
  }
}
