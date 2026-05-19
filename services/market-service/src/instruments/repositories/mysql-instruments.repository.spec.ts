import { Test, TestingModule } from '@nestjs/testing';
import { MYSQL_POOL } from '../../../database/database.module';
import { Instrument } from '../entities/instrument.entity';
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

  it('upserts synchronized instruments', async () => {
    const instrument = Instrument.restore({
      symbol: 'nvda',
      name: 'NVIDIA Corporation',
      marketCode: 'nasdaq',
      currency: 'usd',
      sector: 'Unclassified',
      status: 'ACTIVE',
    });

    await repository.saveInstruments([instrument]);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('ON DUPLICATE KEY UPDATE'),
      ['NVDA', 'NVIDIA Corporation', 'NASDAQ', 'USD', 'Unclassified', 'ACTIVE'],
    );
  });

  it('does not persist when synchronized catalog is empty', async () => {
    await repository.saveInstruments([]);

    expect(pool.query).not.toHaveBeenCalled();
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

  it('finds an active instrument by symbol', async () => {
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

    const instrument = await repository.findBySymbol(' aapl ');

    expect(instrument?.toSnapshot()).toEqual({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      marketCode: 'NASDAQ',
      currency: 'USD',
      sector: 'Technology',
      status: 'ACTIVE',
    });
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['AAPL']);
  });

  it('returns null when an instrument is not stored', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    await expect(repository.findBySymbol('ZZZZ')).resolves.toBeNull();
  });
});
