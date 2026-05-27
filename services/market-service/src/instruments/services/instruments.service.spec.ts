import { Test, TestingModule } from '@nestjs/testing';
import { Instrument } from '../entities/instrument.entity';
import { INSTRUMENTS_REPOSITORY } from '../repositories/instruments.repository';
import type { InstrumentsRepository } from '../repositories/instruments.repository';
import { InstrumentsService } from './instruments.service';

describe('InstrumentsService', () => {
  const repository: jest.Mocked<InstrumentsRepository> = {
    saveInstruments: jest.fn(),
    updateInstrumentMetadata: jest.fn(),
    findAvailable: jest.fn(),
    findBySymbol: jest.fn(),
  };

  let service: InstrumentsService;

  beforeEach(async () => {
    jest.resetAllMocks();
    delete process.env.ALPHA_VANTAGE_INSTRUMENT_LIMIT;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstrumentsService,
        {
          provide: INSTRUMENTS_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<InstrumentsService>(InstrumentsService);
  });

  it('returns available instruments as API response DTOs', async () => {
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

    await expect(service.getAvailableInstruments()).resolves.toEqual([
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
        status: 'ACTIVE',
      },
    ]);
  });

  it('filters unsupported listings that cannot be enriched as common equities', async () => {
    repository.findAvailable.mockResolvedValue([
      Instrument.restore({
        symbol: 'AACIW',
        name: 'Armada Acquisition Corp I - Warrants (13/08/2026)',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Unclassified',
        status: 'ACTIVE',
        assetType: 'Stock',
      }),
      Instrument.restore({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
        status: 'ACTIVE',
        assetType: 'Stock',
      }),
    ]);

    await expect(service.getAvailableInstruments()).resolves.toEqual([
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
        status: 'ACTIVE',
      },
    ]);
  });

  it('limits the public catalog to the configured instrument count', async () => {
    process.env.ALPHA_VANTAGE_INSTRUMENT_LIMIT = '1';
    repository.findAvailable.mockResolvedValue([
      Instrument.restore({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
        status: 'ACTIVE',
        assetType: 'Stock',
      }),
      Instrument.restore({
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
        status: 'ACTIVE',
        assetType: 'Stock',
      }),
    ]);

    await expect(service.getAvailableInstruments()).resolves.toHaveLength(1);
  });

  it('uses the default catalog limit when the configured limit is invalid', async () => {
    process.env.ALPHA_VANTAGE_INSTRUMENT_LIMIT = 'invalid';
    repository.findAvailable.mockResolvedValue([
      Instrument.restore({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
        status: 'ACTIVE',
        assetType: 'Stock',
      }),
    ]);

    await expect(service.getAvailableInstruments()).resolves.toHaveLength(1);
  });

  it('filters listings outside the backend curated Alpha Vantage symbol set', async () => {
    repository.findAvailable.mockResolvedValue([
      Instrument.restore({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
        status: 'ACTIVE',
        assetType: 'Stock',
      }),
      Instrument.restore({
        symbol: 'ABXL',
        name: 'Abraxas Petroleum Corp',
        marketCode: 'NYSE',
        currency: 'USD',
        sector: 'Energy',
        status: 'ACTIVE',
        assetType: 'Stock',
      }),
    ]);

    await expect(service.getAvailableInstruments()).resolves.toEqual([
      expect.objectContaining({ symbol: 'AAPL' }),
    ]);
  });
});
