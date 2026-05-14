import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MARKET_DATA_PROVIDER } from '../providers/market-data-provider';
import type { MarketDataProvider } from '../providers/market-data-provider';
import { QUOTES_REPOSITORY } from '../repositories/quotes.repository';
import type { QuotesRepository } from '../repositories/quotes.repository';
import { MarketDataSyncService } from './market-data-sync.service';

describe('MarketDataSyncService', () => {
  let service: MarketDataSyncService;

  const repository: jest.Mocked<QuotesRepository> = {
    saveQuotes: jest.fn(),
    findLatestBySymbol: jest.fn(),
    recordSyncEvent: jest.fn(),
  };

  const provider: jest.Mocked<MarketDataProvider> = {
    name: 'test-provider',
    fetchQuote: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.saveQuotes.mockResolvedValue();
    repository.recordSyncEvent.mockResolvedValue();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketDataSyncService,
        {
          provide: QUOTES_REPOSITORY,
          useValue: repository,
        },
        {
          provide: MARKET_DATA_PROVIDER,
          useValue: provider,
        },
      ],
    }).compile();

    service = module.get<MarketDataSyncService>(MarketDataSyncService);
  });

  it('updates quotes when the provider responds successfully', async () => {
    provider.fetchQuote.mockResolvedValue({
      symbol: 'AAPL',
      price: 190,
      bid: 189.95,
      ask: 190.05,
      currency: 'USD',
      provider: 'test-provider',
      asOf: new Date('2026-05-14T14:00:00.000Z'),
    });

    const response = await service.synchronizeMarketData({
      symbols: ['aapl'],
      requestedBy: 'system@nexus.local',
    });

    expect(response.status).toBe('SUCCESS');
    expect(response.updatedQuotes).toEqual([
      expect.objectContaining({
        symbol: 'AAPL',
        price: 190,
        bid: 189.95,
        ask: 190.05,
        spread: 0.1,
      }),
    ]);
    expect(response.failedSymbols).toEqual([]);
    expect(repository.saveQuotes.mock.calls).toHaveLength(1);
    expect(repository.recordSyncEvent.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        status: 'SUCCESS',
        updatedCount: 1,
        failedCount: 0,
      }),
    );
  });

  it('records failure and preserves last known data when provider fails', async () => {
    provider.fetchQuote.mockRejectedValue(new Error('provider timeout'));

    const response = await service.synchronizeMarketData({
      symbols: ['AAPL'],
    });

    expect(response.status).toBe('FAILED');
    expect(response.updatedQuotes).toEqual([]);
    expect(response.failedSymbols).toEqual(['AAPL']);
    expect(response.preservedLastKnownData).toBe(true);
    expect(repository.saveQuotes.mock.calls).toHaveLength(0);
    expect(repository.recordSyncEvent.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        status: 'FAILED',
        updatedCount: 0,
        failedCount: 1,
      }),
    );
  });

  it('records partial failure when only some provider quotes are synchronized', async () => {
    provider.fetchQuote
      .mockResolvedValueOnce({
        symbol: 'AAPL',
        price: 190,
        bid: 189.95,
        ask: 190.05,
        currency: 'USD',
        provider: 'test-provider',
        asOf: new Date('2026-05-14T14:00:00.000Z'),
      })
      .mockRejectedValueOnce(new Error('provider timeout'));

    const response = await service.synchronizeMarketData({
      symbols: ['aapl', 'msft', 'aapl'],
    });

    expect(response.status).toBe('PARTIAL_FAILURE');
    expect(response.updatedQuotes).toHaveLength(1);
    expect(response.failedSymbols).toEqual(['MSFT']);
    expect(response.preservedLastKnownData).toBe(true);
    expect(repository.recordSyncEvent.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        requestedBy: 'system@nexus.local',
        symbolsCount: 2,
        updatedCount: 1,
        failedCount: 1,
      }),
    );
  });

  it('uses default symbols when request does not provide a symbols list', async () => {
    provider.fetchQuote.mockImplementation((symbol: string) =>
      Promise.resolve({
        symbol,
        price: 190,
        bid: 189.95,
        ask: 190.05,
        currency: 'USD',
        provider: 'test-provider',
        asOf: new Date('2026-05-14T14:00:00.000Z'),
      }),
    );

    const response = await service.synchronizeMarketData({});

    expect(response.status).toBe('SUCCESS');
    expect(response.updatedQuotes.map((quote) => quote.symbol)).toEqual([
      'AAPL',
      'MSFT',
      'TSLA',
    ]);
  });

  it('rejects blank requestedBy values', async () => {
    await expect(
      service.synchronizeMarketData({
        symbols: ['AAPL'],
        requestedBy: ' ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects empty symbols', async () => {
    await expect(
      service.synchronizeMarketData({ symbols: [' '] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
