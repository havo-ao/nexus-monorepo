import { Injectable } from '@nestjs/common';
import {
  Instrument,
  INSTRUMENT_STATUS,
  type InstrumentSnapshot,
} from '../entities/instrument.entity';
import type { InstrumentsRepository } from './instruments.repository';

const NASDAQ_MARKET = 'NASDAQ';
const NYSE_MARKET = 'NYSE';
const USD_CURRENCY = 'USD';
const TECHNOLOGY_SECTOR = 'Technology';
const FINANCIAL_SERVICES_SECTOR = 'Financial Services';

const ACTIVE_INSTRUMENT_ROWS: Array<
  readonly [
    symbol: string,
    name: string,
    marketCode: string,
    currency: string,
    sector: string,
  ]
> = [
  ['AAPL', 'Apple Inc.', NASDAQ_MARKET, USD_CURRENCY, TECHNOLOGY_SECTOR],
  [
    'MSFT',
    'Microsoft Corporation',
    NASDAQ_MARKET,
    USD_CURRENCY,
    TECHNOLOGY_SECTOR,
  ],
  ['TSLA', 'Tesla Inc.', NASDAQ_MARKET, USD_CURRENCY, 'Consumer Cyclical'],
  [
    'JPM',
    'JPMorgan Chase & Co.',
    NYSE_MARKET,
    USD_CURRENCY,
    FINANCIAL_SERVICES_SECTOR,
  ],
  [
    'KO',
    'The Coca-Cola Company',
    NYSE_MARKET,
    USD_CURRENCY,
    'Consumer Defensive',
  ],
  ['HSBC', 'HSBC Holdings plc', 'LSE', 'GBP', FINANCIAL_SERVICES_SECTOR],
];

function toActiveInstrumentSnapshot(
  row: (typeof ACTIVE_INSTRUMENT_ROWS)[number],
): InstrumentSnapshot {
  const [symbol, name, marketCode, currency, sector] = row;

  return {
    symbol,
    name,
    marketCode,
    currency,
    sector,
    status: INSTRUMENT_STATUS.ACTIVE,
  };
}

@Injectable()
export class InMemoryInstrumentsRepository implements InstrumentsRepository {
  private readonly instruments = new Map(
    ACTIVE_INSTRUMENT_ROWS.map((row) => {
      const instrument = Instrument.restore(toActiveInstrumentSnapshot(row));

      return [instrument.toSnapshot().symbol, instrument];
    }),
  );

  saveInstruments(instruments: Instrument[]): void {
    for (const instrument of instruments) {
      this.instruments.set(instrument.toSnapshot().symbol, instrument);
    }
  }

  updateInstrumentMetadata(
    symbol: string,
    metadata: Partial<InstrumentSnapshot>,
  ): void {
    const normalizedSymbol = symbol.trim().toUpperCase();
    const instrument = this.instruments.get(normalizedSymbol);

    if (!instrument) {
      return;
    }

    this.instruments.set(
      normalizedSymbol,
      Instrument.restore({
        ...instrument.toSnapshot(),
        ...metadata,
        symbol: normalizedSymbol,
      }),
    );
  }

  findAvailable(): Instrument[] {
    return [...this.instruments.values()]
      .filter((instrument) => instrument.isAvailable())
      .sort((leftInstrument, rightInstrument) =>
        leftInstrument
          .toSnapshot()
          .symbol.localeCompare(rightInstrument.toSnapshot().symbol),
      );
  }

  findBySymbol(symbol: string): Instrument | null {
    const normalizedSymbol = symbol.trim().toUpperCase();

    return this.instruments.get(normalizedSymbol) ?? null;
  }
}
