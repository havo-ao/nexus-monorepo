import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MarketQuote } from '../entities/market-quote.entity';
import { QUOTES_REPOSITORY } from '../repositories/quotes.repository';
import type { QuotesRepository } from '../repositories/quotes.repository';
import { QuoteHistoryService } from './quote-history.service';

describe('QuoteHistoryService', () => {
  let service: QuoteHistoryService;

  const repository: jest.Mocked<QuotesRepository> = {
    saveQuotes: jest.fn(),
    findLatestBySymbol: jest.fn(),
    findHistoryBySymbol: jest.fn(),
    recordSyncEvent: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuoteHistoryService,
        {
          provide: QUOTES_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<QuoteHistoryService>(QuoteHistoryService);
  });

  it('returns historical prices ordered by repository result', async () => {
    repository.findHistoryBySymbol.mockResolvedValue([
      MarketQuote.fromProvider({
        symbol: 'aapl',
        price: 190,
        bid: 189.95,
        ask: 190.05,
        currency: 'usd',
        provider: 'test-provider',
        asOf: new Date('2026-05-14T14:00:00.000Z'),
      }),
    ]);

    await expect(service.getPriceHistory(' aapl ')).resolves.toEqual({
      symbol: 'AAPL',
      prices: [
        {
          symbol: 'AAPL',
          price: 190,
          bid: 189.95,
          ask: 190.05,
          spread: 0.1,
          currency: 'USD',
          provider: 'test-provider',
          asOf: '2026-05-14T14:00:00.000Z',
        },
      ],
    });
    expect(repository.findHistoryBySymbol.mock.calls[0]?.[0]).toBe('AAPL');
  });

  it('returns an empty series when no historical prices are available', async () => {
    repository.findHistoryBySymbol.mockResolvedValue([]);

    await expect(service.getPriceHistory('MSFT')).resolves.toEqual({
      symbol: 'MSFT',
      prices: [],
    });
  });

  it('rejects an empty symbol', async () => {
    await expect(service.getPriceHistory(' ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
