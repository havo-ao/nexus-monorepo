import { StaticInstrumentCatalogProvider } from './static-instrument-catalog.provider';

describe('StaticInstrumentCatalogProvider', () => {
  it('returns deterministic active instruments', async () => {
    const provider = new StaticInstrumentCatalogProvider();

    await expect(provider.fetchInstruments()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: 'AAPL',
          marketCode: 'NASDAQ',
          currency: 'USD',
          status: 'ACTIVE',
        }),
      ]),
    );
  });
});
