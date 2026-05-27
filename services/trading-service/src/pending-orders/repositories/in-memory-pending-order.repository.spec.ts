import { InMemoryPendingOrderRepository } from './in-memory-pending-order.repository';

describe('InMemoryPendingOrderRepository', () => {
  it('finds processable orders and records waiting evaluations', async () => {
    const repository = new InMemoryPendingOrderRepository();

    const orders = await repository.findProcessableOrders(1);
    await repository.recordEvaluation({
      order: orders[0],
      matched: false,
      action: 'WAITING_CONDITION',
      reason: 'Condition has not matched',
      evaluatedAt: new Date('2026-05-12T14:30:00.000Z'),
    });

    expect(orders).toHaveLength(1);
    expect(repository.events).toHaveLength(1);
  });

  it('marks an order ready for execution and updates the captured price', async () => {
    const repository = new InMemoryPendingOrderRepository();
    const [order] = await repository.findProcessableOrders(2);

    const ready = await repository.markReadyForExecution({
      order,
      matched: true,
      action: 'CONDITION_MATCHED',
      reason: 'Condition matched',
      evaluatedAt: new Date('2026-05-12T14:30:00.000Z'),
      marketPrice: 245,
      triggerPrice: 250,
      nextStatus: 'PENDING_EXECUTION',
    });

    expect(ready).toMatchObject({
      status: 'PENDING_EXECUTION',
      estimatedUnitPrice: 245,
      grossAmount: 245,
    });
    expect(repository.events[0]).toMatchObject({
      matched: true,
      action: 'CONDITION_MATCHED',
    });
  });
});
