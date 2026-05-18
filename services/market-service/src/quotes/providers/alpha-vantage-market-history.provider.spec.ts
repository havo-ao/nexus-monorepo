import { AlphaVantageMarketHistoryProvider } from './alpha-vantage-market-history.provider';

describe('AlphaVantageMarketHistoryProvider', () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const originalBaseUrl = process.env.ALPHA_VANTAGE_BASE_URL;
  const originalOutputSize = process.env.ALPHA_VANTAGE_HISTORY_OUTPUT_SIZE;
  const originalTimeout = process.env.ALPHA_VANTAGE_TIMEOUT_MS;

  let provider: AlphaVantageMarketHistoryProvider;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    provider = new AlphaVantageMarketHistoryProvider();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    process.env.ALPHA_VANTAGE_API_KEY = 'test-key';
    delete process.env.ALPHA_VANTAGE_BASE_URL;
    delete process.env.ALPHA_VANTAGE_HISTORY_OUTPUT_SIZE;
    delete process.env.ALPHA_VANTAGE_TIMEOUT_MS;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.ALPHA_VANTAGE_API_KEY = originalApiKey;
    process.env.ALPHA_VANTAGE_BASE_URL = originalBaseUrl;
    process.env.ALPHA_VANTAGE_HISTORY_OUTPUT_SIZE = originalOutputSize;
    process.env.ALPHA_VANTAGE_TIMEOUT_MS = originalTimeout;
  });

  it('fetches and maps daily historical prices from Alpha Vantage', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          'Time Series (Daily)': {
            '2026-05-15': {
              '4. close': '186.4000',
            },
            '2026-05-14': {
              '4. close': '184.1000',
            },
          },
        }),
    } as Response);

    const history = await provider.fetchDailyHistory(' aapl ');
    const requestedUrl = fetchMock.mock.calls[0]?.[0];
    const requestOptions = fetchMock.mock.calls[0]?.[1];

    expect(requestedUrl).toBeInstanceOf(URL);
    if (!(requestedUrl instanceof URL)) {
      throw new TypeError('Expected Alpha Vantage history request URL');
    }
    expect(requestedUrl.searchParams.get('function')).toBe('TIME_SERIES_DAILY');
    expect(requestedUrl.searchParams.get('symbol')).toBe('AAPL');
    expect(requestedUrl.searchParams.get('outputsize')).toBe('compact');
    expect(requestOptions?.signal).toBeInstanceOf(AbortSignal);
    expect(history.map((quote) => quote.asOf.toISOString())).toEqual([
      '2026-05-14T00:00:00.000Z',
      '2026-05-15T00:00:00.000Z',
    ]);
    expect(history[0]).toEqual(
      expect.objectContaining({
        symbol: 'AAPL',
        price: 184.1,
        bid: 184.05,
        ask: 184.15,
        currency: 'USD',
        provider: 'alpha-vantage',
      }),
    );
  });

  it('uses configured output size for history requests', async () => {
    process.env.ALPHA_VANTAGE_HISTORY_OUTPUT_SIZE = 'full';
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          'Time Series (Daily)': {
            '2026-05-15': {
              '4. close': '186.4000',
            },
          },
        }),
    } as Response);

    await provider.fetchDailyHistory('AAPL');
    const requestedUrl = fetchMock.mock.calls[0]?.[0];

    if (!(requestedUrl instanceof URL)) {
      throw new TypeError('Expected Alpha Vantage history request URL');
    }
    expect(requestedUrl.searchParams.get('outputsize')).toBe('full');
  });

  it('rejects empty symbols before calling the provider', async () => {
    await expect(provider.fetchDailyHistory(' ')).rejects.toThrow(TypeError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects provider throttling messages', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          Note: 'Thank you for using Alpha Vantage.',
        }),
    } as Response);

    await expect(provider.fetchDailyHistory('MSFT')).rejects.toThrow(TypeError);
  });

  it('rejects unsuccessful HTTP responses', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: () => Promise.resolve({}),
    } as Response);

    await expect(provider.fetchDailyHistory('AAPL')).rejects.toThrow(TypeError);
  });

  it('rejects incomplete historical responses', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    } as Response);

    await expect(provider.fetchDailyHistory('AAPL')).rejects.toThrow(TypeError);
  });

  it('rejects non-object provider responses', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(null),
    } as Response);

    await expect(provider.fetchDailyHistory('AAPL')).rejects.toThrow(TypeError);
  });

  it('rejects invalid daily bars', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          'Time Series (Daily)': {
            '2026-05-15': null,
          },
        }),
    } as Response);

    await expect(provider.fetchDailyHistory('AAPL')).rejects.toThrow(TypeError);
  });

  it('rejects invalid daily dates', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          'Time Series (Daily)': {
            invalid: {
              '4. close': '186.4000',
            },
          },
        }),
    } as Response);

    await expect(provider.fetchDailyHistory('AAPL')).rejects.toThrow(TypeError);
  });

  it('rejects invalid close prices', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          'Time Series (Daily)': {
            '2026-05-15': {
              '4. close': 'not-a-number',
            },
          },
        }),
    } as Response);

    await expect(provider.fetchDailyHistory('AAPL')).rejects.toThrow(
      RangeError,
    );
  });

  it('falls back to the default timeout when configuration is invalid', async () => {
    process.env.ALPHA_VANTAGE_TIMEOUT_MS = 'invalid';
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          'Time Series (Daily)': {
            '2026-05-15': {
              '4. close': '186.4000',
            },
          },
        }),
    } as Response);

    const history = await provider.fetchDailyHistory('AAPL');

    expect(history).toHaveLength(1);
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it('requires an API key when selected directly', async () => {
    delete process.env.ALPHA_VANTAGE_API_KEY;

    await expect(provider.fetchDailyHistory('AAPL')).rejects.toThrow(TypeError);
  });
});
