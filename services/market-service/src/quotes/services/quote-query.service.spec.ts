import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MarketQuote } from '../entities/market-quote.entity';
import { QUOTES_REPOSITORY } from '../repositories/quotes.repository';
import type { QuotesRepository } from '../repositories/quotes.repository';
import { QuoteQueryService } from './quote-query.service';

describe('QuoteQueryService', () => {
  let service: QuoteQueryService;

  const repository: jest.Mocked<QuotesRepository> = {
    saveQuotes: jest.fn(),
    findLatestBySymbol: jest.fn(),
    recordSyncEvent: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuoteQueryService,
        {
          provide: QUOTES_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<QuoteQueryService>(QuoteQueryService);
  });

  it('returns the latest quote with price, bid, ask and spread', async () => {
    repository.findLatestBySymbol.mockResolvedValue(
      MarketQuote.fromProvider({
        symbol: 'aapl',
        price: 190,
        bid: 189.95,
        ask: 190.05,
        currency: 'usd',
        provider: 'test-provider',
        asOf: new Date('2026-05-14T14:00:00.000Z'),
      }),
    );

    await expect(service.getLatestQuote(' aapl ')).resolves.toEqual({
      symbol: 'AAPL',
      price: 190,
      bid: 189.95,
      ask: 190.05,
      spread: 0.1,
      currency: 'USD',
      provider: 'test-provider',
      asOf: '2026-05-14T14:00:00.000Z',
    });
    expect(repository.findLatestBySymbol.mock.calls[0]?.[0]).toBe('AAPL');
  });

  it('rejects an empty symbol', async () => {
    await expect(service.getLatestQuote(' ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns not found when the quote cache has no symbol data', async () => {
    repository.findLatestBySymbol.mockResolvedValue(null);

    await expect(service.getLatestQuote('MSFT')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
