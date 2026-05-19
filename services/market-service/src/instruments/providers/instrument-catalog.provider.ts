import type { InstrumentSnapshot } from '../entities/instrument.entity';

export const INSTRUMENT_CATALOG_PROVIDER = Symbol(
  'INSTRUMENT_CATALOG_PROVIDER',
);

export interface InstrumentCatalogProvider {
  readonly name: string;
  fetchInstruments(): Promise<InstrumentSnapshot[]>;
}
