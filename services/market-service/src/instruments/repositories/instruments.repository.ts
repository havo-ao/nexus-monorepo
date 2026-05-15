import { Instrument } from '../entities/instrument.entity';

export const INSTRUMENTS_REPOSITORY = Symbol('INSTRUMENTS_REPOSITORY');

export interface InstrumentsRepository {
  findAvailable(): Instrument[] | Promise<Instrument[]>;
  findBySymbol(symbol: string): Instrument | null | Promise<Instrument | null>;
}
