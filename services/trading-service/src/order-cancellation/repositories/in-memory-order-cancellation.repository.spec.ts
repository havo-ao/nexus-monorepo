import { InMemoryOrderCancellationRepository } from './in-memory-order-cancellation.repository';

describe('InMemoryOrderCancellationRepository', () => {
  it('cancels a seeded open order and releases reserved amount', async () => {
    const repository = new InMemoryOrderCancellationRepository();

    const result = await repository.cancelOrder({
      orderReference: 'order-reference',
      actorId: '101',
      reason: 'Trader requested cancellation before execution',
    });

    expect(result.cancelled).toBe(true);
    expect(result.cancellation).toMatchObject({
      orderReference: 'order-reference',
      previousStatus: 'PENDING_EXECUTION',
      currentStatus: 'CANCELLED',
      releasedAmount: 250,
    });
  });

  it('rejects cancellation when the order does not exist', async () => {
    const repository = new InMemoryOrderCancellationRepository();

    await expect(
      repository.cancelOrder({
        orderReference: 'missing-order',
        actorId: '101',
        reason: 'Trader requested cancellation before execution',
      }),
    ).resolves.toEqual({
      cancelled: false,
      reason: 'Order was not found',
    });
  });

  it('rejects cancellation when the order is already cancelled', async () => {
    const repository = new InMemoryOrderCancellationRepository();

    await repository.cancelOrder({
      orderReference: 'order-reference',
      actorId: '101',
      reason: 'Trader requested cancellation before execution',
    });

    await expect(
      repository.cancelOrder({
        orderReference: 'order-reference',
        actorId: '101',
        reason: 'Trader requested cancellation before execution',
      }),
    ).resolves.toEqual({
      cancelled: false,
      reason: 'Order cannot be cancelled from status CANCELLED',
    });
  });
});
