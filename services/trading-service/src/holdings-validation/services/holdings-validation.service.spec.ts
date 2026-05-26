import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TRADER_HOLDINGS_REPOSITORY } from '../repositories/trader-holdings.repository';
import type { TraderHoldingsRepository } from '../repositories/trader-holdings.repository';
import { HoldingsValidationService } from './holdings-validation.service';

describe('HoldingsValidationService', () => {
  let service: HoldingsValidationService;
  let repository: jest.Mocked<TraderHoldingsRepository>;

  beforeEach(async () => {
    repository = {
      validateSellHoldings: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HoldingsValidationService,
        {
          provide: TRADER_HOLDINGS_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(HoldingsValidationService);
  });

  it('approves a sell when available holdings cover the requested quantity', async () => {
    repository.validateSellHoldings.mockResolvedValue({
      approved: true,
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      requestedQuantity: 3,
      availableQuantity: 10,
    });

    const result = await service.validateSellHoldings({
      traderId: ' 101 ',
      stockId: ' 1 ',
      symbol: ' aapl ',
      quantity: 3,
    });

    expect(result).toMatchObject({
      approved: true,
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      requestedQuantity: 3,
      availableQuantity: 10,
    });
    expect(repository.validateSellHoldings.mock.calls[0][0]).toEqual({
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      quantity: 3,
    });
  });

  it('rejects a sell when holdings are insufficient', async () => {
    repository.validateSellHoldings.mockResolvedValue({
      approved: false,
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      requestedQuantity: 12,
      availableQuantity: 10,
      reason: 'Insufficient available holdings',
    });

    const result = await service.validateSellHoldings({
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      quantity: 12,
    });

    expect(result).toMatchObject({
      approved: false,
      reason: 'Insufficient available holdings',
      requestedQuantity: 12,
      availableQuantity: 10,
    });
  });

  it('validates required input before calling the repository', async () => {
    await expect(
      service.validateSellHoldings({
        traderId: '',
        stockId: '1',
        quantity: 1,
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.validateSellHoldings({
        traderId: '101',
        stockId: '',
        quantity: 1,
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.validateSellHoldings({
        traderId: '101',
        stockId: '1',
        quantity: 0,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(repository.validateSellHoldings.mock.calls).toHaveLength(0);
  });
});
