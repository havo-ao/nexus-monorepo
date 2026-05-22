import { StaticInstrumentMetadataProvider } from './static-instrument-metadata.provider';

describe('StaticInstrumentMetadataProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-20T18:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns compatible metadata for known symbols', async () => {
    const provider = new StaticInstrumentMetadataProvider();

    await expect(provider.fetchMetadata(' aapl ')).resolves.toEqual(
      expect.objectContaining({
        symbol: 'AAPL',
        assetType: 'Common Stock',
        industry: 'Consumer Electronics',
        country: 'USA',
        metadataProvider: 'alpha-vantage-overview-compatible',
        metadataUpdatedAt: new Date('2026-05-20T18:00:00.000Z'),
      }),
    );
  });

  it('rejects unknown symbols', async () => {
    const provider = new StaticInstrumentMetadataProvider();

    await expect(provider.fetchMetadata('ZZZZ')).rejects.toThrow(
      'Instrument ZZZZ metadata not found',
    );
  });
});
