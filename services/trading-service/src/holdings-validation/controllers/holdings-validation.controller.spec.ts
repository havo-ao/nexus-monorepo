import { Test, TestingModule } from '@nestjs/testing';
import { HoldingsValidation } from '../entities/holdings-validation.entity';
import { HoldingsValidationService } from '../services/holdings-validation.service';
import { HoldingsValidationController } from './holdings-validation.controller';

describe('HoldingsValidationController', () => {
  let controller: HoldingsValidationController;
  let service: jest.Mocked<HoldingsValidationService>;

  beforeEach(async () => {
    service = {
      validateSellHoldings: jest.fn(),
    } as unknown as jest.Mocked<HoldingsValidationService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HoldingsValidationController],
      providers: [
        {
          provide: HoldingsValidationService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get(HoldingsValidationController);
  });

  it('delegates sell holdings validation to the service', async () => {
    const validation = new HoldingsValidation(true, '101', '1', 3, 10, 'AAPL');
    service.validateSellHoldings.mockResolvedValue(validation);

    await expect(
      controller.validateSellHoldings({
        traderId: '101',
        stockId: '1',
        symbol: 'AAPL',
        quantity: 3,
      }),
    ).resolves.toBe(validation);

    expect(service.validateSellHoldings.mock.calls[0][0]).toEqual({
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      quantity: 3,
    });
  });
});
