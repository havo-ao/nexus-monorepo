import { DataSource, Repository } from 'typeorm';
import { CommissionCalculationEvent } from '../entities/commission-calculation-event.entity';
import { TypeOrmCommissionCalculationRepository } from './typeorm-commission-calculation.repository';

describe('TypeOrmCommissionCalculationRepository', () => {
  let dataSource: jest.Mocked<DataSource>;
  let eventRepository: jest.Mocked<Repository<CommissionCalculationEvent>>;

  beforeEach(() => {
    eventRepository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<CommissionCalculationEvent>>;

    dataSource = {
      getRepository: jest.fn().mockReturnValue(eventRepository),
    } as unknown as jest.Mocked<DataSource>;
  });

  it('persists a commission calculation event', async () => {
    const repository = new TypeOrmCommissionCalculationRepository(dataSource);
    eventRepository.save.mockImplementation((event) => {
      event.createdAt = new Date('2026-05-26T14:30:00.000Z');
      return Promise.resolve(event);
    });

    await expect(
      repository.saveCalculation({
        traderId: '101',
        orderReference: 'order-reference',
        side: 'BUY',
        orderType: 'MARKET',
        grossAmount: 750,
        rateBps: 35,
        commissionAmount: 2.63,
        netAmount: 752.63,
        currency: 'USD',
        calculatedAt: '2026-05-26T14:30:00.000Z',
      }),
    ).resolves.toMatchObject({
      traderId: '101',
      orderReference: 'order-reference',
      side: 'BUY',
      orderType: 'MARKET',
      grossAmount: 750,
      rateBps: 35,
      commissionAmount: 2.63,
      netAmount: 752.63,
      currency: 'USD',
      calculatedAt: '2026-05-26T14:30:00.000Z',
    });
    expect(eventRepository.save.mock.calls[0][0]).toMatchObject({
      traderId: '101',
      grossAmount: '750.00',
      commissionAmount: '2.63',
      netAmount: '752.63',
    });
  });
});
