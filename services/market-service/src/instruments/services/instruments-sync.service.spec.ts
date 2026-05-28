import { Test, TestingModule } from '@nestjs/testing';
import { Instrument } from '../entities/instrument.entity';
import {
  INSTRUMENT_CATALOG_PROVIDER,
  type InstrumentCatalogProvider,
} from '../providers/instrument-catalog.provider';
import { INSTRUMENTS_REPOSITORY } from '../repositories/instruments.repository';
import type { InstrumentsRepository } from '../repositories/instruments.repository';
import { InstrumentsService } from './instruments.service';
import { InstrumentsSyncService } from './instruments-sync.service';

describe('InstrumentsSyncService', () => {
  let service: InstrumentsSyncService;

  const repository: jest.Mocked<InstrumentsRepository> = {
    saveInstruments: jest.fn(),
    findAvailable: jest.fn(),
    findBySymbol: jest.fn(),
  };

  const provider: jest.Mocked<InstrumentCatalogProvider> = {
    name: 'test-catalog-provider',
    fetchInstruments: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.saveInstruments.mockResolvedValue();
    repository.findAvailable.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstrumentsService,
        InstrumentsSyncService,
        {
          provide: INSTRUMENTS_REPOSITORY,
          useValue: repository,
        },
        {
          provide: INSTRUMENT_CATALOG_PROVIDER,
          useValue: provider,
        },
      ],
    }).compile();

    service = module.get<InstrumentsSyncService>(InstrumentsSyncService);
  });

  it('synchronizes instruments when provider responds successfully', async () => {
    provider.fetchInstruments.mockResolvedValue([
      {
        symbol: 'nvda',
        name: 'NVIDIA Corporation',
        marketCode: 'nasdaq',
        currency: 'usd',
        sector: 'Unclassified',
        status: 'ACTIVE',
      },
    ]);

    const response = await service.synchronizeInstruments();

    expect(response).toEqual(
      expect.objectContaining({
        status: 'SUCCESS',
        provider: 'test-catalog-provider',
        updatedCount: 1,
        preservedLocalCatalog: false,
      }),
    );
    expect(response.instruments[0]).toEqual(
      expect.objectContaining({
        symbol: 'NVDA',
        marketCode: 'NASDAQ',
        currency: 'USD',
      }),
    );
    expect(repository.saveInstruments.mock.calls[0]).toEqual([
      [expect.any(Instrument)],
    ]);
  });

  it('preserves local catalog when provider fails', async () => {
    provider.fetchInstruments.mockRejectedValue(new Error('provider timeout'));
    repository.findAvailable.mockResolvedValue([
      Instrument.restore({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
        status: 'ACTIVE',
      }),
    ]);

    const response = await service.synchronizeInstruments();

    expect(response.status).toBe('FAILED');
    expect(response.preservedLocalCatalog).toBe(true);
    expect(response.updatedCount).toBe(0);
    expect(response.instruments).toEqual([
      expect.objectContaining({
        symbol: 'AAPL',
        name: 'Apple Inc.',
      }),
    ]);
    expect(repository.saveInstruments.mock.calls).toHaveLength(0);
  });
});
