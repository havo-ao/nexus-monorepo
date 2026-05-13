import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MARKET_STATUS_REPOSITORY } from '../repositories/market-status.repository';
import type { MarketStatusRepository } from '../repositories/market-status.repository';
import { MarketValidationService } from './market-validation.service';

describe('MarketValidationService', () => {
  let service: MarketValidationService;
  let marketStatusRepository: jest.Mocked<MarketStatusRepository>;

  beforeEach(async () => {
    marketStatusRepository = {
      validateMarketStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketValidationService,
        {
          provide: MARKET_STATUS_REPOSITORY,
          useValue: marketStatusRepository,
        },
      ],
    }).compile();

    service = module.get<MarketValidationService>(MarketValidationService);
  });

  it('returns the market validation result from the repository', async () => {
    marketStatusRepository.validateMarketStatus.mockResolvedValue({
      canOperate: true,
      exchangeId: '1',
      marketStatus: 'OPEN',
      evaluatedAt: new Date('2026-05-12T14:30:00.000Z'),
      timezone: 'America/New_York',
      openTime: '09:30:00',
      closeTime: '16:00:00',
    });

    const result = await service.validateMarketStatus(
      '1',
      '2026-05-12T14:30:00.000Z',
    );

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
    expect(marketStatusRepository.validateMarketStatus.mock.calls[0]).toEqual([
      '1',
      new Date('2026-05-12T14:30:00.000Z'),
    ]);
  });

  it('throws when exchange id is missing', async () => {
    await expect(service.validateMarketStatus('')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(marketStatusRepository.validateMarketStatus.mock.calls).toHaveLength(
      0,
    );
  });

  it('throws when evaluatedAt is not a valid timestamp', async () => {
    await expect(
      service.validateMarketStatus('1', 'not-a-date'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(marketStatusRepository.validateMarketStatus.mock.calls).toHaveLength(
      0,
    );
  });
});
