import { Test, TestingModule } from '@nestjs/testing';
import { CommissionCalculation } from '../entities/commission-calculation.entity';
import { CommissionCalculationService } from '../services/commission-calculation.service';
import { CommissionCalculationController } from './commission-calculation.controller';

describe('CommissionCalculationController', () => {
  let controller: CommissionCalculationController;
  let service: jest.Mocked<CommissionCalculationService>;

  beforeEach(async () => {
    service = {
      calculate: jest.fn(),
    } as unknown as jest.Mocked<CommissionCalculationService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommissionCalculationController],
      providers: [
        {
          provide: CommissionCalculationService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get(CommissionCalculationController);
  });

  it('delegates commission calculation to the service', async () => {
    const calculation = new CommissionCalculation(
      '101',
      'BUY',
      'MARKET',
      750,
      35,
      2.63,
      752.63,
      'USD',
      '2026-05-26T14:30:00.000Z',
    );
    service.calculate.mockResolvedValue(calculation);

    await expect(
      controller.calculate({
        traderId: '101',
        side: 'BUY',
        orderType: 'MARKET',
        grossAmount: 750,
      }),
    ).resolves.toBe(calculation);

    expect(service.calculate.mock.calls[0][0]).toEqual({
      traderId: '101',
      side: 'BUY',
      orderType: 'MARKET',
      grossAmount: 750,
    });
  });
});
