import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Instrument } from '../entities/instrument.entity';
import {
  INSTRUMENT_METADATA_PROVIDER,
  type InstrumentMetadataProvider,
} from '../providers/instrument-metadata.provider';
import { INSTRUMENTS_REPOSITORY } from '../repositories/instruments.repository';
import type { InstrumentsRepository } from '../repositories/instruments.repository';
import { InstrumentDetailService } from './instrument-detail.service';
import { InstrumentMetadataSyncService } from './instrument-metadata-sync.service';

describe('InstrumentMetadataSyncService', () => {
  const repository: jest.Mocked<InstrumentsRepository> = {
    saveInstruments: jest.fn(),
    updateInstrumentMetadata: jest.fn(),
    findAvailable: jest.fn(),
    findBySymbol: jest.fn(),
  };
  const provider: jest.Mocked<InstrumentMetadataProvider> = {
    name: 'alpha-vantage-overview',
    fetchMetadata: jest.fn(),
  };
  const detailService = {
    getInstrumentDetail: jest.fn(),
  };

  let service: InstrumentMetadataSyncService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstrumentMetadataSyncService,
        {
          provide: INSTRUMENTS_REPOSITORY,
          useValue: repository,
        },
        {
          provide: INSTRUMENT_METADATA_PROVIDER,
          useValue: provider,
        },
        {
          provide: InstrumentDetailService,
          useValue: detailService,
        },
      ],
    }).compile();

    service = module.get<InstrumentMetadataSyncService>(
      InstrumentMetadataSyncService,
    );
  });

  it('synchronizes provider metadata and returns refreshed detail', async () => {
    repository.findBySymbol.mockResolvedValue(
      Instrument.restore({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Unclassified',
        status: 'ACTIVE',
      }),
    );
    provider.fetchMetadata.mockResolvedValue({
      name: 'Apple Inc.',
      sector: 'Technology',
      assetType: 'Common Stock',
      industry: 'Consumer Electronics',
      country: 'USA',
      description: 'Apple overview',
      metadataProvider: 'alpha-vantage-overview',
      metadataUpdatedAt: new Date('2026-05-20T18:00:00.000Z'),
    });
    detailService.getInstrumentDetail.mockResolvedValue({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      marketCode: 'NASDAQ',
      currency: 'USD',
      sector: 'Technology',
      status: 'ACTIVE',
      assetType: 'Common Stock',
      industry: 'Consumer Electronics',
      country: 'USA',
      description: 'Apple overview',
      metadataProvider: 'alpha-vantage-overview',
      metadataUpdatedAt: '2026-05-20T18:00:00.000Z',
      quote: null,
    });

    await expect(service.synchronizeMetadata(' aapl ')).resolves.toEqual(
      expect.objectContaining({
        status: 'SUCCESS',
        provider: 'alpha-vantage-overview',
        symbol: 'AAPL',
        preservedLastKnownMetadata: false,
      }),
    );
    expect(repository.updateInstrumentMetadata.mock.calls[0]).toEqual([
      'AAPL',
      expect.objectContaining({
        sector: 'Technology',
        industry: 'Consumer Electronics',
      }),
    ]);
  });

  it('preserves current metadata when provider fails', async () => {
    repository.findBySymbol.mockResolvedValue(
      Instrument.restore({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
        status: 'ACTIVE',
      }),
    );
    provider.fetchMetadata.mockRejectedValue(new Error('provider timeout'));
    detailService.getInstrumentDetail.mockResolvedValue({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      marketCode: 'NASDAQ',
      currency: 'USD',
      sector: 'Technology',
      status: 'ACTIVE',
      assetType: null,
      industry: null,
      country: null,
      description: null,
      metadataProvider: null,
      metadataUpdatedAt: null,
      quote: null,
    });

    await expect(service.synchronizeMetadata('AAPL')).resolves.toEqual(
      expect.objectContaining({
        status: 'FAILED',
        preservedLastKnownMetadata: true,
      }),
    );
    expect(repository.updateInstrumentMetadata.mock.calls).toHaveLength(0);
  });

  it('keeps existing core fields when provider metadata is partial', async () => {
    repository.findBySymbol.mockResolvedValue(
      Instrument.restore({
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
        status: 'ACTIVE',
      }),
    );
    provider.fetchMetadata.mockResolvedValue({
      industry: 'Software - Infrastructure',
    });
    detailService.getInstrumentDetail.mockResolvedValue({
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      marketCode: 'NASDAQ',
      currency: 'USD',
      sector: 'Technology',
      status: 'ACTIVE',
      assetType: null,
      industry: 'Software - Infrastructure',
      country: null,
      description: null,
      metadataProvider: null,
      metadataUpdatedAt: null,
      quote: null,
    });

    await service.synchronizeMetadata('MSFT');

    expect(repository.updateInstrumentMetadata.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        name: 'Microsoft Corporation',
        sector: 'Technology',
        currency: 'USD',
        industry: 'Software - Infrastructure',
      }),
    );
  });

  it('rejects non-string symbols', async () => {
    await expect(
      service.synchronizeMetadata(undefined as unknown as string),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid or unavailable symbols', async () => {
    await expect(service.synchronizeMetadata(' ')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    repository.findBySymbol.mockResolvedValue(null);

    await expect(service.synchronizeMetadata('ZZZZ')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
