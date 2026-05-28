import { Instrument } from '../entities/instrument.entity';
import type { InstrumentSnapshot } from '../entities/instrument.entity';

export const INSTRUMENTS_REPOSITORY = Symbol('INSTRUMENTS_REPOSITORY');

export interface InstrumentsRepository {
  saveInstruments(instruments: Instrument[]): void | Promise<void>;
  updateInstrumentMetadata(
    symbol: string,
    metadata: Partial<InstrumentSnapshot>,
  ): void | Promise<void>;
  findAvailable(): Instrument[] | Promise<Instrument[]>;
  findBySymbol(symbol: string): Instrument | null | Promise<Instrument | null>;
}
