import { Injectable } from '@nestjs/common';
import type { InstrumentSnapshot } from '../entities/instrument.entity';
import type { InstrumentMetadataProvider } from './instrument-metadata.provider';

const STATIC_METADATA = new Map<string, Partial<InstrumentSnapshot>>([
  [
    'AAPL',
    {
      assetType: 'Common Stock',
      industry: 'Consumer Electronics',
      country: 'USA',
      description:
        'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories.',
    },
  ],
  [
    'MSFT',
    {
      assetType: 'Common Stock',
      industry: 'Software - Infrastructure',
      country: 'USA',
      description:
        'Microsoft Corporation develops software, cloud services, devices, and business solutions.',
    },
  ],
]);

@Injectable()
export class StaticInstrumentMetadataProvider implements InstrumentMetadataProvider {
  readonly name = 'alpha-vantage-overview-compatible';

  fetchMetadata(symbol: string): Promise<Partial<InstrumentSnapshot>> {
    const normalizedSymbol = symbol.trim().toUpperCase();
    const metadata = STATIC_METADATA.get(normalizedSymbol);

    if (!metadata) {
      return Promise.reject(
        new TypeError(`Instrument ${normalizedSymbol} metadata not found`),
      );
    }

    return Promise.resolve({
      symbol: normalizedSymbol,
      ...metadata,
      metadataProvider: this.name,
      metadataUpdatedAt: new Date(),
    });
  }
}
