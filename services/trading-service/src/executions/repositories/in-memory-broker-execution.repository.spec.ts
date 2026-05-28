import { InMemoryBrokerExecutionRepository } from './in-memory-broker-execution.repository';

describe('InMemoryBrokerExecutionRepository', () => {
  it('marks an order as sent to broker', async () => {
    const repository = new InMemoryBrokerExecutionRepository();
    const order = await repository.findExecutableOrder('order-reference');

    await expect(
      repository.markOrderSentToBroker({
        order: order!,
        brokerResponse: {
          brokerName: 'ALPACA',
          externalOrderId: 'alpaca-order-reference',
          brokerStatus: 'ACCEPTED',
          requestSummary: 'BUY 1 AAPL MARKET',
          responseSummary: 'Broker accepted order alpaca-order-reference',
        },
      }),
    ).resolves.toMatchObject({
      orderReference: 'order-reference',
      status: 'SENT_TO_BROKER',
      externalOrderId: 'alpaca-order-reference',
    });
    await expect(
      repository.findExecutableOrder('order-reference'),
    ).resolves.toMatchObject({
      status: 'SENT_TO_BROKER',
    });
    expect(repository.executions).toHaveLength(1);
  });

  it('returns null when the order is unknown', async () => {
    const repository = new InMemoryBrokerExecutionRepository();

    await expect(repository.findExecutableOrder('missing-order')).resolves.toBe(
      null,
    );
  });

  it('marks an order as failed by broker', async () => {
    const repository = new InMemoryBrokerExecutionRepository();
    const order = await repository.findExecutableOrder(
      'broker-failure-order-reference',
    );

    await expect(
      repository.markOrderFailedByBroker({
        order: order!,
        brokerName: 'ALPACA',
        brokerStatus: 'FAILED',
        requestSummary: 'BUY 1 FAIL MARKET',
        failureReason: 'Broker rejected the order submission',
      }),
    ).resolves.toMatchObject({
      orderReference: 'broker-failure-order-reference',
      status: 'FAILED',
      externalOrderId: 'unavailable',
      brokerStatus: 'FAILED',
    });
    await expect(
      repository.findExecutableOrder('broker-failure-order-reference'),
    ).resolves.toMatchObject({
      status: 'FAILED',
    });
  });
});
