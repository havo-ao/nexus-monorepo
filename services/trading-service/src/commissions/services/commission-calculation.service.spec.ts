import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  COMMISSION_CALCULATION_REPOSITORY,
  type CommissionCalculationRepository,
  type SaveCommissionCalculationCommand,
} from '../repositories/commission-calculation.repository';
import { CommissionCalculation } from '../entities/commission-calculation.entity';
import { CommissionCalculationService } from './commission-calculation.service';

describe('CommissionCalculationService', () => {
  let service: CommissionCalculationService;
  let repository: jest.Mocked<CommissionCalculationRepository>;

  beforeEach(async () => {
    const saveCalculation = jest.fn(
      (command: SaveCommissionCalculationCommand) =>
        Promise.resolve(
          new CommissionCalculation(
            command.traderId,
            command.side,
            command.orderType,
            command.grossAmount,
            command.rateBps,
            command.commissionAmount,
            command.netAmount,
            command.currency,
            command.calculatedAt,
            command.orderReference,
          ),
        ),
    );

    repository = {
      saveCalculation,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionCalculationService,
        {
          provide: COMMISSION_CALCULATION_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(CommissionCalculationService);
  });

  it('calculates buy commission and net amount', async () => {
    await expect(
      service.calculate({
        traderId: ' 101 ',
        side: 'BUY',
        orderType: 'MARKET',
        grossAmount: 750,
        currency: ' usd ',
      }),
    ).resolves.toMatchObject({
      traderId: '101',
      side: 'BUY',
      orderType: 'MARKET',
      grossAmount: 750,
      rateBps: 35,
      commissionAmount: 2.63,
      netAmount: 752.63,
      currency: 'USD',
    });
  });

  it('applies minimum commission for small operations', async () => {
    await expect(
      service.calculate({
        traderId: '101',
        side: 'SELL',
        orderType: 'LIMIT',
        grossAmount: 100,
      }),
    ).resolves.toMatchObject({
      commissionAmount: 1,
      netAmount: 99,
    });
  });

  it('rejects invalid calculation input', () => {
    expect(() =>
      service.calculate({
        traderId: '',
        side: 'BUY',
        orderType: 'MARKET',
        grossAmount: 100,
      }),
    ).toThrow(BadRequestException);

    expect(() =>
      service.calculate({
        traderId: '101',
        side: 'BUY',
        orderType: 'MARKET',
        grossAmount: 0,
      }),
    ).toThrow(BadRequestException);

    expect(repository.saveCalculation.mock.calls).toHaveLength(0);
  });
});
