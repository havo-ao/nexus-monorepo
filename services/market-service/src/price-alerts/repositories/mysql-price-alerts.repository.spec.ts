import { Test, TestingModule } from '@nestjs/testing';
import { MYSQL_POOL } from '../../../database/database.module';
import { PriceAlert } from '../entities/price-alert.entity';
import { PriceAlertEvent } from '../entities/price-alert-event.entity';
import { MysqlPriceAlertsRepository } from './mysql-price-alerts.repository';

describe('MysqlPriceAlertsRepository', () => {
  const pool = {
    query: jest.fn(),
    execute: jest.fn(),
  };

  let repository: MysqlPriceAlertsRepository;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MysqlPriceAlertsRepository,
        {
          provide: MYSQL_POOL,
          useValue: pool,
        },
      ],
    }).compile();

    repository = module.get<MysqlPriceAlertsRepository>(
      MysqlPriceAlertsRepository,
    );
  });

  it('persists a price alert and returns the generated id', async () => {
    pool.execute.mockResolvedValueOnce([{ insertId: 7 }]);

    const alert = await repository.saveAlert(
      PriceAlert.create({
        traderId: 'trader-123',
        symbol: 'aapl',
        targetPrice: 190,
        condition: 'ABOVE_OR_EQUAL',
      }),
    );

    expect(alert.toSnapshot()).toMatchObject({
      id: 7,
      traderId: 'trader-123',
      symbol: 'AAPL',
      targetPrice: 190,
    });
    expect(pool.execute).toHaveBeenCalledWith(expect.any(String), [
      'trader-123',
      'AAPL',
      190,
      'ABOVE_OR_EQUAL',
      'ACTIVE',
      expect.any(Date),
      null,
    ]);
  });

  it('restores alerts by trader', async () => {
    pool.query.mockResolvedValueOnce([
      [
        {
          id: 1,
          trader_id: 'trader-123',
          symbol: 'AAPL',
          target_price: '190.000000',
          condition_type: 'ABOVE_OR_EQUAL',
          status: 'ACTIVE',
          created_at: new Date('2026-05-16T12:00:00.000Z'),
          triggered_at: new Date('2026-05-16T13:00:00.000Z'),
        },
      ],
    ]);

    const alerts = await repository.findByTraderId('trader-123');

    expect(alerts.map((alert) => alert.toSnapshot())).toEqual([
      expect.objectContaining({
        id: 1,
        traderId: 'trader-123',
        symbol: 'AAPL',
        targetPrice: 190,
        triggeredAt: new Date('2026-05-16T13:00:00.000Z'),
      }),
    ]);
  });

  it('finds active alerts and records triggered events', async () => {
    pool.query.mockResolvedValueOnce([
      [
        {
          id: 1,
          trader_id: 'trader-123',
          symbol: 'AAPL',
          target_price: '190.000000',
          condition_type: 'ABOVE_OR_EQUAL',
          status: 'ACTIVE',
          created_at: new Date('2026-05-16T12:00:00.000Z'),
          triggered_at: null,
        },
      ],
    ]);

    const [alert] = await repository.findActiveAlerts();
    const triggeredAlert = alert.markTriggered(
      new Date('2026-05-16T13:00:00.000Z'),
    );
    await repository.markTriggered(triggeredAlert);
    await repository.recordEvent(
      PriceAlertEvent.create({
        alertId: 1,
        traderId: 'trader-123',
        symbol: 'AAPL',
        targetPrice: 190,
        marketPrice: 191,
        condition: 'ABOVE_OR_EQUAL',
        occurredAt: new Date('2026-05-16T13:00:00.000Z'),
      }),
    );

    expect(pool.execute).toHaveBeenCalledWith(expect.any(String), [
      'TRIGGERED',
      new Date('2026-05-16T13:00:00.000Z'),
      1,
    ]);
    expect(pool.execute).toHaveBeenCalledWith(expect.any(String), [
      1,
      'trader-123',
      'AAPL',
      190,
      191,
      'ABOVE_OR_EQUAL',
      new Date('2026-05-16T13:00:00.000Z'),
    ]);
  });
});
