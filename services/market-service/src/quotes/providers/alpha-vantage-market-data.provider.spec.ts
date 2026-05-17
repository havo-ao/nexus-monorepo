import { AlphaVantageMarketDataProvider } from './alpha-vantage-market-data.provider';

describe('AlphaVantageMarketDataProvider', () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const originalBaseUrl = process.env.ALPHA_VANTAGE_BASE_URL;
  const originalTimeout = process.env.ALPHA_VANTAGE_TIMEOUT_MS;

  let provider: AlphaVantageMarketDataProvider;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    provider = new AlphaVantageMarketDataProvider();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    process.env.ALPHA_VANTAGE_API_KEY = 'test-key';
    delete process.env.ALPHA_VANTAGE_BASE_URL;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.ALPHA_VANTAGE_API_KEY = originalApiKey;
    process.env.ALPHA_VANTAGE_BASE_URL = originalBaseUrl;
    process.env.ALPHA_VANTAGE_TIMEOUT_MS = originalTimeout;
  });

  it('fetches and maps global quote data from Alpha Vantage', async () => {
    const startedAt = Date.now();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          'Global Quote': {
            '01. symbol': 'AAPL',
            '05. price': '186.4000',
            '07. latest trading day': '2026-05-15',
          },
        }),
    } as Response);

    const quote = await provider.fetchQuote(' aapl ');
    const requestedUrl = fetchMock.mock.calls[0]?.[0];
    const requestOptions = fetchMock.mock.calls[0]?.[1];

    expect(requestedUrl).toBeInstanceOf(URL);
    if (!(requestedUrl instanceof URL)) {
      throw new TypeError('Expected Alpha Vantage request URL');
    }
    expect(requestedUrl.searchParams.get('symbol')).toBe('AAPL');
    expect(requestOptions?.signal).toBeInstanceOf(AbortSignal);
    expect(quote).toMatchObject({
      symbol: 'AAPL',
      price: 186.4,
      bid: 186.35,
      ask: 186.45,
      currency: 'USD',
      provider: 'alpha-vantage',
    });
    expect(quote.asOf).toBeInstanceOf(Date);
    expect(quote.asOf.getTime()).toBeGreaterThanOrEqual(startedAt);
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

    await expect(provider.fetchQuote('MSFT')).rejects.toThrow(TypeError);
  });

  it('rejects empty symbols before calling the provider', async () => {
    await expect(provider.fetchQuote(' ')).rejects.toThrow(TypeError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects unsuccessful HTTP responses', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: () => Promise.resolve({}),
    } as Response);

    await expect(provider.fetchQuote('AAPL')).rejects.toThrow(TypeError);
  });

  it('rejects non-object provider responses', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(null),
    } as Response);

    await expect(provider.fetchQuote('AAPL')).rejects.toThrow(TypeError);
  });

  it('rejects responses without a quote payload', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    } as Response);

    await expect(provider.fetchQuote('AAPL')).rejects.toThrow(TypeError);
  });

  it('uses a configured timeout for external requests', async () => {
    process.env.ALPHA_VANTAGE_TIMEOUT_MS = '1500';
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          'Global Quote': {
            '01. symbol': 'MSFT',
            '05. price': '214.4000',
          },
        }),
    } as Response);

    await provider.fetchQuote('MSFT');

    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it('falls back to the default timeout when configuration is invalid', async () => {
    process.env.ALPHA_VANTAGE_TIMEOUT_MS = 'invalid';
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          'Global Quote': {
            '05. price': '214.4000',
          },
        }),
    } as Response);

    const quote = await provider.fetchQuote('MSFT');

    expect(quote.symbol).toBe('MSFT');
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it('rejects invalid quote payloads', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          'Global Quote': {
            '01. symbol': 'TSLA',
            '05. price': 'not-a-number',
          },
        }),
    } as Response);

    await expect(provider.fetchQuote('TSLA')).rejects.toThrow(RangeError);
  });

  it('requires an API key when the provider is selected directly', async () => {
    delete process.env.ALPHA_VANTAGE_API_KEY;

    await expect(provider.fetchQuote('AAPL')).rejects.toThrow(TypeError);
  });
});
