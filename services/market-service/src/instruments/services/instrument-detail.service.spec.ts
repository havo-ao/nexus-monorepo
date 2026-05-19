import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MarketQuote } from '../../quotes/entities/market-quote.entity';
import { QUOTES_REPOSITORY } from '../../quotes/repositories/quotes.repository';
import type { QuotesRepository } from '../../quotes/repositories/quotes.repository';
import { Instrument } from '../entities/instrument.entity';
import { INSTRUMENTS_REPOSITORY } from '../repositories/instruments.repository';
import type { InstrumentsRepository } from '../repositories/instruments.repository';
import { InstrumentDetailService } from './instrument-detail.service';

describe('InstrumentDetailService', () => {
  let service: InstrumentDetailService;

  const instrumentsRepository: jest.Mocked<InstrumentsRepository> = {
    saveInstruments: jest.fn(),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstrumentDetailService,
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

    service = module.get<InstrumentDetailService>(InstrumentDetailService);
  });

  it('returns metadata and latest quote when both are available', async () => {
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
    quotesRepository.findLatestBySymbol.mockResolvedValue(
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

    await expect(service.getInstrumentDetail(' aapl ')).resolves.toEqual({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      marketCode: 'NASDAQ',
      currency: 'USD',
      sector: 'Technology',
      status: 'ACTIVE',
      quote: {
        symbol: 'AAPL',
        price: 190,
        bid: 189.95,
        ask: 190.05,
        spread: 0.1,
        currency: 'USD',
        provider: 'test-provider',
        asOf: '2026-05-14T14:00:00.000Z',
      },
    });
    expect(instrumentsRepository.findBySymbol.mock.calls[0]?.[0]).toBe('AAPL');
    expect(quotesRepository.findLatestBySymbol.mock.calls[0]?.[0]).toBe('AAPL');
  });

  it('returns metadata with null quote when price data is not available', async () => {
    instrumentsRepository.findBySymbol.mockResolvedValue(
      Instrument.restore({
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
        status: 'ACTIVE',
      }),
    );
    quotesRepository.findLatestBySymbol.mockResolvedValue(null);

    await expect(service.getInstrumentDetail('MSFT')).resolves.toEqual(
      expect.objectContaining({
        symbol: 'MSFT',
        quote: null,
      }),
    );
  });

  it('rejects an empty symbol', async () => {
    await expect(service.getInstrumentDetail(' ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns not found when instrument metadata is not available', async () => {
    instrumentsRepository.findBySymbol.mockResolvedValue(null);

    await expect(service.getInstrumentDetail('ZZZZ')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
