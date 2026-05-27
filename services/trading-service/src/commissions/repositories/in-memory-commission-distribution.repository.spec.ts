import { InMemoryCommissionDistributionRepository } from './in-memory-commission-distribution.repository';

describe('InMemoryCommissionDistributionRepository', () => {
  it('stores commission distributions in memory', async () => {
    const repository = new InMemoryCommissionDistributionRepository();

    await expect(
      repository.saveDistribution({
        traderId: '101',
        brokerId: '201',
        commissionAmount: 2.63,
        platformAmount: 1.84,
        brokerAmount: 0.79,
        platformShareBps: 7000,
        brokerShareBps: 3000,
        currency: 'USD',
        distributedAt: '2026-05-26T14:30:00.000Z',
      }),
    ).resolves.toMatchObject({
      traderId: '101',
      brokerId: '201',
      platformAmount: 1.84,
      brokerAmount: 0.79,
    });
    expect(repository.distributions).toHaveLength(1);
  });
});
