import { Test, TestingModule } from '@nestjs/testing';
import { MYSQL_POOL } from '../../../database/database.module';
import { MarketHours } from '../entities/market-hours.entity';
import { MysqlMarketHoursRepository } from './mysql-market-hours.repository';

describe('MysqlMarketHoursRepository', () => {
  const connection = {
    beginTransaction: jest.fn(),
    execute: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
  };

  const pool = {
    query: jest.fn(),
    getConnection: jest.fn(),
  };

  let repository: MysqlMarketHoursRepository;

  beforeEach(async () => {
    jest.clearAllMocks();
    pool.getConnection.mockResolvedValue(connection);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MysqlMarketHoursRepository,
        {
          provide: MYSQL_POOL,
          useValue: pool,
        },
      ],
    }).compile();

    repository = module.get<MysqlMarketHoursRepository>(
      MysqlMarketHoursRepository,
    );
  });

  it('restores market-hours configuration with restrictions from MySQL rows', async () => {
    pool.query
      .mockResolvedValueOnce([
        [
          {
            market_code: 'BVC',
            timezone: 'America/Bogota',
            open_hour: 9,
            open_minute: 0,
            close_hour: 15,
            close_minute: 0,
            operating_days: '[1,2,3,4,5]',
          },
        ],
      ])
      .mockResolvedValueOnce([
        [
          {
            restriction_date: '2026-06-19',
            status: 'CLOSED',
            reason: 'Holiday',
          },
        ],
      ]);

    const marketHours = await repository.findByMarketCode('bvc');

    expect(marketHours?.toSnapshot()).toEqual({
      marketCode: 'BVC',
      timezone: 'America/Bogota',
      openTime: { hour: 9, minute: 0 },
      closeTime: { hour: 15, minute: 0 },
      operatingDays: [1, 2, 3, 4, 5],
      restrictions: [
        {
          date: '2026-06-19',
          status: 'CLOSED',
          reason: 'Holiday',
        },
      ],
    });
  });

  it('saves schedule, restrictions and audit event in one transaction', async () => {
    const marketHours = MarketHours.configure('BVC', {
      timezone: 'America/Bogota',
      openTime: { hour: 9, minute: 0 },
      closeTime: { hour: 15, minute: 0 },
      operatingDays: [1, 2, 3, 4, 5],
    }).upsertRestriction({
      date: '2026-06-19',
      status: 'CLOSED',
      reason: 'Holiday',
    });

    await repository.save(marketHours, {
      marketCode: 'BVC',
      changeType: 'RESTRICTION_CONFIGURED',
      actor: 'admin@nexus.local',
      context: 'NEX-83 restriction configuration',
    });

    expect(connection.beginTransaction).toHaveBeenCalledTimes(1);
    expect(connection.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO market_hours_configs'),
      ['BVC', 'America/Bogota', 9, 0, 15, 0, JSON.stringify([1, 2, 3, 4, 5])],
    );
    expect(connection.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO market_restrictions'),
      ['BVC', '2026-06-19', 'CLOSED', 'Holiday'],
    );
    expect(connection.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO market_configuration_events'),
      [
        'BVC',
        'RESTRICTION_CONFIGURED',
        'admin@nexus.local',
        'NEX-83 restriction configuration',
      ],
    );
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  it('rolls back when persistence fails', async () => {
    connection.execute.mockRejectedValueOnce(new Error('database failure'));

    await expect(
      repository.save(
        MarketHours.configure('BVC', {
          timezone: 'America/Bogota',
          openTime: { hour: 9, minute: 0 },
          closeTime: { hour: 15, minute: 0 },
          operatingDays: [1, 2, 3, 4, 5],
        }),
        {
          marketCode: 'BVC',
          changeType: 'SCHEDULE_CONFIGURED',
          actor: 'admin@nexus.local',
          context: 'NEX-83 schedule configuration',
        },
      ),
    ).rejects.toThrow('database failure');

    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
  });
});
