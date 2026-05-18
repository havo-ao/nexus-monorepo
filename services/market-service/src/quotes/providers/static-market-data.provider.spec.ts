import { StaticMarketDataProvider } from './static-market-data.provider';

describe('StaticMarketDataProvider', () => {
  let provider: StaticMarketDataProvider;

  beforeEach(() => {
    provider = new StaticMarketDataProvider();
  });

  it('returns normalized alpha-vantage-compatible quote snapshots', () => {
    const quote = provider.fetchQuote(' aapl ');

    expect(quote).toEqual(
      expect.objectContaining({
        symbol: 'AAPL',
        currency: 'USD',
        provider: 'alpha-vantage-compatible',
      }),
    );
    expect(quote.bid).toBeLessThan(quote.ask);
    expect(quote.price).toBeGreaterThan(0);
    expect(quote.asOf).toBeInstanceOf(Date);
  });

  it('varies prices over repeated requests for dashboard gainers and losers', () => {
    const firstQuote = provider.fetchQuote('MSFT');
    const secondQuote = provider.fetchQuote('msft');

    expect(secondQuote.price).toBeLessThan(firstQuote.price);
    expect(secondQuote.bid).toBeLessThan(firstQuote.bid);
    expect(secondQuote.ask).toBeLessThan(firstQuote.ask);
  });

  it('keeps deterministic first prices across provider instances', () => {
    const firstProvider = new StaticMarketDataProvider();
    const secondProvider = new StaticMarketDataProvider();

    expect(secondProvider.fetchQuote('AAPL').price).toBe(
      firstProvider.fetchQuote('aapl').price,
    );
  });

  it('rejects empty symbols', () => {
    expect(() => provider.fetchQuote(' ')).toThrow(TypeError);
  });
});
