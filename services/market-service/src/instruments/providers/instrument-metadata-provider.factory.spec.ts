import { selectInstrumentMetadataProvider } from './instrument-metadata-provider.factory';
import type { InstrumentMetadataProvider } from './instrument-metadata.provider';

describe('selectInstrumentMetadataProvider', () => {
  const originalEnv = process.env;
  const staticProvider = { name: 'static' } as InstrumentMetadataProvider;
  const alphaProvider = {
    name: 'alpha-vantage',
  } as InstrumentMetadataProvider;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.INSTRUMENT_METADATA_PROVIDER;
    delete process.env.ALPHA_VANTAGE_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('selects Alpha Vantage when an API key is available', () => {
    process.env.ALPHA_VANTAGE_API_KEY = 'test-key';

    expect(
      selectInstrumentMetadataProvider(staticProvider, alphaProvider),
    ).toBe(alphaProvider);
  });

  it('selects Alpha Vantage when explicitly configured with an API key', () => {
    process.env.ALPHA_VANTAGE_API_KEY = 'test-key';
    process.env.INSTRUMENT_METADATA_PROVIDER = 'alpha-vantage';

    expect(
      selectInstrumentMetadataProvider(staticProvider, alphaProvider),
    ).toBe(alphaProvider);
  });

  it('uses static metadata when configured or when no API key exists', () => {
    process.env.ALPHA_VANTAGE_API_KEY = 'test-key';
    process.env.INSTRUMENT_METADATA_PROVIDER = 'static';

    expect(
      selectInstrumentMetadataProvider(staticProvider, alphaProvider),
    ).toBe(staticProvider);

    delete process.env.ALPHA_VANTAGE_API_KEY;
    delete process.env.INSTRUMENT_METADATA_PROVIDER;

    expect(
      selectInstrumentMetadataProvider(staticProvider, alphaProvider),
    ).toBe(staticProvider);
  });
});
