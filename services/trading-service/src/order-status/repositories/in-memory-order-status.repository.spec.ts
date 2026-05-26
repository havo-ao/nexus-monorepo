import { InMemoryOrderStatusRepository } from './in-memory-order-status.repository';

describe('InMemoryOrderStatusRepository', () => {
  it('finds a seeded current order status by reference', async () => {
    const repository = new InMemoryOrderStatusRepository();

    await expect(
      repository.findCurrentStatusByReference('order-reference'),
    ).resolves.toMatchObject({
      orderReference: 'order-reference',
      traderId: '101',
      status: 'PENDING_EXECUTION',
      symbol: 'AAPL',
    });
  });

  it('returns null when the reference is unknown', async () => {
    const repository = new InMemoryOrderStatusRepository();

    await expect(
      repository.findCurrentStatusByReference('missing-order'),
    ).resolves.toBeNull();
  });
});
