import { Test, TestingModule } from '@nestjs/testing';
import { Market } from '../entities/market.entity';
import { MARKETS_REPOSITORY } from '../repositories/markets.repository';
import type { MarketsRepository } from '../repositories/markets.repository';
import { MarketsService } from './markets.service';

describe('MarketsService', () => {
  const repository: jest.Mocked<MarketsRepository> = {
    findAvailable: jest.fn(),
  };

  let service: MarketsService;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketsService,
        {
          provide: MARKETS_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<MarketsService>(MarketsService);
  });

  it('returns available markets as API response DTOs', async () => {
    repository.findAvailable.mockResolvedValue([
      Market.restore({
        code: 'NYSE',
        name: 'New York Stock Exchange',
        country: 'United States',
        currency: 'USD',
        timezone: 'America/New_York',
        status: 'ACTIVE',
        representativeSymbols: ['AAPL', 'JPM', 'KO'],
      }),
    ]);

    await expect(service.getAvailableMarkets()).resolves.toEqual([
      {
        code: 'NYSE',
        name: 'New York Stock Exchange',
        country: 'United States',
        currency: 'USD',
        timezone: 'America/New_York',
        status: 'ACTIVE',
        representativeSymbols: ['AAPL', 'JPM', 'KO'],
      },
    ]);
  });
});
