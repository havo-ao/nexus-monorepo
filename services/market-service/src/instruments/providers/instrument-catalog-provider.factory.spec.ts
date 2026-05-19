import { selectInstrumentCatalogProvider } from './instrument-catalog-provider.factory';
import type { InstrumentCatalogProvider } from './instrument-catalog.provider';

describe('selectInstrumentCatalogProvider', () => {
  const originalEnv = process.env;
  const staticProvider = { name: 'static' } as InstrumentCatalogProvider;
  const alphaProvider = { name: 'alpha-vantage' } as InstrumentCatalogProvider;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.INSTRUMENT_CATALOG_PROVIDER;
    delete process.env.ALPHA_VANTAGE_API_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('selects alpha vantage when API key is configured', () => {
    process.env.ALPHA_VANTAGE_API_KEY = 'test-key';

    expect(selectInstrumentCatalogProvider(staticProvider, alphaProvider)).toBe(
      alphaProvider,
    );
  });

  it('selects alpha vantage when explicitly requested with API key', () => {
    process.env.ALPHA_VANTAGE_API_KEY = 'test-key';
    process.env.INSTRUMENT_CATALOG_PROVIDER = 'alpha-vantage';

    expect(selectInstrumentCatalogProvider(staticProvider, alphaProvider)).toBe(
      alphaProvider,
    );
  });

  it('selects static provider when explicitly requested', () => {
    process.env.ALPHA_VANTAGE_API_KEY = 'test-key';
    process.env.INSTRUMENT_CATALOG_PROVIDER = 'static';

    expect(selectInstrumentCatalogProvider(staticProvider, alphaProvider)).toBe(
      staticProvider,
    );
  });

  it('falls back to static provider without API key', () => {
    expect(selectInstrumentCatalogProvider(staticProvider, alphaProvider)).toBe(
      staticProvider,
    );
  });
});
