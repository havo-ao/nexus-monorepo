import { AlpacaBrokerClient } from './alpaca-broker.client';
import { BrokerOrderSubmissionError } from './external-broker.client';

describe('AlpacaBrokerClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns a controlled broker acknowledgement', async () => {
    process.env.ALPACA_BROKER_MODE = 'mock';
    const client = new AlpacaBrokerClient();

    await expect(
      client.sendOrder({
        orderReference: 'order-reference',
        side: 'BUY',
        orderType: 'MARKET',
        symbol: 'AAPL',
        quantity: 1,
        estimatedUnitPrice: 250,
        currency: 'USD',
      }),
    ).resolves.toEqual({
      brokerName: 'ALPACA',
      externalOrderId: 'alpaca-order-reference',
      brokerStatus: 'ACCEPTED',
      requestSummary: 'BUY 1 AAPL MARKET',
      responseSummary: 'Broker accepted order alpaca-order-reference',
    });
  });

  it('raises a controlled broker error when submission is rejected', async () => {
    process.env.ALPACA_BROKER_MODE = 'mock';
    const client = new AlpacaBrokerClient();

    await expect(
      client.sendOrder({
        orderReference: 'broker-failure-order-reference',
        side: 'BUY',
        orderType: 'MARKET',
        symbol: 'FAIL',
        quantity: 1,
        estimatedUnitPrice: 250,
        currency: 'USD',
      }),
    ).rejects.toThrow(BrokerOrderSubmissionError);
  });

  it('submits a real Alpaca market order through the configured HTTP client', async () => {
    process.env.ALPACA_BROKER_MODE = 'real';
    process.env.ALPACA_API_BASE_URL = 'https://paper-api.alpaca.markets/v2';
    process.env.ALPACA_API_KEY = 'api-key';
    process.env.ALPACA_SECRET_KEY = 'secret-key';
    process.env.ALPACA_TIMEOUT_MS = '5000';
    const fetchClient = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'alpaca-external-id',
          status: 'accepted',
          client_order_id: 'order-reference',
        }),
        { status: 200 },
      ),
    );
    const client = new AlpacaBrokerClient();

    await expect(
      client.sendOrder({
        orderReference: 'order-reference',
        side: 'BUY',
        orderType: 'MARKET',
        symbol: 'AAPL',
        quantity: 1,
        estimatedUnitPrice: 250,
        currency: 'USD',
      }),
    ).resolves.toEqual({
      brokerName: 'ALPACA',
      externalOrderId: 'alpaca-external-id',
      brokerStatus: 'accepted',
      requestSummary: 'BUY 1 AAPL MARKET',
      responseSummary:
        'Alpaca order alpaca-external-id returned status accepted',
    });
    expect(fetchClient).toHaveBeenCalledWith(
      'https://paper-api.alpaca.markets/v2/orders',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          symbol: 'AAPL',
          qty: '1',
          side: 'buy',
          type: 'market',
          time_in_force: 'day',
          client_order_id: 'order-reference',
        }),
      }),
    );
  });

  it('maps limit and stop prices for Alpaca order submissions', async () => {
    process.env.ALPACA_BROKER_MODE = 'real';
    process.env.ALPACA_API_KEY = 'api-key';
    process.env.ALPACA_SECRET_KEY = 'secret-key';
    const fetchClient = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'alpaca-limit-id' }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'alpaca-stop-id' }), {
          status: 200,
        }),
      );
    const client = new AlpacaBrokerClient();

    await client.sendOrder({
      orderReference: 'limit-order-reference',
      side: 'SELL',
      orderType: 'LIMIT',
      symbol: 'AAPL',
      quantity: 2,
      estimatedUnitPrice: 260,
      limitPrice: 255,
      currency: 'USD',
    });

    await client.sendOrder({
      orderReference: 'stop-order-reference',
      side: 'SELL',
      orderType: 'STOP_LOSS',
      symbol: 'AAPL',
      quantity: 2,
      estimatedUnitPrice: 220,
      limitPrice: 215,
      currency: 'USD',
    });

    expect(fetchClient).toHaveBeenNthCalledWith(
      1,
      'https://paper-api.alpaca.markets/v2/orders',
      expect.objectContaining({
        body: JSON.stringify({
          symbol: 'AAPL',
          qty: '2',
          side: 'sell',
          type: 'limit',
          time_in_force: 'day',
          client_order_id: 'limit-order-reference',
          limit_price: '255',
        }),
      }),
    );
    expect(fetchClient).toHaveBeenNthCalledWith(
      2,
      'https://paper-api.alpaca.markets/v2/orders',
      expect.objectContaining({
        body: JSON.stringify({
          symbol: 'AAPL',
          qty: '2',
          side: 'sell',
          type: 'stop',
          time_in_force: 'day',
          client_order_id: 'stop-order-reference',
          stop_price: '215',
        }),
      }),
    );
  });

  it('raises a configuration error when real mode has no credentials', async () => {
    process.env.ALPACA_BROKER_MODE = 'real';
    const fetchClient = jest.spyOn(global, 'fetch');
    const client = new AlpacaBrokerClient();

    await expect(
      client.sendOrder({
        orderReference: 'order-reference',
        side: 'BUY',
        orderType: 'MARKET',
        symbol: 'AAPL',
        quantity: 1,
        estimatedUnitPrice: 250,
        currency: 'USD',
      }),
    ).rejects.toMatchObject({
      brokerName: 'ALPACA',
      brokerStatus: 'CONFIGURATION_ERROR',
    });
    expect(fetchClient).not.toHaveBeenCalled();
  });

  it('raises a controlled broker error when Alpaca rejects the request', async () => {
    process.env.ALPACA_BROKER_MODE = 'real';
    process.env.ALPACA_API_KEY = 'api-key';
    process.env.ALPACA_SECRET_KEY = 'secret-key';
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'insufficient buying power' }), {
        status: 403,
        statusText: 'Forbidden',
      }),
    );
    const client = new AlpacaBrokerClient();

    await expect(
      client.sendOrder({
        orderReference: 'order-reference',
        side: 'BUY',
        orderType: 'MARKET',
        symbol: 'AAPL',
        quantity: 1,
        estimatedUnitPrice: 250,
        currency: 'USD',
      }),
    ).rejects.toMatchObject({
      brokerName: 'ALPACA',
      brokerStatus: '403',
      message: 'insufficient buying power',
    });
  });

  it('uses fallbacks when Alpaca returns an empty successful response', async () => {
    process.env.ALPACA_BROKER_MODE = 'real';
    process.env.ALPACA_API_KEY = 'api-key';
    process.env.ALPACA_SECRET_KEY = 'secret-key';
    process.env.ALPACA_TIMEOUT_MS = 'not-a-number';
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('', { status: 200 }));
    const client = new AlpacaBrokerClient();

    await expect(
      client.sendOrder({
        orderReference: 'take-profit-reference',
        side: 'SELL',
        orderType: 'TAKE_PROFIT',
        symbol: 'AAPL',
        quantity: 1,
        estimatedUnitPrice: 290,
        currency: 'USD',
      }),
    ).resolves.toEqual({
      brokerName: 'ALPACA',
      externalOrderId: 'take-profit-reference',
      brokerStatus: 'ACCEPTED',
      requestSummary: 'SELL 1 AAPL LIMIT',
      responseSummary: 'Alpaca order unknown returned status ACCEPTED',
    });
  });

  it('preserves non-json Alpaca error responses', async () => {
    process.env.ALPACA_BROKER_MODE = 'real';
    process.env.ALPACA_API_KEY = 'api-key';
    process.env.ALPACA_SECRET_KEY = 'secret-key';
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('plain broker failure', { status: 422 }));
    const client = new AlpacaBrokerClient();

    await expect(
      client.sendOrder({
        orderReference: 'order-reference',
        side: 'BUY',
        orderType: 'MARKET',
        symbol: 'AAPL',
        quantity: 1,
        estimatedUnitPrice: 250,
        currency: 'USD',
      }),
    ).rejects.toMatchObject({
      brokerName: 'ALPACA',
      brokerStatus: '422',
      message: 'plain broker failure',
    });
  });

  it('maps aborted Alpaca requests to a timeout broker error', async () => {
    process.env.ALPACA_BROKER_MODE = 'real';
    process.env.ALPACA_API_KEY = 'api-key';
    process.env.ALPACA_SECRET_KEY = 'secret-key';
    const timeoutError = new Error('request aborted');
    timeoutError.name = 'AbortError';
    jest.spyOn(global, 'fetch').mockRejectedValue(timeoutError);
    const client = new AlpacaBrokerClient();

    await expect(
      client.sendOrder({
        orderReference: 'order-reference',
        side: 'BUY',
        orderType: 'MARKET',
        symbol: 'AAPL',
        quantity: 1,
        estimatedUnitPrice: 250,
        currency: 'USD',
      }),
    ).rejects.toMatchObject({
      brokerName: 'ALPACA',
      brokerStatus: 'TIMEOUT',
      message: 'request aborted',
    });
  });
});
