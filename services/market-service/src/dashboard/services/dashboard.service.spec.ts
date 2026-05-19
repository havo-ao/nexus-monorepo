import { Instrument } from '../../instruments/entities/instrument.entity';
import type { InstrumentsRepository } from '../../instruments/repositories/instruments.repository';
import { Market } from '../../markets/entities/market.entity';
import type { MarketsRepository } from '../../markets/repositories/markets.repository';
import { MarketQuote } from '../../quotes/entities/market-quote.entity';
import type { QuotesRepository } from '../../quotes/repositories/quotes.repository';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let marketsRepository: jest.Mocked<MarketsRepository>;
  let instrumentsRepository: jest.Mocked<InstrumentsRepository>;
  let quotesRepository: jest.Mocked<QuotesRepository>;
  let service: DashboardService;

  beforeEach(() => {
    marketsRepository = {
      findAvailable: jest.fn().mockResolvedValue([
        Market.restore({
          code: 'NASDAQ',
          name: 'NASDAQ Stock Market',
          country: 'United States',
          currency: 'USD',
          timezone: 'America/New_York',
          status: 'ACTIVE',
          representativeSymbols: ['AAPL', 'MSFT'],
        }),
      ]),
    };
    instrumentsRepository = {
      saveInstruments: jest.fn(),
      findAvailable: jest.fn().mockResolvedValue([
        Instrument.restore({
          symbol: 'AAPL',
          name: 'Apple Inc.',
          marketCode: 'NASDAQ',
          currency: 'USD',
          sector: 'Technology',
          status: 'ACTIVE',
        }),
        Instrument.restore({
          symbol: 'MSFT',
          name: 'Microsoft Corporation',
          marketCode: 'NASDAQ',
          currency: 'USD',
          sector: 'Technology',
          status: 'ACTIVE',
        }),
      ]),
      findBySymbol: jest.fn(),
    };
    quotesRepository = {
      saveQuotes: jest.fn(),
      saveQuoteHistory: jest.fn(),
      findLatestBySymbol: jest.fn((symbol: string) =>
        Promise.resolve(resolveLatestQuote(symbol)),
      ),
      findHistoryBySymbol: jest.fn((symbol: string) =>
        Promise.resolve([resolvePreviousQuote(symbol)]),
      ),
      recordSyncEvent: jest.fn(),
    };
    service = new DashboardService(
      marketsRepository,
      instrumentsRepository,
      quotesRepository,
    );
  });

  it('builds an aggregated market dashboard summary', async () => {
    const dashboard = await service.getDashboard();

    expect(dashboard.markets).toEqual({
      total: 1,
      active: 1,
      items: [
        {
          code: 'NASDAQ',
          name: 'NASDAQ Stock Market',
          country: 'United States',
          currency: 'USD',
          timezone: 'America/New_York',
          status: 'ACTIVE',
        },
      ],
    });
    expect(dashboard.instruments.total).toBe(2);
    expect(dashboard.quotes.trackedCount).toBe(2);
    expect(dashboard.quotes.topGainers[0].symbol).toBe('AAPL');
    expect(dashboard.quotes.topLosers[0].symbol).toBe('MSFT');
    expect(dashboard.quotes.latest[0]).toEqual(
      expect.objectContaining({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 110,
        changePercent: 10,
      }),
    );
    expect(dashboard.platform).toEqual(
      expect.objectContaining({
        service: 'market-service',
        status: 'OPERATIONAL',
      }),
    );
  });

  it('returns zero change when quote history has no previous price', async () => {
    quotesRepository.findHistoryBySymbol.mockResolvedValueOnce([]);

    const dashboard = await service.getDashboard();

    expect(dashboard.quotes.latest[0].changePercent).toBe(0);
  });

  it('ignores instruments without a cached latest quote', async () => {
    quotesRepository.findLatestBySymbol.mockImplementation((symbol: string) =>
      Promise.resolve(symbol === 'AAPL' ? resolveLatestQuote(symbol) : null),
    );

    const dashboard = await service.getDashboard();

    expect(dashboard.quotes.trackedCount).toBe(1);
    expect(dashboard.quotes.latest).toHaveLength(1);
    expect(dashboard.quotes.latest[0].symbol).toBe('AAPL');
  });
});

function resolveLatestQuote(symbol: string): MarketQuote | null {
  if (symbol === 'AAPL') {
    return MarketQuote.fromProvider({
      symbol: 'AAPL',
      price: 110,
      bid: 109.95,
      ask: 110.05,
      currency: 'USD',
      provider: 'test-provider',
      asOf: new Date('2026-05-16T12:00:00.000Z'),
    });
  }

  if (symbol === 'MSFT') {
    return MarketQuote.fromProvider({
      symbol: 'MSFT',
      price: 90,
      bid: 89.95,
      ask: 90.05,
      currency: 'USD',
      provider: 'test-provider',
      asOf: new Date('2026-05-16T12:00:00.000Z'),
    });
  }

  return null;
}

function resolvePreviousQuote(symbol: string, price = 100): MarketQuote {
  return MarketQuote.fromProvider({
    symbol,
    price,
    bid: 99.95,
    ask: 100.05,
    currency: 'USD',
    provider: 'test-provider',
    asOf: new Date('2026-05-15T12:00:00.000Z'),
  });
}
