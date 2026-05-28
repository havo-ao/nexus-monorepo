import type { InstrumentSnapshot } from '../entities/instrument.entity';

export const INSTRUMENT_METADATA_PROVIDER = Symbol(
  'INSTRUMENT_METADATA_PROVIDER',
);

export interface InstrumentMetadataProvider {
  readonly name: string;
  fetchMetadata(symbol: string): Promise<Partial<InstrumentSnapshot>>;
}
