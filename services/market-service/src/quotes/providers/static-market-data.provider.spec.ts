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

  it('keeps deterministic prices for the same symbol', () => {
    const firstQuote = provider.fetchQuote('MSFT');
    const secondQuote = provider.fetchQuote('msft');

    expect(secondQuote.price).toBe(firstQuote.price);
    expect(secondQuote.bid).toBe(firstQuote.bid);
    expect(secondQuote.ask).toBe(firstQuote.ask);
  });

  it('rejects empty symbols', () => {
    expect(() => provider.fetchQuote(' ')).toThrow(TypeError);
  });
});
