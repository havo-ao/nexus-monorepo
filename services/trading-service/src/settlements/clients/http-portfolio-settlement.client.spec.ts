import { HttpPortfolioSettlementClient } from './http-portfolio-settlement.client';
import { PortfolioSettlementError } from './portfolio-settlement.client';

describe('HttpPortfolioSettlementClient', () => {
  const originalFetch = global.fetch;
  const originalPortfolioUrl = process.env.PORTFOLIO_SERVICE_URL;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    process.env.PORTFOLIO_SERVICE_URL = 'http://portfolio-service:8883';
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(''),
    });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.PORTFOLIO_SERVICE_URL = originalPortfolioUrl;
  });

  it('captures reserved funds and records a buy position through portfolio-service', async () => {
    const client = new HttpPortfolioSettlementClient();

    await expect(
      client.applyExecutedOrder({
        authorizationHeader: 'Bearer token',
        traderId: '101',
        stockId: '1',
        side: 'BUY',
        quantity: 2,
        executionPrice: 251,
        grossAmount: 502,
        netAmount: 503.76,
        reservedAmount: 501.75,
        currency: 'USD',
        orderReference: 'order-reference',
        externalOrderId: 'alpaca-id',
        executedAt: '2026-05-27T10:00:00.000Z',
      }),
    ).resolves.toEqual({
      portfolioUpdated: true,
      fundsUpdated: true,
    });

    expect(fetchMock.mock.calls).toHaveLength(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://portfolio-service:8883/api/v1/portfolio/101/reservations/captures',
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'http://portfolio-service:8883/api/v1/portfolio/positions/purchases',
    );
  });

  it('deposits sell proceeds and records a sell position through portfolio-service', async () => {
    const client = new HttpPortfolioSettlementClient();

    await expect(
      client.applyExecutedOrder({
        authorizationHeader: 'Bearer token',
        traderId: '101',
        stockId: '1',
        side: 'SELL',
        quantity: 2,
        executionPrice: 251,
        grossAmount: 502,
        netAmount: 500.24,
        reservedAmount: 0,
        currency: 'USD',
        orderReference: 'order-reference',
        externalOrderId: 'alpaca-id',
        executedAt: '2026-05-27T10:00:00.000Z',
      }),
    ).resolves.toEqual({
      portfolioUpdated: true,
      fundsUpdated: true,
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://portfolio-service:8883/api/v1/portfolio/101/deposits',
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'http://portfolio-service:8883/api/v1/portfolio/positions/sales',
    );
  });

  it('requires the user authorization header because portfolio-service is trader scoped', async () => {
    const client = new HttpPortfolioSettlementClient();

    await expect(
      client.applyExecutedOrder({
        traderId: '101',
        stockId: '1',
        side: 'BUY',
        quantity: 2,
        executionPrice: 251,
        grossAmount: 502,
        netAmount: 503.76,
        reservedAmount: 501.75,
        currency: 'USD',
        orderReference: 'order-reference',
        externalOrderId: 'alpaca-id',
        executedAt: '2026-05-27T10:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(PortfolioSettlementError);
  });

  it('reports unavailable portfolio integration when the service URL is missing', async () => {
    process.env.PORTFOLIO_SERVICE_URL = '';
    const client = new HttpPortfolioSettlementClient();

    await expect(
      client.applyExecutedOrder({
        authorizationHeader: 'Bearer token',
        traderId: '101',
        side: 'BUY',
        quantity: 2,
        executionPrice: 251,
        grossAmount: 502,
        netAmount: 503.76,
        reservedAmount: 501.75,
        currency: 'USD',
        orderReference: 'order-reference',
        externalOrderId: 'alpaca-id',
        executedAt: '2026-05-27T10:00:00.000Z',
      }),
    ).resolves.toEqual({
      portfolioUpdated: false,
      fundsUpdated: false,
      reason: 'PORTFOLIO_SERVICE_URL is not configured',
    });
  });

  it('can settle funds even when no stock id is available for position recording', async () => {
    const client = new HttpPortfolioSettlementClient();

    await expect(
      client.applyExecutedOrder({
        authorizationHeader: 'Bearer token',
        traderId: '101',
        side: 'BUY',
        quantity: 2,
        executionPrice: 251,
        grossAmount: 502,
        netAmount: 503.76,
        reservedAmount: 501.75,
        currency: 'USD',
        orderReference: 'order-reference',
        externalOrderId: 'alpaca-id',
        executedAt: '2026-05-27T10:00:00.000Z',
      }),
    ).resolves.toEqual({
      portfolioUpdated: false,
      fundsUpdated: true,
    });
    expect(fetchMock.mock.calls).toHaveLength(1);
  });

  it('uses portfolio-service error messages when settlement is rejected', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ message: ['reserved balance is insufficient'] }),
        {
          status: 400,
        },
      ),
    );
    const client = new HttpPortfolioSettlementClient();

    await expect(
      client.applyExecutedOrder({
        authorizationHeader: 'Bearer token',
        traderId: '101',
        stockId: '1',
        side: 'BUY',
        quantity: 2,
        executionPrice: 251,
        grossAmount: 502,
        netAmount: 503.76,
        reservedAmount: 501.75,
        currency: 'USD',
        orderReference: 'order-reference',
        externalOrderId: 'alpaca-id',
        executedAt: '2026-05-27T10:00:00.000Z',
      }),
    ).rejects.toThrow('reserved balance is insufficient');
  });

  it('uses the HTTP status when portfolio-service returns an empty error body', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }));
    const client = new HttpPortfolioSettlementClient();

    await expect(client.applyExecutedOrder(baseBuyCommand())).rejects.toThrow(
      'Portfolio service returned HTTP 500',
    );
  });

  it('uses string, object, and raw error bodies from portfolio-service', async () => {
    const client = new HttpPortfolioSettlementClient();

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ message: 'reserved balance is insufficient' }),
        {
          status: 400,
        },
      ),
    );
    await expect(client.applyExecutedOrder(baseBuyCommand())).rejects.toThrow(
      'reserved balance is insufficient',
    );

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: { code: 'PORTFOLIO_FAILED' } }), {
        status: 400,
      }),
    );
    await expect(client.applyExecutedOrder(baseBuyCommand())).rejects.toThrow(
      '{"code":"PORTFOLIO_FAILED"}',
    );

    fetchMock.mockResolvedValueOnce(
      new Response('plain failure', { status: 400 }),
    );
    await expect(client.applyExecutedOrder(baseBuyCommand())).rejects.toThrow(
      'plain failure',
    );
  });

  function baseBuyCommand() {
    return {
      authorizationHeader: 'Bearer token',
      traderId: '101',
      stockId: '1',
      side: 'BUY' as const,
      quantity: 2,
      executionPrice: 251,
      grossAmount: 502,
      netAmount: 503.76,
      reservedAmount: 501.75,
      currency: 'USD',
      orderReference: 'order-reference',
      externalOrderId: 'alpaca-id',
      executedAt: '2026-05-27T10:00:00.000Z',
    };
  }
});
