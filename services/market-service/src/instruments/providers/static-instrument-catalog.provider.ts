import { Injectable } from '@nestjs/common';
import {
  INSTRUMENT_STATUS,
  type InstrumentSnapshot,
} from '../entities/instrument.entity';
import type { InstrumentCatalogProvider } from './instrument-catalog.provider';

@Injectable()
export class StaticInstrumentCatalogProvider implements InstrumentCatalogProvider {
  readonly name = 'alpha-vantage-listing-compatible';

  fetchInstruments(): Promise<InstrumentSnapshot[]> {
    return Promise.resolve([
      this.toInstrument('AAPL', 'Apple Inc.', 'NASDAQ', 'USD', 'Technology'),
      this.toInstrument(
        'MSFT',
        'Microsoft Corporation',
        'NASDAQ',
        'USD',
        'Technology',
      ),
      this.toInstrument(
        'TSLA',
        'Tesla Inc.',
        'NASDAQ',
        'USD',
        'Consumer Cyclical',
      ),
      this.toInstrument(
        'JPM',
        'JPMorgan Chase & Co.',
        'NYSE',
        'USD',
        'Financial Services',
      ),
      this.toInstrument(
        'KO',
        'The Coca-Cola Company',
        'NYSE',
        'USD',
        'Consumer Defensive',
      ),
    ]);
  }

  private toInstrument(
    symbol: string,
    name: string,
    marketCode: string,
    currency: string,
    sector: string,
  ): InstrumentSnapshot {
    return {
      symbol,
      name,
      marketCode,
      currency,
      sector,
      status: INSTRUMENT_STATUS.ACTIVE,
    };
  }
}
