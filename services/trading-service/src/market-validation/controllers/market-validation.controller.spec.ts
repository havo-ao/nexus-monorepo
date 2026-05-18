import { Test, TestingModule } from '@nestjs/testing';
import { MarketValidationService } from '../services/market-validation.service';
import { MarketValidationController } from './market-validation.controller';

describe('MarketValidationController', () => {
  let controller: MarketValidationController;
  let marketValidationService: jest.Mocked<
    Pick<MarketValidationService, 'validateMarketStatus'>
  >;

  beforeEach(async () => {
    marketValidationService = {
      validateMarketStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketValidationController],
      providers: [
        {
          provide: MarketValidationService,
          useValue: marketValidationService,
        },
      ],
    }).compile();

    controller = module.get<MarketValidationController>(
      MarketValidationController,
    );
  });

  it('delegates market status validation to the application service', async () => {
    marketValidationService.validateMarketStatus.mockResolvedValue({
      canOperate: true,
      exchangeId: '1',
      marketStatus: 'OPEN',
      evaluatedAt: '2026-05-12T14:30:00.000Z',
      timezone: 'America/New_York',
      openTime: '09:30:00',
      closeTime: '16:00:00',
      reason: undefined,
    });

    const result = await controller.validateMarketStatus({
      exchangeId: '1',
      evaluatedAt: '2026-05-12T14:30:00.000Z',
    });

    expect(result).toEqual({
      canOperate: true,
      exchangeId: '1',
      marketStatus: 'OPEN',
      evaluatedAt: '2026-05-12T14:30:00.000Z',
      timezone: 'America/New_York',
      openTime: '09:30:00',
      closeTime: '16:00:00',
      reason: undefined,
    });
    expect(marketValidationService.validateMarketStatus.mock.calls).toEqual([
      ['1', '2026-05-12T14:30:00.000Z'],
    ]);
  });
});
