import type { MarketDataProvider } from './market-data-provider';

const ALPHA_VANTAGE_PROVIDER = 'alpha-vantage';
const STATIC_PROVIDER = 'static';

export function selectMarketDataProvider(
  staticProvider: MarketDataProvider,
  alphaVantageProvider: MarketDataProvider,
): MarketDataProvider {
  const requestedProvider = process.env.MARKET_DATA_PROVIDER?.trim();
  const hasAlphaVantageApiKey = Boolean(
    process.env.ALPHA_VANTAGE_API_KEY?.trim(),
  );

  if (requestedProvider === STATIC_PROVIDER) {
    return staticProvider;
  }

  if (
    hasAlphaVantageApiKey &&
    (!requestedProvider || requestedProvider === ALPHA_VANTAGE_PROVIDER)
  ) {
    return alphaVantageProvider;
  }

  return staticProvider;
}
