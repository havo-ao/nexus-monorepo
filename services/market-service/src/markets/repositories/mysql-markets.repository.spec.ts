import { Test, TestingModule } from '@nestjs/testing';
import { MYSQL_POOL } from '../../../database/database.module';
import { MysqlMarketsRepository } from './mysql-markets.repository';

describe('MysqlMarketsRepository', () => {
  const pool = {
    query: jest.fn(),
  };

  let repository: MysqlMarketsRepository;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MysqlMarketsRepository,
        {
          provide: MYSQL_POOL,
          useValue: pool,
        },
      ],
    }).compile();

    repository = module.get<MysqlMarketsRepository>(MysqlMarketsRepository);
  });

  it('restores active markets with their normalized representative symbols', async () => {
    pool.query
      .mockResolvedValueOnce([
        [
          {
            code: 'NYSE',
            name: 'New York Stock Exchange',
            country: 'United States',
            currency: 'USD',
            timezone: 'America/New_York',
            status: 'ACTIVE',
          },
        ],
      ])
      .mockResolvedValueOnce([
        [
          { market_code: 'NYSE', symbol: 'JPM' },
          { market_code: 'NYSE', symbol: 'AAPL' },
          { market_code: 'NYSE', symbol: 'KO' },
          { market_code: 'NYSE', symbol: 'MSFT' },
          { market_code: 'NYSE', symbol: 'NVDA' },
          { market_code: 'NYSE', symbol: 'TSLA' },
        ],
      ]);

    const markets = await repository.findAvailable();

    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('EXISTS'),
    );
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('market_instruments'),
    );
    expect(markets.map((market) => market.toSnapshot())).toEqual([
      {
        code: 'NYSE',
        name: 'New York Stock Exchange',
        country: 'United States',
        currency: 'USD',
        timezone: 'America/New_York',
        status: 'ACTIVE',
        representativeSymbols: ['AAPL', 'JPM', 'KO', 'MSFT', 'NVDA'],
      },
    ]);
  });

  it('returns no markets when a market has no synchronized supported symbols', async () => {
    pool.query
      .mockResolvedValueOnce([
        [
          {
            code: 'BVC',
            name: 'Bolsa de Valores de Colombia',
            country: 'Colombia',
            currency: 'COP',
            timezone: 'America/Bogota',
            status: 'ACTIVE',
          },
        ],
      ])
      .mockResolvedValueOnce([[]]);

    const markets = await repository.findAvailable();

    expect(markets).toEqual([]);
  });

  it('ignores active markets that only have symbols outside the curated catalog', async () => {
    pool.query
      .mockResolvedValueOnce([
        [
          {
            code: 'NYSE',
            name: 'New York Stock Exchange',
            country: 'United States',
            currency: 'USD',
            timezone: 'America/New_York',
            status: 'ACTIVE',
          },
        ],
      ])
      .mockResolvedValueOnce([[{ market_code: 'NYSE', symbol: 'ABXL' }]]);

    await expect(repository.findAvailable()).resolves.toEqual([]);
  });
});
