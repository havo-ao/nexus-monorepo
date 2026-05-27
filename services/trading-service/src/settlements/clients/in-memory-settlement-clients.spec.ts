import { InMemoryPortfolioSettlementClient } from './in-memory-portfolio-settlement.client';
import { InMemoryTradingNotificationClient } from './in-memory-trading-notification.client';

describe('In-memory settlement clients', () => {
  it('stores portfolio settlement commands for tests', async () => {
    const client = new InMemoryPortfolioSettlementClient();

    await expect(
      client.applyExecutedOrder({
        traderId: '101',
        stockId: '1',
        side: 'BUY',
        quantity: 1,
        executionPrice: 250,
        grossAmount: 250,
        netAmount: 251,
        reservedAmount: 251,
        currency: 'USD',
        orderReference: 'order-reference',
        externalOrderId: 'alpaca-id',
        executedAt: '2026-05-27T10:00:00.000Z',
      }),
    ).resolves.toEqual({
      portfolioUpdated: true,
      fundsUpdated: true,
    });
    expect(client.settlements).toHaveLength(1);
  });

  it('stores notification commands and reports missing recipients', async () => {
    const client = new InMemoryTradingNotificationClient();

    await expect(
      client.sendOrderExecuted({
        orderReference: 'order-reference',
        occurredAt: '2026-05-27T10:00:00.000Z',
      }),
    ).resolves.toMatchObject({
      delivered: false,
      reason: 'Notification recipient was not provided',
    });
    expect(client.notifications).toHaveLength(1);
  });

  it('reports delivered notifications when recipient data exists', async () => {
    const client = new InMemoryTradingNotificationClient();

    await expect(
      client.sendOrderExecuted({
        orderReference: 'order-reference',
        occurredAt: '2026-05-27T10:00:00.000Z',
        recipient: {
          email: 'andy@nexus.local',
          name: 'Andy',
          surname: 'Trader',
          username: 'andy',
        },
      }),
    ).resolves.toEqual({
      delivered: true,
      recipientEmail: 'andy@nexus.local',
      reason: undefined,
    });
  });
});
