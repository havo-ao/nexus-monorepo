import type { InstrumentMetadataProvider } from './instrument-metadata.provider';

const ALPHA_VANTAGE_PROVIDER = 'alpha-vantage';
const STATIC_PROVIDER = 'static';

export function selectInstrumentMetadataProvider(
  staticProvider: InstrumentMetadataProvider,
  alphaVantageProvider: InstrumentMetadataProvider,
): InstrumentMetadataProvider {
  const selectedProvider = process.env.INSTRUMENT_METADATA_PROVIDER?.trim();
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
