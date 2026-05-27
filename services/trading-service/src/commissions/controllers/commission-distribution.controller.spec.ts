import { Test, TestingModule } from '@nestjs/testing';
import { CommissionDistribution } from '../entities/commission-distribution.entity';
import { CommissionDistributionService } from '../services/commission-distribution.service';
import { CommissionDistributionController } from './commission-distribution.controller';

describe('CommissionDistributionController', () => {
  let controller: CommissionDistributionController;
  let service: jest.Mocked<Pick<CommissionDistributionService, 'distribute'>>;

  beforeEach(async () => {
    service = {
      distribute: jest
        .fn()
        .mockResolvedValue(
          new CommissionDistribution(
            '101',
            '201',
            2.63,
            1.84,
            0.79,
            7000,
            3000,
            'USD',
            '2026-05-26T14:30:00.000Z',
          ),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommissionDistributionController],
      providers: [
        {
          provide: CommissionDistributionService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get(CommissionDistributionController);
  });

  it('delegates commission distribution to the service', async () => {
    await expect(
      controller.distribute({
        traderId: '101',
        brokerId: '201',
        commissionAmount: 2.63,
      }),
    ).resolves.toMatchObject({
      traderId: '101',
      brokerId: '201',
      platformAmount: 1.84,
      brokerAmount: 0.79,
    });
    expect(service.distribute).toHaveBeenCalledWith({
      traderId: '101',
      brokerId: '201',
      commissionAmount: 2.63,
    });
  });
});
