import { HttpMarketPriceClient } from './http-market-price.client';
import { MarketPriceClientError } from './market-price.client';

describe('HttpMarketPriceClient', () => {
  const originalEnv = process.env;
  let fetchMock: jest.Mock;
  let client: HttpMarketPriceClient;

  beforeEach(() => {
    jest.useFakeTimers();
    process.env = { ...originalEnv, MARKET_SERVICE_URL: 'http://market' };
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    client = new HttpMarketPriceClient();
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('loads the latest quote from market-service', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            symbol: 'AAPL',
            price: 250,
            asOf: '2026-05-12T14:30:00.000Z',
          }),
        ),
    });

    await expect(client.getLatestPrice(' aapl ')).resolves.toEqual({
      symbol: 'AAPL',
      price: 250,
      asOf: '2026-05-12T14:30:00.000Z',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://market/api/v1/quotes/AAPL',
      expect.objectContaining({
        headers: { accept: 'application/json' },
      }),
    );
  });

  it('uses the requested symbol when the response omits it', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ price: 250 })),
    });

    await expect(client.getLatestPrice('AAPL')).resolves.toMatchObject({
      symbol: 'AAPL',
      price: 250,
    });
  });

  it('fails closed when market-service is missing or rejects the quote', async () => {
    process.env.MARKET_SERVICE_URL = '';
    await expect(client.getLatestPrice('AAPL')).rejects.toThrow(
      MarketPriceClientError,
    );

    process.env.MARKET_SERVICE_URL = 'http://market';
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve(JSON.stringify({ message: 'Not found' })),
    });
    await expect(client.getLatestPrice('AAPL')).rejects.toThrow('Not found');

    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ symbol: 'AAPL' })),
    });
    await expect(client.getLatestPrice('AAPL')).rejects.toThrow(
      'Market quote price is not available',
    );

    await expect(client.getLatestPrice(' ')).rejects.toThrow(
      'Symbol is required',
    );
  });

  it('uses status fallback for empty or non-json error responses', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve(''),
    });
    await expect(client.getLatestPrice('AAPL')).rejects.toThrow(
      'Market quote service rejected request with 500',
    );

    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      text: () => Promise.resolve('upstream exploded'),
    });
    await expect(client.getLatestPrice('AAPL')).rejects.toThrow(
      'upstream exploded',
    );
  });

  it('normalizes timeout and network failures', async () => {
    fetchMock.mockRejectedValue(
      Object.assign(new Error('Aborted'), { name: 'AbortError' }),
    );
    await expect(client.getLatestPrice('AAPL')).rejects.toThrow(
      'Market quote request timed out',
    );

    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(client.getLatestPrice('AAPL')).rejects.toThrow(
      'Market quote service is unavailable',
    );
  });

  it('falls back to the default timeout when configuration is invalid', async () => {
    process.env.MARKET_SERVICE_TIMEOUT_MS = 'invalid';
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ symbol: 'AAPL', price: 1 })),
    });

    await expect(client.getLatestPrice('AAPL')).resolves.toMatchObject({
      price: 1,
    });
  });
});
