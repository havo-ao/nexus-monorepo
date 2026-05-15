import { Test, TestingModule } from '@nestjs/testing';
import { MYSQL_POOL } from '../../../database/database.module';
import { MysqlInstrumentsRepository } from './mysql-instruments.repository';

describe('MysqlInstrumentsRepository', () => {
  const pool = {
    query: jest.fn(),
  };

  let repository: MysqlInstrumentsRepository;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MysqlInstrumentsRepository,
        {
          provide: MYSQL_POOL,
          useValue: pool,
        },
      ],
    }).compile();

    repository = module.get<MysqlInstrumentsRepository>(
      MysqlInstrumentsRepository,
    );
  });

  it('restores active instruments from stored metadata', async () => {
    pool.query.mockResolvedValueOnce([
      [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          market_code: 'NASDAQ',
          currency: 'USD',
          sector: 'Technology',
          status: 'ACTIVE',
        },
      ],
    ]);

    const instruments = await repository.findAvailable();

    expect(instruments.map((instrument) => instrument.toSnapshot())).toEqual([
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
        status: 'ACTIVE',
      },
    ]);
  });

  it('rejects invalid stored metadata through the domain entity', async () => {
    pool.query.mockResolvedValueOnce([
      [
        {
          symbol: '',
          name: 'Apple Inc.',
          market_code: 'NASDAQ',
          currency: 'USD',
          sector: 'Technology',
          status: 'ACTIVE',
        },
      ],
    ]);

    await expect(repository.findAvailable()).rejects.toThrow(TypeError);
  });
});
