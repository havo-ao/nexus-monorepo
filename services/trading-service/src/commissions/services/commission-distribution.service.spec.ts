import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CommissionDistribution } from '../entities/commission-distribution.entity';
import {
  COMMISSION_DISTRIBUTION_REPOSITORY,
  type CommissionDistributionRepository,
  type SaveCommissionDistributionCommand,
} from '../repositories/commission-distribution.repository';
import { CommissionDistributionService } from './commission-distribution.service';

describe('CommissionDistributionService', () => {
  let service: CommissionDistributionService;
  let repository: jest.Mocked<CommissionDistributionRepository>;

  beforeEach(async () => {
    const saveDistribution = jest.fn(
      (command: SaveCommissionDistributionCommand) =>
        Promise.resolve(
          new CommissionDistribution(
            command.traderId,
            command.brokerId,
            command.commissionAmount,
            command.platformAmount,
            command.brokerAmount,
            command.platformShareBps,
            command.brokerShareBps,
            command.currency,
            command.distributedAt,
            command.orderReference,
          ),
        ),
    );

    repository = {
      saveDistribution,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionDistributionService,
        {
          provide: COMMISSION_DISTRIBUTION_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(CommissionDistributionService);
  });

  it('distributes commission between platform and broker', async () => {
    await expect(
      service.distribute({
        traderId: ' 101 ',
        brokerId: ' 201 ',
        commissionAmount: 2.63,
        currency: ' usd ',
      }),
    ).resolves.toMatchObject({
      traderId: '101',
      brokerId: '201',
      commissionAmount: 2.63,
      platformAmount: 1.84,
      brokerAmount: 0.79,
      platformShareBps: 7000,
      brokerShareBps: 3000,
      currency: 'USD',
    });
  });

  it('keeps cents balanced after rounding', async () => {
    await expect(
      service.distribute({
        traderId: '101',
        brokerId: '201',
        commissionAmount: 1,
      }),
    ).resolves.toMatchObject({
      platformAmount: 0.7,
      brokerAmount: 0.3,
    });
  });

  it('rejects invalid distribution input', () => {
    expect(() =>
      service.distribute({
        traderId: '',
        brokerId: '201',
        commissionAmount: 1,
      }),
    ).toThrow(BadRequestException);

    expect(() =>
      service.distribute({
        traderId: '101',
        brokerId: '',
        commissionAmount: 1,
      }),
    ).toThrow(BadRequestException);

    expect(() =>
      service.distribute({
        traderId: '101',
        brokerId: '201',
        commissionAmount: 0,
      }),
    ).toThrow(BadRequestException);

    expect(repository.saveDistribution.mock.calls).toHaveLength(0);
  });
});
