import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MarketHours } from '../entities/market-hours.entity';
import { MARKET_HOURS_REPOSITORY } from '../repositories/market-hours.repository';
import { MarketHoursService } from './market-hours.service';

describe('MarketHoursService', () => {
  let service: MarketHoursService;

  const market = MarketHours.restore({
    marketCode: 'NYSE',
    timezone: 'America/New_York',
    openTime: { hour: 9, minute: 30 },
    closeTime: { hour: 16, minute: 0 },
    operatingDays: [1, 2, 3, 4, 5],
    restrictions: [
      {
        date: '2026-05-25',
        status: 'CLOSED',
        reason: 'Memorial Day market holiday',
      },
    ],
  });

  const repository = {
    findByMarketCode: jest.fn(),
  };

  beforeEach(async () => {
    repository.findByMarketCode.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketHoursService,
        {
          provide: MARKET_HOURS_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<MarketHoursService>(MarketHoursService);
  });

  it('allows processing when the market is open', async () => {
    repository.findByMarketCode.mockResolvedValue(market);

    const response = await service.getMarketStatus(
      'nyse',
      new Date('2026-05-11T14:00:00.000Z'),
    );

    expect(response).toEqual({
      marketCode: 'NYSE',
      status: 'OPEN',
      canProcessOrder: true,
      evaluatedAt: '2026-05-11T14:00:00.000Z',
      timezone: 'America/New_York',
      reason: 'Market is open for trading',
    });
  });

  it('uses the current server time when evaluation date is omitted', async () => {
    repository.findByMarketCode.mockResolvedValue(market);

    const response = await service.getMarketStatus('NYSE');

    expect(response.marketCode).toBe('NYSE');
    expect(response.evaluatedAt).toEqual(expect.any(String));
  });

  it('blocks processing outside trading hours', async () => {
    repository.findByMarketCode.mockResolvedValue(market);

    const response = await service.getMarketStatus(
      'NYSE',
      new Date('2026-05-11T21:00:00.000Z'),
    );

    expect(response.status).toBe('CLOSED');
    expect(response.canProcessOrder).toBe(false);
    expect(response.reason).toBe('Market is outside trading hours');
  });

  it('blocks processing on configured market holidays', async () => {
    repository.findByMarketCode.mockResolvedValue(market);

    const response = await service.getMarketStatus(
      'NYSE',
      new Date('2026-05-25T14:00:00.000Z'),
    );

    expect(response.status).toBe('CLOSED');
    expect(response.canProcessOrder).toBe(false);
    expect(response.reason).toBe('Memorial Day market holiday');
  });

  it('throws when the market is not configured', async () => {
    repository.findByMarketCode.mockResolvedValue(null);

    await expect(
      service.getMarketStatus('BVC', new Date('2026-05-11T14:00:00.000Z')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
