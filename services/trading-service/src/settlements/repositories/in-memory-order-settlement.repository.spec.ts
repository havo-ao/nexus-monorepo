import { InMemoryOrderSettlementRepository } from './in-memory-order-settlement.repository';

describe('InMemoryOrderSettlementRepository', () => {
  it('returns the configured settlement context and stores settlement results', async () => {
    const repository = new InMemoryOrderSettlementRepository();
    repository.context = {
      order: {
        id: '1',
        orderReference: 'order-reference',
        traderId: '101',
        side: 'BUY',
        orderType: 'MARKET',
        status: 'SENT_TO_BROKER',
        symbol: 'AAPL',
        stockId: '1',
        quantity: 2,
        estimatedUnitPrice: 250,
        grossAmount: 500,
        reservedAmount: 501.75,
        currency: 'USD',
      },
      execution: {
        brokerName: 'ALPACA',
        externalOrderId: 'alpaca-id',
        brokerStatus: 'accepted',
      },
    };

    await expect(
      repository.findSettlementContext('order-reference'),
    ).resolves.toBe(repository.context);
    await expect(
      repository.settleBrokerStatus({
        context: repository.context,
        brokerStatus: {
          brokerName: 'ALPACA',
          externalOrderId: 'alpaca-id',
          brokerStatus: 'filled',
          filledQuantity: 2,
          averageFilledPrice: 251,
          responseSummary: 'filled',
        },
        nextStatus: 'EXECUTED',
        actorId: 'ALPACA',
        reason: 'Broker ALPACA returned filled',
        commissionAmount: 1.76,
        portfolioUpdated: true,
        fundsUpdated: true,
        notification: { delivered: true },
      }),
    ).resolves.toMatchObject({
      status: 'EXECUTED',
      settledAmount: 502,
      commissionAmount: 1.76,
      netAmount: 503.76,
      portfolioUpdated: true,
      fundsUpdated: true,
    });
    expect(repository.settlements).toHaveLength(1);
  });

  it('uses order quantity and estimated price fallbacks for non-filled sell settlements', async () => {
    const repository = new InMemoryOrderSettlementRepository();
    const context = {
      order: {
        id: '1',
        orderReference: 'order-reference',
        traderId: '101',
        side: 'SELL' as const,
        orderType: 'MARKET' as const,
        status: 'SENT_TO_BROKER' as const,
        symbol: 'AAPL',
        stockId: '1',
        quantity: 2,
        estimatedUnitPrice: 250,
        grossAmount: 500,
        reservedAmount: 0,
        currency: 'USD',
      },
      execution: {
        brokerName: 'ALPACA',
        externalOrderId: 'alpaca-id',
        brokerStatus: 'accepted',
      },
    };

    await expect(
      repository.settleBrokerStatus({
        context,
        brokerStatus: {
          brokerName: 'ALPACA',
          externalOrderId: 'alpaca-id',
          brokerStatus: 'accepted',
          filledQuantity: 0,
          responseSummary: 'accepted',
        },
        nextStatus: 'SENT_TO_BROKER',
        actorId: 'ALPACA',
        reason: 'Broker ALPACA returned accepted',
        commissionAmount: 0,
        portfolioUpdated: false,
        fundsUpdated: false,
        notification: { delivered: false },
      }),
    ).resolves.toMatchObject({
      side: 'SELL',
      filledQuantity: 2,
      averageFilledPrice: 250,
      netAmount: 500,
    });
  });
});
