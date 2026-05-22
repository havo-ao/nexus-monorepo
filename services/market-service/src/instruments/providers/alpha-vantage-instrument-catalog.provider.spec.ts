import { AlphaVantageInstrumentCatalogProvider } from './alpha-vantage-instrument-catalog.provider';

describe('AlphaVantageInstrumentCatalogProvider', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ALPHA_VANTAGE_API_KEY: 'test-key',
    };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  it('fetches and maps listing status CSV rows from Alpha Vantage', async () => {
    mockFetchResponse(
      [
        'symbol,name,exchange,assetType,ipoDate,delistingDate,status',
        'AAPL,Apple Inc.,NASDAQ,Stock,1980-12-12,null,Active',
        'JPM,JPMorgan Chase & Co.,NYSE,Stock,1969-03-05,null,Active',
        'BHP,BHP Group,ASX,Stock,1987-01-01,null,Active',
      ].join('\n'),
    );
    const provider = new AlphaVantageInstrumentCatalogProvider();

    const instruments = await provider.fetchInstruments();

    expect(instruments).toEqual([
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Unclassified',
        status: 'ACTIVE',
      },
      {
        symbol: 'JPM',
        name: 'JPMorgan Chase & Co.',
        marketCode: 'NYSE',
        currency: 'USD',
        sector: 'Unclassified',
        status: 'ACTIVE',
      },
    ]);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        searchParams: expect.any(URLSearchParams) as URLSearchParams,
      }),
      expect.objectContaining({
        signal: expect.any(AbortSignal) as AbortSignal,
      }),
    );
  });

  it('uses configured listing state and timeout', async () => {
    process.env.ALPHA_VANTAGE_LISTING_STATE = 'delisted';
    process.env.ALPHA_VANTAGE_TIMEOUT_MS = '9000';
    mockFetchResponse(
      [
        'symbol,name,exchange,assetType,ipoDate,delistingDate,status',
        'OLD,Old Company,NYSE,Stock,2010-01-01,2020-01-01,Delisted',
      ].join('\n'),
    );
    const provider = new AlphaVantageInstrumentCatalogProvider();

    const instruments = await provider.fetchInstruments();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    const requestUrl = fetchMock.mock.calls[0]?.[0] as URL;

    expect(requestUrl.searchParams.get('state')).toBe('delisted');
    expect(instruments[0].status).toBe('INACTIVE');
  });

  it('limits synchronized instruments using the configured provider limit', async () => {
    process.env.ALPHA_VANTAGE_INSTRUMENT_LIMIT = '2';
    mockFetchResponse(
      [
        'symbol,name,exchange,assetType,ipoDate,delistingDate,status',
        'AAPL,Apple Inc.,NASDAQ,Stock,1980-12-12,null,Active',
        'MSFT,Microsoft Corporation,NASDAQ,Stock,1986-03-13,null,Active',
        'JPM,JPMorgan Chase & Co.,NYSE,Stock,1969-03-05,null,Active',
      ].join('\n'),
    );
    const provider = new AlphaVantageInstrumentCatalogProvider();

    const instruments = await provider.fetchInstruments();

    expect(instruments.map((instrument) => instrument.symbol)).toEqual([
      'AAPL',
      'MSFT',
    ]);
  });

  it('falls back to the default instrument limit when configured limit is invalid', async () => {
    process.env.ALPHA_VANTAGE_INSTRUMENT_LIMIT = 'invalid-limit';
    mockFetchResponse(
      [
        'symbol,name,exchange,assetType,ipoDate,delistingDate,status',
        'AAPL,Apple Inc.,NASDAQ,Stock,1980-12-12,null,Active',
      ].join('\n'),
    );
    const provider = new AlphaVantageInstrumentCatalogProvider();

    await expect(provider.fetchInstruments()).resolves.toHaveLength(1);
  });

  it('uses configured base URL and falls back to default timeout when invalid', async () => {
    process.env.ALPHA_VANTAGE_BASE_URL = 'https://example.test/query';
    process.env.ALPHA_VANTAGE_TIMEOUT_MS = 'invalid-timeout';
    mockFetchResponse(
      [
        'symbol,name,exchange,assetType,ipoDate,delistingDate,status',
        'MSFT,Microsoft Corporation,NASDAQ,Stock,1986-03-13,null,Active',
      ].join('\n'),
    );
    const provider = new AlphaVantageInstrumentCatalogProvider();

    await provider.fetchInstruments();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    const requestUrl = fetchMock.mock.calls[0]?.[0] as URL;

    expect(requestUrl.origin).toBe('https://example.test');
  });

  it('parses quoted CSV fields with commas', async () => {
    mockFetchResponse(
      [
        'symbol,name,exchange,assetType,ipoDate,delistingDate,status',
        'BRK.A,"Berkshire Hathaway, Inc.",NYSE,Stock,1980-01-01,null,Active',
      ].join('\n'),
    );
    const provider = new AlphaVantageInstrumentCatalogProvider();

    await expect(provider.fetchInstruments()).resolves.toEqual([
      expect.objectContaining({
        symbol: 'BRK.A',
        name: 'Berkshire Hathaway, Inc.',
      }),
    ]);
  });

  it('rejects provider messages and preserves local catalog upstream', async () => {
    mockFetchResponse('{"Note":"API call frequency exceeded"}');
    const provider = new AlphaVantageInstrumentCatalogProvider();

    await expect(provider.fetchInstruments()).rejects.toThrow(
      'API call frequency exceeded',
    );
  });

  it('rejects array-shaped provider messages', async () => {
    mockFetchResponse('[{"Information":"temporary provider response"}]');
    const provider = new AlphaVantageInstrumentCatalogProvider();

    await expect(provider.fetchInstruments()).rejects.toThrow(
      'temporary provider response',
    );
  });

  it('rejects unsuccessful HTTP responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });
    const provider = new AlphaVantageInstrumentCatalogProvider();

    await expect(provider.fetchInstruments()).rejects.toThrow(
      'Alpha Vantage listing request failed with status 500',
    );
  });

  it('requires an API key when selected directly', async () => {
    delete process.env.ALPHA_VANTAGE_API_KEY;
    const provider = new AlphaVantageInstrumentCatalogProvider();

    await expect(provider.fetchInstruments()).rejects.toThrow(
      'Alpha Vantage API key is required',
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects responses without supported market instruments', async () => {
    mockFetchResponse(
      [
        'symbol,name,exchange,assetType,ipoDate,delistingDate,status',
        'BHP,BHP Group,ASX,Stock,1987-01-01,null,Active',
      ].join('\n'),
    );
    const provider = new AlphaVantageInstrumentCatalogProvider();

    await expect(provider.fetchInstruments()).rejects.toThrow(
      'Alpha Vantage listing response has no instruments',
    );
  });

  it('rejects empty listing responses', async () => {
    mockFetchResponse('');
    const provider = new AlphaVantageInstrumentCatalogProvider();

    await expect(provider.fetchInstruments()).rejects.toThrow(
      'Alpha Vantage listing response is empty',
    );
  });

  it('ignores rows with incomplete required fields', async () => {
    mockFetchResponse(
      [
        'symbol,name,exchange,assetType,ipoDate,delistingDate,status',
        ',Nameless,NASDAQ,Stock,1980-01-01,null,Active',
        'NONAME,,NYSE,Stock,1980-01-01,null,Active',
        'AAPL,Apple Inc.,NASDAQ,Stock,1980-12-12,null,Active',
      ].join('\n'),
    );
    const provider = new AlphaVantageInstrumentCatalogProvider();

    await expect(provider.fetchInstruments()).resolves.toEqual([
      expect.objectContaining({
        symbol: 'AAPL',
      }),
    ]);
  });

  it('rejects CSV responses with unexpected headers', async () => {
    mockFetchResponse(
      ['ticker,company,venue', 'AAPL,Apple Inc.,NASDAQ'].join('\n'),
    );
    const provider = new AlphaVantageInstrumentCatalogProvider();

    await expect(provider.fetchInstruments()).rejects.toThrow(
      'Alpha Vantage listing response has no instruments',
    );
  });

  it('handles CSV rows with missing trailing columns', async () => {
    mockFetchResponse(
      [
        'symbol,name,exchange,assetType,ipoDate,delistingDate,status',
        'AAPL,Apple Inc.,NASDAQ',
      ].join('\n'),
    );
    const provider = new AlphaVantageInstrumentCatalogProvider();

    await expect(provider.fetchInstruments()).resolves.toEqual([
      expect.objectContaining({
        symbol: 'AAPL',
        status: 'ACTIVE',
      }),
    ]);
  });

  function mockFetchResponse(body: string): void {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(body),
    });
  }
});
