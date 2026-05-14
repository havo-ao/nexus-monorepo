import { Test, TestingModule } from '@nestjs/testing';
import { MYSQL_POOL } from '../../../database/database.module';
import { MarketQuote } from '../entities/market-quote.entity';
import { MysqlQuotesRepository } from './mysql-quotes.repository';

describe('MysqlQuotesRepository', () => {
  const connection = {
    beginTransaction: jest.fn(),
    execute: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
  };

  const pool = {
    query: jest.fn(),
    execute: jest.fn(),
    getConnection: jest.fn(),
  };

  let repository: MysqlQuotesRepository;

  beforeEach(async () => {
    jest.resetAllMocks();
    pool.getConnection.mockResolvedValue(connection);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MysqlQuotesRepository,
        {
          provide: MYSQL_POOL,
          useValue: pool,
        },
      ],
    }).compile();

    repository = module.get<MysqlQuotesRepository>(MysqlQuotesRepository);
  });

  it('stores latest quote and historical snapshot in one transaction', async () => {
    const quote = MarketQuote.fromProvider({
      symbol: 'AAPL',
      price: 190,
      bid: 189.95,
      ask: 190.05,
      currency: 'USD',
      provider: 'test-provider',
      asOf: new Date('2026-05-14T14:00:00.000Z'),
    });

    await repository.saveQuotes([quote]);

    expect(connection.beginTransaction).toHaveBeenCalledTimes(1);
    expect(connection.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO market_quotes'),
      [
        'AAPL',
        190,
        189.95,
        190.05,
        0.1,
        'USD',
        'test-provider',
        expect.any(Date),
      ],
    );
    expect(connection.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO market_quote_history'),
      [
        'AAPL',
        190,
        189.95,
        190.05,
        0.1,
        'USD',
        'test-provider',
        expect.any(Date),
      ],
    );
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  it('does not open a transaction when there are no quotes to store', async () => {
    await repository.saveQuotes([]);

    expect(pool.getConnection).not.toHaveBeenCalled();
    expect(connection.beginTransaction).not.toHaveBeenCalled();
  });

  it('rolls back when quote persistence fails', async () => {
    connection.execute.mockRejectedValueOnce(new Error('database failure'));
    const quote = MarketQuote.fromProvider({
      symbol: 'AAPL',
      price: 190,
      bid: 189.95,
      ask: 190.05,
      currency: 'USD',
      provider: 'test-provider',
      asOf: new Date('2026-05-14T14:00:00.000Z'),
    });

    await expect(repository.saveQuotes([quote])).rejects.toThrow(
      'database failure',
    );

    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  it('returns null when latest quote does not exist', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    await expect(repository.findLatestBySymbol('aapl')).resolves.toBeNull();
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['AAPL']);
  });

  it('restores the latest quote from stored decimal values', async () => {
    pool.query.mockResolvedValueOnce([
      [
        {
          symbol: 'AAPL',
          price: '190.00',
          bid: '189.95',
          ask: '190.05',
          spread: '0.10',
          currency: 'USD',
          provider: 'test-provider',
          as_of: new Date('2026-05-14T14:00:00.000Z'),
        },
      ],
    ]);

    const quote = await repository.findLatestBySymbol(' aapl ');

    expect(quote?.toSnapshot()).toEqual({
      symbol: 'AAPL',
      price: 190,
      bid: 189.95,
      ask: 190.05,
      spread: 0.1,
      currency: 'USD',
      provider: 'test-provider',
      asOf: new Date('2026-05-14T14:00:00.000Z'),
    });
  });

  it('rejects stored quotes with non numeric decimal fields', async () => {
    pool.query.mockResolvedValueOnce([
      [
        {
          symbol: 'AAPL',
          price: 'not-a-number',
          bid: '189.95',
          ask: '190.05',
          spread: '0.10',
          currency: 'USD',
          provider: 'test-provider',
          as_of: new Date('2026-05-14T14:00:00.000Z'),
        },
      ],
    ]);

    await expect(repository.findLatestBySymbol('AAPL')).rejects.toThrow(
      TypeError,
    );
  });

  it('records synchronization events', async () => {
    await repository.recordSyncEvent({
      status: 'SUCCESS',
      provider: 'test-provider',
      requestedBy: 'system@nexus.local',
      symbolsCount: 1,
      updatedCount: 1,
      failedCount: 0,
      message: 'Synchronized 1 of 1 market quotes',
    });

    expect(pool.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO market_data_sync_events'),
      [
        'SUCCESS',
        'test-provider',
        'system@nexus.local',
        1,
        1,
        0,
        'Synchronized 1 of 1 market quotes',
      ],
    );
  });
});
