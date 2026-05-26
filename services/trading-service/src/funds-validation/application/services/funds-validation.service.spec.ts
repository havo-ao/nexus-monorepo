import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TRADER_FUNDS_REPOSITORY } from '../../domain/repositories/trader-funds.repository';
import type { TraderFundsRepository } from '../../domain/repositories/trader-funds.repository';
import { FundsValidationService } from './funds-validation.service';

describe('FundsValidationService', () => {
  let service: FundsValidationService;
  let fundsRepository: jest.Mocked<TraderFundsRepository>;

  beforeEach(async () => {
    fundsRepository = {
      reserveBuyFunds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FundsValidationService,
        {
          provide: TRADER_FUNDS_REPOSITORY,
          useValue: fundsRepository,
        },
      ],
    }).compile();

    service = module.get<FundsValidationService>(FundsValidationService);
  });

  it('approves a buy when available funds cover the gross amount', async () => {
    fundsRepository.reserveBuyFunds.mockResolvedValue({
      approved: true,
      traderId: 'trader-1',
      availableAmount: 1000,
      requiredAmount: 750,
      reservedAmount: 750,
    });

    const result = await service.validateBuyFunds('trader-1', 750);

    expect(result).toEqual({
      approved: true,
      traderId: 'trader-1',
      availableAmount: 1000,
      requiredAmount: 750,
      reservedAmount: 750,
      reason: undefined,
    });
    expect(fundsRepository.reserveBuyFunds.mock.calls).toEqual([
      ['trader-1', 750],
    ]);
  });

  it('rejects a buy when available funds are insufficient', async () => {
    fundsRepository.reserveBuyFunds.mockResolvedValue({
      approved: false,
      traderId: 'trader-2',
      availableAmount: 499.99,
      requiredAmount: 500,
      reservedAmount: 25,
      reason: 'Insufficient available funds',
    });

    const result = await service.validateBuyFunds('trader-2', 500);

    expect(result).toEqual({
      approved: false,
      traderId: 'trader-2',
      availableAmount: 499.99,
      requiredAmount: 500,
      reservedAmount: 25,
      reason: 'Insufficient available funds',
    });
  });

  it('rounds money amounts to two decimal places before comparing', async () => {
    fundsRepository.reserveBuyFunds.mockResolvedValue({
      approved: true,
      traderId: 'trader-1',
      availableAmount: 100.01,
      requiredAmount: 100,
      reservedAmount: 100,
    });

    const result = await service.validateBuyFunds('trader-1', 100.004);

    expect(result.approved).toBe(true);
    expect(result.availableAmount).toBe(100.01);
    expect(result.requiredAmount).toBe(100);
    expect(fundsRepository.reserveBuyFunds.mock.calls).toEqual([
      ['trader-1', 100],
    ]);
  });

  it('throws when trader id is missing', async () => {
    await expect(service.validateBuyFunds('', 100)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(fundsRepository.reserveBuyFunds.mock.calls).toHaveLength(0);
  });

  it('throws when gross amount is not positive', async () => {
    await expect(
      service.validateBuyFunds('trader-1', 0),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fundsRepository.reserveBuyFunds.mock.calls).toHaveLength(0);
  });
});
