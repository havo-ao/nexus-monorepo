import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Instrument } from '../../instruments/entities/instrument.entity';
import { INSTRUMENTS_REPOSITORY } from '../../instruments/repositories/instruments.repository';
import type { InstrumentsRepository } from '../../instruments/repositories/instruments.repository';
import { MarketQuote } from '../../quotes/entities/market-quote.entity';
import { QUOTES_REPOSITORY } from '../../quotes/repositories/quotes.repository';
import type { QuotesRepository } from '../../quotes/repositories/quotes.repository';
import { WatchlistItem } from '../entities/watchlist-item.entity';
import { WATCHLISTS_REPOSITORY } from '../repositories/watchlists.repository';
import type { WatchlistsRepository } from '../repositories/watchlists.repository';
import { WatchlistsService } from './watchlists.service';

describe('WatchlistsService', () => {
  let service: WatchlistsService;

  const watchlistsRepository: jest.Mocked<WatchlistsRepository> = {
    findByTraderId: jest.fn(),
    addItem: jest.fn(),
    removeItem: jest.fn(),
  };
  const instrumentsRepository: jest.Mocked<InstrumentsRepository> = {
    saveInstruments: jest.fn(),
    updateInstrumentMetadata: jest.fn(),
    findAvailable: jest.fn(),
    findBySymbol: jest.fn(),
  };
  const quotesRepository: jest.Mocked<QuotesRepository> = {
    saveQuotes: jest.fn(),
    saveQuoteHistory: jest.fn(),
    findLatestBySymbol: jest.fn(),
    findHistoryBySymbol: jest.fn(),
    recordSyncEvent: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    watchlistsRepository.addItem.mockResolvedValue();
    watchlistsRepository.removeItem.mockResolvedValue();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchlistsService,
        {
          provide: WATCHLISTS_REPOSITORY,
          useValue: watchlistsRepository,
        },
        {
          provide: INSTRUMENTS_REPOSITORY,
          useValue: instrumentsRepository,
        },
        {
          provide: QUOTES_REPOSITORY,
          useValue: quotesRepository,
        },
      ],
    }).compile();

    service = module.get<WatchlistsService>(WatchlistsService);
  });

  it('returns a trader watchlist enriched with latest quotes', async () => {
    watchlistsRepository.findByTraderId.mockResolvedValue([
      WatchlistItem.create({
        traderId: 'trader-123',
        symbol: 'AAPL',
        addedAt: new Date('2026-05-16T14:00:00.000Z'),
      }),
    ]);
    quotesRepository.findLatestBySymbol.mockResolvedValue(
      MarketQuote.fromProvider({
        symbol: 'aapl',
        price: 190,
        bid: 189.95,
        ask: 190.05,
        currency: 'usd',
        provider: 'test-provider',
        asOf: new Date('2026-05-16T14:00:00.000Z'),
      }),
    );

    const response = await service.getWatchlist(' trader-123 ');

    expect(response.traderId).toBe('trader-123');
    expect(response.items[0]?.symbol).toBe('AAPL');
    expect(response.items[0]?.addedAt).toBe('2026-05-16T14:00:00.000Z');
    expect(response.items[0]?.quote?.symbol).toBe('AAPL');
    expect(response.items[0]?.quote?.price).toBe(190);
  });

  it('adds an available instrument to the trader watchlist', async () => {
    instrumentsRepository.findBySymbol.mockResolvedValue(
      Instrument.restore({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
        status: 'ACTIVE',
      }),
    );
    watchlistsRepository.findByTraderId.mockResolvedValue([]);

    await service.addSymbol('trader-123', ' aapl ');

    expect(watchlistsRepository.addItem.mock.calls).toHaveLength(1);
    expect(instrumentsRepository.findBySymbol.mock.calls[0]?.[0]).toBe('AAPL');
  });

  it('rejects unavailable instruments', async () => {
    instrumentsRepository.findBySymbol.mockResolvedValue(null);

    await expect(
      service.addSymbol('trader-123', 'ZZZZ'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes a symbol from the trader watchlist', async () => {
    watchlistsRepository.findByTraderId.mockResolvedValue([]);

    await service.removeSymbol('trader-123', ' aapl ');

    expect(watchlistsRepository.removeItem.mock.calls[0]).toEqual([
      'trader-123',
      'AAPL',
    ]);
  });

  it('rejects invalid trader ids and symbols', async () => {
    await expect(service.getWatchlist(' ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.addSymbol('trader-123', ' ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
