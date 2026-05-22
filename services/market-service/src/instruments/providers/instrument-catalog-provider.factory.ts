import type { InstrumentCatalogProvider } from './instrument-catalog.provider';

const ALPHA_VANTAGE_PROVIDER = 'alpha-vantage';
const STATIC_PROVIDER = 'static';

export function selectInstrumentCatalogProvider(
  staticProvider: InstrumentCatalogProvider,
  alphaVantageProvider: InstrumentCatalogProvider,
): InstrumentCatalogProvider {
  const selectedProvider = process.env.INSTRUMENT_CATALOG_PROVIDER?.trim();
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
