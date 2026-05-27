import { InMemoryBrokerOrderValidationRepository } from './in-memory-broker-order-validation.repository';

describe('InMemoryBrokerOrderValidationRepository', () => {
  it('stores broker validation and updates the order status', async () => {
    const repository = new InMemoryBrokerOrderValidationRepository();
    const order = await repository.findOrderByReference('order-reference');

    await expect(
      repository.saveValidation({
        order: order!,
        brokerId: '201',
        decision: 'REJECT',
        nextStatus: 'REJECTED',
        reason: 'Risk policy',
      }),
    ).resolves.toMatchObject({
      orderReference: 'order-reference',
      brokerId: '201',
      decision: 'REJECT',
      status: 'REJECTED',
      reason: 'Risk policy',
    });

    await expect(
      repository.findOrderByReference('order-reference'),
    ).resolves.toMatchObject({
      status: 'REJECTED',
    });
    expect(repository.validations).toHaveLength(1);
  });
});
