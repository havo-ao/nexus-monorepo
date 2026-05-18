import type { MarketHistoryProvider } from './market-history-provider';
import { selectMarketHistoryProvider } from './market-history-provider.factory';

describe('selectMarketHistoryProvider', () => {
  const originalHistoryProvider = process.env.MARKET_HISTORY_PROVIDER;
  const originalDataProvider = process.env.MARKET_DATA_PROVIDER;
  const originalApiKey = process.env.ALPHA_VANTAGE_API_KEY;

  const staticProvider = { name: 'static-history' } as MarketHistoryProvider;
  const alphaProvider = { name: 'alpha-vantage' } as MarketHistoryProvider;

  afterEach(() => {
    process.env.MARKET_HISTORY_PROVIDER = originalHistoryProvider;
    process.env.MARKET_DATA_PROVIDER = originalDataProvider;
    process.env.ALPHA_VANTAGE_API_KEY = originalApiKey;
  });

  it('uses Alpha Vantage when history provider is configured with an API key', () => {
    process.env.MARKET_HISTORY_PROVIDER = 'alpha-vantage';
    process.env.ALPHA_VANTAGE_API_KEY = 'test-key';

    expect(selectMarketHistoryProvider(staticProvider, alphaProvider)).toBe(
      alphaProvider,
    );
  });

  it('uses Alpha Vantage when data provider is configured with an API key', () => {
    delete process.env.MARKET_HISTORY_PROVIDER;
    process.env.MARKET_DATA_PROVIDER = 'alpha-vantage';
    process.env.ALPHA_VANTAGE_API_KEY = 'test-key';

    expect(selectMarketHistoryProvider(staticProvider, alphaProvider)).toBe(
      alphaProvider,
    );
  });

  it('allows forcing static history even with an API key', () => {
    process.env.MARKET_HISTORY_PROVIDER = 'static';
    process.env.ALPHA_VANTAGE_API_KEY = 'test-key';

    expect(selectMarketHistoryProvider(staticProvider, alphaProvider)).toBe(
      staticProvider,
    );
  });

  it('falls back to static history without an API key', () => {
    process.env.MARKET_HISTORY_PROVIDER = 'alpha-vantage';
    delete process.env.ALPHA_VANTAGE_API_KEY;

    expect(selectMarketHistoryProvider(staticProvider, alphaProvider)).toBe(
      staticProvider,
    );
  });
});
