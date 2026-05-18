import { StaticMarketHistoryProvider } from './static-market-history.provider';

describe('StaticMarketHistoryProvider', () => {
  let provider: StaticMarketHistoryProvider;

  beforeEach(() => {
    provider = new StaticMarketHistoryProvider();
  });

  it('returns deterministic historical quotes', () => {
    const history = provider.fetchDailyHistory(' aapl ');

    expect(history).toHaveLength(30);
    expect(history[0]).toEqual(
      expect.objectContaining({
        symbol: 'AAPL',
        currency: 'USD',
        provider: 'alpha-vantage-history-compatible',
      }),
    );
    expect(history[0]?.asOf).toBeInstanceOf(Date);
    expect(history[0]?.bid).toBeLessThan(history[0]?.ask ?? 0);
  });

  it('rejects empty symbols', () => {
    expect(() => provider.fetchDailyHistory(' ')).toThrow(TypeError);
  });
});
