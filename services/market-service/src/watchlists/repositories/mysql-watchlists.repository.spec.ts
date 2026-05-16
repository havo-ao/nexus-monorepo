import { Test, TestingModule } from '@nestjs/testing';
import { MYSQL_POOL } from '../../../database/database.module';
import { WatchlistItem } from '../entities/watchlist-item.entity';
import { MysqlWatchlistsRepository } from './mysql-watchlists.repository';

describe('MysqlWatchlistsRepository', () => {
  const pool = {
    query: jest.fn(),
    execute: jest.fn(),
  };

  let repository: MysqlWatchlistsRepository;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MysqlWatchlistsRepository,
        {
          provide: MYSQL_POOL,
          useValue: pool,
        },
      ],
    }).compile();

    repository = module.get<MysqlWatchlistsRepository>(
      MysqlWatchlistsRepository,
    );
  });

  it('restores watchlist items for a trader', async () => {
    pool.query.mockResolvedValueOnce([
      [
        {
          trader_id: 'trader-123',
          symbol: 'AAPL',
          created_at: new Date('2026-05-16T14:00:00.000Z'),
        },
      ],
    ]);

    const items = await repository.findByTraderId('trader-123');

    expect(items.map((item) => item.toSnapshot())).toEqual([
      {
        traderId: 'trader-123',
        symbol: 'AAPL',
        addedAt: new Date('2026-05-16T14:00:00.000Z'),
      },
    ]);
  });

  it('persists watchlist items idempotently', async () => {
    await repository.addItem(
      WatchlistItem.create({
        traderId: 'trader-123',
        symbol: 'aapl',
        addedAt: new Date('2026-05-16T14:00:00.000Z'),
      }),
    );

    expect(pool.execute).toHaveBeenCalledWith(expect.any(String), [
      'trader-123',
      'AAPL',
      new Date('2026-05-16T14:00:00.000Z'),
    ]);
  });

  it('removes a symbol from a trader watchlist', async () => {
    await repository.removeItem(' trader-123 ', ' aapl ');

    expect(pool.execute).toHaveBeenCalledWith(expect.any(String), [
      'trader-123',
      'AAPL',
    ]);
  });
});
