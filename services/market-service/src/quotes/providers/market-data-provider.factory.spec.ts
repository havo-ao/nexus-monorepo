import { selectMarketDataProvider } from './market-data-provider.factory';
import type { MarketDataProvider } from './market-data-provider';

describe('selectMarketDataProvider', () => {
  const originalProvider = process.env.MARKET_DATA_PROVIDER;
  const originalApiKey = process.env.ALPHA_VANTAGE_API_KEY;

  const staticProvider = { name: 'static' } as MarketDataProvider;
  const alphaProvider = { name: 'alpha-vantage' } as MarketDataProvider;

  afterEach(() => {
    process.env.MARKET_DATA_PROVIDER = originalProvider;
    process.env.ALPHA_VANTAGE_API_KEY = originalApiKey;
  });

  it('uses Alpha Vantage when explicitly configured with an API key', () => {
    process.env.MARKET_DATA_PROVIDER = 'alpha-vantage';
    process.env.ALPHA_VANTAGE_API_KEY = 'test-key';

    expect(selectMarketDataProvider(staticProvider, alphaProvider)).toBe(
      alphaProvider,
    );
  });

  it('uses Alpha Vantage by default when an API key exists', () => {
    delete process.env.MARKET_DATA_PROVIDER;
    process.env.ALPHA_VANTAGE_API_KEY = 'test-key';

    expect(selectMarketDataProvider(staticProvider, alphaProvider)).toBe(
      alphaProvider,
    );
  });

  it('allows forcing the static provider even when an API key exists', () => {
    process.env.MARKET_DATA_PROVIDER = 'static';
    process.env.ALPHA_VANTAGE_API_KEY = 'test-key';

    expect(selectMarketDataProvider(staticProvider, alphaProvider)).toBe(
      staticProvider,
    );
  });

  it('keeps the static provider when Alpha Vantage has no API key', () => {
    process.env.MARKET_DATA_PROVIDER = 'alpha-vantage';
    delete process.env.ALPHA_VANTAGE_API_KEY;

    expect(selectMarketDataProvider(staticProvider, alphaProvider)).toBe(
      staticProvider,
    );
  });

  it('keeps the static provider by default when no API key exists', () => {
    delete process.env.MARKET_DATA_PROVIDER;
    delete process.env.ALPHA_VANTAGE_API_KEY;

    expect(selectMarketDataProvider(staticProvider, alphaProvider)).toBe(
      staticProvider,
    );
  });
});
