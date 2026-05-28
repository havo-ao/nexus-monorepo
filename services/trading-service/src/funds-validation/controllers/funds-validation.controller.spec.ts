import { Test, TestingModule } from '@nestjs/testing';
import { FundsValidationService } from '../services/funds-validation.service';
import { FundsValidationController } from './funds-validation.controller';

describe('FundsValidationController', () => {
  let controller: FundsValidationController;
  let fundsValidationService: jest.Mocked<
    Pick<FundsValidationService, 'validateBuyFunds'>
  >;

  beforeEach(async () => {
    fundsValidationService = {
      validateBuyFunds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FundsValidationController],
      providers: [
        {
          provide: FundsValidationService,
          useValue: fundsValidationService,
        },
      ],
    }).compile();

    controller = module.get<FundsValidationController>(
      FundsValidationController,
    );
  });

  it('delegates buy funds validation to the application service', async () => {
    fundsValidationService.validateBuyFunds.mockResolvedValue({
      approved: true,
      traderId: '101',
      availableAmount: 1000,
      requiredAmount: 750,
      reservedAmount: 750,
      reason: undefined,
    });

    const result = await controller.validateBuyFunds({
      traderId: '101',
      grossAmount: 750,
    });

    expect(result).toEqual({
      approved: true,
      traderId: '101',
      availableAmount: 1000,
      requiredAmount: 750,
      reservedAmount: 750,
      reason: undefined,
    });
    expect(fundsValidationService.validateBuyFunds.mock.calls).toEqual([
      ['101', 750],
    ]);
  });
});
