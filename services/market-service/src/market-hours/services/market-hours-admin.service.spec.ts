import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MarketHours } from '../entities/market-hours.entity';
import { MARKET_HOURS_REPOSITORY } from '../repositories/market-hours.repository';
import { MarketHoursAdminService } from './market-hours-admin.service';

describe('MarketHoursAdminService', () => {
  let service: MarketHoursAdminService;

  const repository = {
    findByMarketCode: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    repository.findByMarketCode.mockReset();
    repository.save.mockReset();

    repository.save.mockImplementation((marketHours: MarketHours) =>
      Promise.resolve(marketHours),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketHoursAdminService,
        {
          provide: MARKET_HOURS_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<MarketHoursAdminService>(MarketHoursAdminService);
  });

  it('creates market-hours configuration when the market is new', async () => {
    repository.findByMarketCode.mockResolvedValue(null);

    const response = await service.configureSchedule('BVC', {
      timezone: 'America/Bogota',
      openTime: { hour: 9, minute: 0 },
      closeTime: { hour: 15, minute: 0 },
      operatingDays: [1, 2, 3, 4, 5],
      actor: 'admin@nexus.local',
    });

    expect(response.marketCode).toBe('BVC');
    expect(response.timezone).toBe('America/Bogota');
    expect(repository.save).toHaveBeenCalledWith(
      expect.any(MarketHours),
      expect.objectContaining({
        marketCode: 'BVC',
        changeType: 'SCHEDULE_CONFIGURED',
        actor: 'admin@nexus.local',
      }),
    );
  });

  it('updates market-hours configuration when the market already exists', async () => {
    repository.findByMarketCode.mockResolvedValue(
      MarketHours.configure('NYSE', {
        timezone: 'America/New_York',
        openTime: { hour: 9, minute: 30 },
        closeTime: { hour: 16, minute: 0 },
        operatingDays: [1, 2, 3, 4, 5],
      }),
    );

    const response = await service.configureSchedule('NYSE', {
      timezone: 'America/New_York',
      openTime: { hour: 10, minute: 0 },
      closeTime: { hour: 15, minute: 30 },
      operatingDays: [1, 2, 3, 4],
      actor: 'admin@nexus.local',
    });

    expect(response.openTime).toEqual({ hour: 10, minute: 0 });
    expect(response.closeTime).toEqual({ hour: 15, minute: 30 });
    expect(response.operatingDays).toEqual([1, 2, 3, 4]);
  });

  it('adds a restriction to an existing market', async () => {
    repository.findByMarketCode.mockResolvedValue(
      MarketHours.configure('NYSE', {
        timezone: 'America/New_York',
        openTime: { hour: 9, minute: 30 },
        closeTime: { hour: 16, minute: 0 },
        operatingDays: [1, 2, 3, 4, 5],
      }),
    );

    const response = await service.configureRestriction('NYSE', {
      date: '2026-06-19',
      status: 'CLOSED',
      reason: 'Juneteenth market holiday',
      actor: 'admin@nexus.local',
    });

    expect(response.restrictions).toEqual([
      {
        date: '2026-06-19',
        status: 'CLOSED',
        reason: 'Juneteenth market holiday',
      },
    ]);
    expect(repository.save).toHaveBeenCalledWith(
      expect.any(MarketHours),
      expect.objectContaining({
        marketCode: 'NYSE',
        changeType: 'RESTRICTION_CONFIGURED',
        actor: 'admin@nexus.local',
      }),
    );
  });

  it('rejects restrictions for markets without schedule configuration', async () => {
    repository.findByMarketCode.mockResolvedValue(null);

    await expect(
      service.configureRestriction('BVC', {
        date: '2026-06-19',
        status: 'CLOSED',
        reason: 'Holiday',
        actor: 'admin@nexus.local',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects restrictions with invalid date format', async () => {
    repository.findByMarketCode.mockResolvedValue(
      MarketHours.configure('NYSE', {
        timezone: 'America/New_York',
        openTime: { hour: 9, minute: 30 },
        closeTime: { hour: 16, minute: 0 },
        operatingDays: [1, 2, 3, 4, 5],
      }),
    );

    await expect(
      service.configureRestriction('NYSE', {
        date: '06-19-2026',
        status: 'CLOSED',
        reason: 'Holiday',
        actor: 'admin@nexus.local',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects restrictions with unsupported status', async () => {
    repository.findByMarketCode.mockResolvedValue(
      MarketHours.configure('NYSE', {
        timezone: 'America/New_York',
        openTime: { hour: 9, minute: 30 },
        closeTime: { hour: 16, minute: 0 },
        operatingDays: [1, 2, 3, 4, 5],
      }),
    );

    await expect(
      service.configureRestriction('NYSE', {
        date: '2026-06-19',
        status: 'OPEN' as 'CLOSED',
        reason: 'Holiday',
        actor: 'admin@nexus.local',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects restrictions without reason', async () => {
    repository.findByMarketCode.mockResolvedValue(
      MarketHours.configure('NYSE', {
        timezone: 'America/New_York',
        openTime: { hour: 9, minute: 30 },
        closeTime: { hour: 16, minute: 0 },
        operatingDays: [1, 2, 3, 4, 5],
      }),
    );

    await expect(
      service.configureRestriction('NYSE', {
        date: '2026-06-19',
        status: 'CLOSED',
        reason: ' ',
        actor: 'admin@nexus.local',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
