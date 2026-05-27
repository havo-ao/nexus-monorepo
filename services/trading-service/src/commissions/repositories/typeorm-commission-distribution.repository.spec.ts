import { DataSource, Repository } from 'typeorm';
import { CommissionDistributionEvent } from '../entities/commission-distribution-event.entity';
import { TypeOrmCommissionDistributionRepository } from './typeorm-commission-distribution.repository';

describe('TypeOrmCommissionDistributionRepository', () => {
  let dataSource: jest.Mocked<DataSource>;
  let eventRepository: jest.Mocked<Repository<CommissionDistributionEvent>>;

  beforeEach(() => {
    eventRepository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<CommissionDistributionEvent>>;

    dataSource = {
      getRepository: jest.fn().mockReturnValue(eventRepository),
    } as unknown as jest.Mocked<DataSource>;
  });

  it('persists a commission distribution event', async () => {
    const repository = new TypeOrmCommissionDistributionRepository(dataSource);
    eventRepository.save.mockImplementation((event) => {
      event.createdAt = new Date('2026-05-26T14:30:00.000Z');
      return Promise.resolve(event);
    });

    await expect(
      repository.saveDistribution({
        traderId: '101',
        brokerId: '201',
        orderReference: 'order-reference',
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
      orderReference: 'order-reference',
      commissionAmount: 2.63,
      platformAmount: 1.84,
      brokerAmount: 0.79,
      platformShareBps: 7000,
      brokerShareBps: 3000,
      currency: 'USD',
      distributedAt: '2026-05-26T14:30:00.000Z',
    });
    expect(eventRepository.save.mock.calls[0][0]).toMatchObject({
      traderId: '101',
      brokerId: '201',
      commissionAmount: '2.63',
      platformAmount: '1.84',
      brokerAmount: '0.79',
    });
  });
});
