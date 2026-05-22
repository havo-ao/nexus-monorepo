import { AlphaVantageInstrumentMetadataProvider } from './alpha-vantage-instrument-metadata.provider';

describe('AlphaVantageInstrumentMetadataProvider', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-20T18:00:00.000Z'));
    process.env = {
      ...originalEnv,
      ALPHA_VANTAGE_API_KEY: 'test-key',
    };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  it('fetches and maps company overview metadata', async () => {
    mockFetchResponse({
      Symbol: 'AAPL',
      Name: 'Apple Inc.',
      Description: 'Apple overview',
      AssetType: 'Common Stock',
      Exchange: 'NASDAQ',
      Currency: 'USD',
      Country: 'USA',
      Sector: 'Technology',
      Industry: 'Consumer Electronics',
    });
    const provider = new AlphaVantageInstrumentMetadataProvider();

    await expect(provider.fetchMetadata(' aapl ')).resolves.toEqual({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      description: 'Apple overview',
      assetType: 'Common Stock',
      currency: 'USD',
      country: 'USA',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      metadataProvider: 'alpha-vantage-overview',
      metadataUpdatedAt: new Date('2026-05-20T18:00:00.000Z'),
    });
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    const requestUrl = fetchMock.mock.calls[0]?.[0] as URL;

    expect(requestUrl.searchParams.get('function')).toBe('OVERVIEW');
    expect(requestUrl.searchParams.get('symbol')).toBe('AAPL');
  });

  it('rejects provider messages and incomplete responses', async () => {
    mockFetchResponse({ Note: 'API call frequency exceeded' });
    const provider = new AlphaVantageInstrumentMetadataProvider();

    await expect(provider.fetchMetadata('AAPL')).rejects.toThrow(
      'API call frequency exceeded',
    );

    mockFetchResponse({ Symbol: 'AAPL' });

    await expect(provider.fetchMetadata('AAPL')).rejects.toThrow(
      'Alpha Vantage overview response is incomplete',
    );
  });

  it('rejects information and error provider messages', async () => {
    mockFetchResponse({ Information: 'temporary provider response' });
    const provider = new AlphaVantageInstrumentMetadataProvider();

    await expect(provider.fetchMetadata('AAPL')).rejects.toThrow(
      'temporary provider response',
    );

    mockFetchResponse({ Error: 'Invalid API call' });

    await expect(provider.fetchMetadata('AAPL')).rejects.toThrow(
      'Invalid API call',
    );
  });

  it('uses configured base URL and falls back to default timeout when invalid', async () => {
    process.env.ALPHA_VANTAGE_BASE_URL = 'https://example.test/query';
    process.env.ALPHA_VANTAGE_TIMEOUT_MS = 'invalid-timeout';
    mockFetchResponse({
      Symbol: 'MSFT',
      Name: 'Microsoft Corporation',
    });
    const provider = new AlphaVantageInstrumentMetadataProvider();

    await provider.fetchMetadata('MSFT');
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    const requestUrl = fetchMock.mock.calls[0]?.[0] as URL;

    expect(requestUrl.origin).toBe('https://example.test');
  });

  it('rejects unsuccessful HTTP responses and missing API key', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });
    const provider = new AlphaVantageInstrumentMetadataProvider();

    await expect(provider.fetchMetadata('AAPL')).rejects.toThrow(
      'Alpha Vantage overview request failed with status 500',
    );

    delete process.env.ALPHA_VANTAGE_API_KEY;

    await expect(provider.fetchMetadata('AAPL')).rejects.toThrow(
      'Alpha Vantage API key is required',
    );
  });

  function mockFetchResponse(body: unknown): void {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(body),
    });
  }
});
