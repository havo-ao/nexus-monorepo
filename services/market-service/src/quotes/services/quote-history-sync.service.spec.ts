import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MarketQuote } from '../entities/market-quote.entity';
import { MARKET_HISTORY_PROVIDER } from '../providers/market-history-provider';
import type { MarketHistoryProvider } from '../providers/market-history-provider';
import { QUOTES_REPOSITORY } from '../repositories/quotes.repository';
import type { QuotesRepository } from '../repositories/quotes.repository';
import { QuoteHistorySyncService } from './quote-history-sync.service';

describe('QuoteHistorySyncService', () => {
  let service: QuoteHistorySyncService;

  const repository: jest.Mocked<QuotesRepository> = {
    saveQuotes: jest.fn(),
    saveQuoteHistory: jest.fn(),
    findLatestBySymbol: jest.fn(),
    findHistoryBySymbol: jest.fn(),
    recordSyncEvent: jest.fn(),
  };

  const provider: jest.Mocked<MarketHistoryProvider> = {
    name: 'test-history-provider',
    fetchDailyHistory: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.saveQuoteHistory.mockResolvedValue();
    repository.findHistoryBySymbol.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuoteHistorySyncService,
        {
          provide: QUOTES_REPOSITORY,
          useValue: repository,
        },
        {
          provide: MARKET_HISTORY_PROVIDER,
          useValue: provider,
        },
      ],
    }).compile();

    service = module.get<QuoteHistorySyncService>(QuoteHistorySyncService);
  });

  it('persists external historical quotes when provider responds', async () => {
    provider.fetchDailyHistory.mockResolvedValue([
      {
        symbol: 'AAPL',
        price: 180,
        bid: 179.95,
        ask: 180.05,
        currency: 'USD',
        provider: 'test-history-provider',
        asOf: new Date('2026-04-14T00:00:00.000Z'),
      },
    ]);

    const response = await service.synchronizePriceHistory(' aapl ');

    expect(response).toEqual(
      expect.objectContaining({
        status: 'SUCCESS',
        provider: 'test-history-provider',
        symbol: 'AAPL',
        updatedCount: 1,
        preservedLocalHistory: false,
      }),
    );
    expect(response.prices[0]).toEqual(
      expect.objectContaining({
        symbol: 'AAPL',
        price: 180,
      }),
    );
    expect(repository.saveQuoteHistory.mock.calls[0]).toEqual([
      [expect.any(MarketQuote)],
    ]);
  });

  it('preserves local history when provider fails', async () => {
    provider.fetchDailyHistory.mockRejectedValue(new Error('provider timeout'));
    repository.findHistoryBySymbol.mockResolvedValue([
      MarketQuote.fromProvider({
        symbol: 'AAPL',
        price: 175,
        bid: 174.95,
        ask: 175.05,
        currency: 'USD',
        provider: 'local-history',
        asOf: new Date('2026-04-13T00:00:00.000Z'),
      }),
    ]);

    const response = await service.synchronizePriceHistory('AAPL');

    expect(response.status).toBe('FAILED');
    expect(response.preservedLocalHistory).toBe(true);
    expect(response.updatedCount).toBe(0);
    expect(response.prices).toEqual([
      expect.objectContaining({
        symbol: 'AAPL',
        price: 175,
        provider: 'local-history',
      }),
    ]);
    expect(repository.saveQuoteHistory.mock.calls).toHaveLength(0);
  });

  it('rejects empty symbols', async () => {
    await expect(service.synchronizePriceHistory(' ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
