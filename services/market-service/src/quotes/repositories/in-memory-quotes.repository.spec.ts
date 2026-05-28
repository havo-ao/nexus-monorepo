import { MarketQuote } from '../entities/market-quote.entity';
import { InMemoryQuotesRepository } from './in-memory-quotes.repository';

describe('InMemoryQuotesRepository', () => {
  let repository: InMemoryQuotesRepository;

  beforeEach(() => {
    repository = new InMemoryQuotesRepository();
  });

  it('stores and finds the latest quote by normalized symbol', () => {
    const quote = MarketQuote.fromProvider({
      symbol: 'aapl',
      price: 190,
      bid: 189.95,
      ask: 190.05,
      currency: 'usd',
      provider: 'test-provider',
      asOf: new Date('2026-05-14T14:00:00.000Z'),
    });

    repository.saveQuotes([quote]);

    expect(repository.findLatestBySymbol(' AAPL ')).toEqual(quote);
  });

  it('returns null when a quote is not stored', () => {
    expect(repository.findLatestBySymbol('MSFT')).toBeNull();
  });

  it('stores and finds historical quotes ordered by timestamp', () => {
    const latestQuote = MarketQuote.fromProvider({
      symbol: 'aapl',
      price: 191,
      bid: 190.95,
      ask: 191.05,
      currency: 'usd',
      provider: 'test-provider',
      asOf: new Date('2026-05-14T15:00:00.000Z'),
    });
    const firstQuote = MarketQuote.fromProvider({
      symbol: 'aapl',
      price: 190,
      bid: 189.95,
      ask: 190.05,
      currency: 'usd',
      provider: 'test-provider',
      asOf: new Date('2026-05-14T14:00:00.000Z'),
    });

    repository.saveQuotes([latestQuote, firstQuote]);

    expect(
      repository
        .findHistoryBySymbol(' AAPL ')
        .map((quote) => quote.toSnapshot().price),
    ).toEqual([190, 191]);
  });

  it('returns an empty historical series when a symbol is not stored', () => {
    expect(repository.findHistoryBySymbol('MSFT')).toEqual([]);
  });

  it('saves historical quotes without changing the latest quote cache', () => {
    const latestQuote = MarketQuote.fromProvider({
      symbol: 'aapl',
      price: 200,
      bid: 199.95,
      ask: 200.05,
      currency: 'usd',
      provider: 'current-provider',
      asOf: new Date('2026-05-14T14:00:00.000Z'),
    });
    const historicalQuote = MarketQuote.fromProvider({
      symbol: 'aapl',
      price: 180,
      bid: 179.95,
      ask: 180.05,
      currency: 'usd',
      provider: 'history-provider',
      asOf: new Date('2026-04-14T00:00:00.000Z'),
    });

    repository.saveQuotes([latestQuote]);
    repository.saveQuoteHistory([historicalQuote]);

    expect(repository.findLatestBySymbol('AAPL')).toEqual(latestQuote);
    expect(repository.findHistoryBySymbol('AAPL')).toEqual([
      historicalQuote,
      latestQuote,
    ]);
  });

  it('updates historical quotes when symbol and timestamp already exist', () => {
    const firstQuote = MarketQuote.fromProvider({
      symbol: 'aapl',
      price: 180,
      bid: 179.95,
      ask: 180.05,
      currency: 'USD',
      provider: 'first-provider',
      asOf: new Date('2026-04-14T00:00:00.000Z'),
    });
    const updatedQuote = MarketQuote.fromProvider({
      symbol: 'aapl',
      price: 181,
      bid: 180.95,
      ask: 181.05,
      currency: 'USD',
      provider: 'updated-provider',
      asOf: new Date('2026-04-14T00:00:00.000Z'),
    });

    repository.saveQuoteHistory([firstQuote, updatedQuote]);

    expect(
      repository.findHistoryBySymbol('AAPL').map((quote) => quote.toSnapshot()),
    ).toEqual([
      expect.objectContaining({
        price: 181,
        provider: 'updated-provider',
      }),
    ]);
  });

  it('records synchronization events without persistence coupling', () => {
    expect(() =>
      repository.recordSyncEvent({
        status: 'SUCCESS',
        provider: 'test-provider',
        requestedBy: 'system@nexus.local',
        symbolsCount: 1,
        updatedCount: 1,
        failedCount: 0,
        message: 'Synchronized 1 of 1 market quotes',
      }),
    ).not.toThrow();
  });
});
