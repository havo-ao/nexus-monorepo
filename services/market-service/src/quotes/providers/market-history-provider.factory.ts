import type { MarketHistoryProvider } from './market-history-provider';

const ALPHA_VANTAGE_PROVIDER = 'alpha-vantage';
const STATIC_PROVIDER = 'static';

export function selectMarketHistoryProvider(
  staticProvider: MarketHistoryProvider,
  alphaVantageProvider: MarketHistoryProvider,
): MarketHistoryProvider {
  const requestedProvider = process.env.MARKET_HISTORY_PROVIDER?.trim();
  const fallbackProvider = process.env.MARKET_DATA_PROVIDER?.trim();
  const selectedProvider = requestedProvider || fallbackProvider;
  const hasAlphaVantageApiKey = Boolean(
    process.env.ALPHA_VANTAGE_API_KEY?.trim(),
  );

  if (selectedProvider === STATIC_PROVIDER) {
    return staticProvider;
  }

  if (
    hasAlphaVantageApiKey &&
    (!selectedProvider || selectedProvider === ALPHA_VANTAGE_PROVIDER)
  ) {
    return alphaVantageProvider;
  }

  return staticProvider;
}
