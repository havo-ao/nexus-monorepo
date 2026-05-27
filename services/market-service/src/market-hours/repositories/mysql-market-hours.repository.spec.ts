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
    jest.resetAllMocks();
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

  it('returns null when market-hours configuration is not stored', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    await expect(repository.findByMarketCode('bvc')).resolves.toBeNull();
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['BVC']);
  });

  it('accepts operating days already parsed as an array by the driver', async () => {
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
            operating_days: [1, 2, 3, 4, 5],
          },
        ],
      ])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]]);

    const marketHours = await repository.findByMarketCode('BVC');

    expect(marketHours?.toSnapshot().operatingDays).toEqual([1, 2, 3, 4, 5]);
  });

  it('rejects malformed stored operating days JSON', async () => {
    pool.query.mockResolvedValueOnce([
      [
        {
          market_code: 'BVC',
          timezone: 'America/Bogota',
          open_hour: 9,
          open_minute: 0,
          close_hour: 15,
          close_minute: 0,
          operating_days: '{invalid-json',
        },
      ],
    ]);

    await expect(repository.findByMarketCode('BVC')).rejects.toThrow();
  });

  it('rejects stored operating days that are not arrays', async () => {
    pool.query.mockResolvedValueOnce([
      [
        {
          market_code: 'BVC',
          timezone: 'America/Bogota',
          open_hour: 9,
          open_minute: 0,
          close_hour: 15,
          close_minute: 0,
          operating_days: '{"monday": true}',
        },
      ],
    ]);

    await expect(repository.findByMarketCode('BVC')).rejects.toThrow();
  });

  it('rejects stored operating days with non integer values', async () => {
    pool.query.mockResolvedValueOnce([
      [
        {
          market_code: 'BVC',
          timezone: 'America/Bogota',
          open_hour: 9,
          open_minute: 0,
          close_hour: 15,
          close_minute: 0,
          operating_days: '[1,"2",3]',
        },
      ],
    ]);

    await expect(repository.findByMarketCode('BVC')).rejects.toThrow();
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
      ])
      .mockResolvedValueOnce([
        [
          {
            day_of_week: 6,
            is_open: 1,
            open_hour: 10,
            open_minute: 0,
            close_hour: 13,
            close_minute: 0,
          },
        ],
      ]);

    const marketHours = await repository.findByMarketCode('bvc');
    const snapshot = marketHours?.toSnapshot();

    expect(snapshot).toEqual(
      expect.objectContaining({
        marketCode: 'BVC',
        timezone: 'America/Bogota',
        openTime: { hour: 9, minute: 0 },
        closeTime: { hour: 15, minute: 0 },
        operatingDays: [1, 2, 3, 4, 5, 6],
        restrictions: [
          {
            date: '2026-06-19',
            status: 'CLOSED',
            reason: 'Holiday',
          },
        ],
      }),
    );
    expect(snapshot?.weeklySchedule).toEqual(
      expect.arrayContaining([
        {
          dayOfWeek: 6,
          isOpen: true,
          openTime: { hour: 10, minute: 0 },
          closeTime: { hour: 13, minute: 0 },
        },
      ]),
    );
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
      expect.stringContaining('INSERT INTO market_weekly_schedules'),
      ['BVC', 1, true, 9, 0, 15, 0],
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
