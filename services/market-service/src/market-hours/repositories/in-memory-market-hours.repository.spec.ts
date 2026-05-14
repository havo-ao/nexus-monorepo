import { MarketHours } from '../entities/market-hours.entity';
import { InMemoryMarketHoursRepository } from './in-memory-market-hours.repository';

describe('InMemoryMarketHoursRepository', () => {
  let repository: InMemoryMarketHoursRepository;

  beforeEach(() => {
    repository = new InMemoryMarketHoursRepository();
  });

  it('finds a default market configuration by normalized code', async () => {
    const marketHours = await repository.findByMarketCode('nyse');

    expect(marketHours?.toSnapshot()).toEqual(
      expect.objectContaining({
        marketCode: 'NYSE',
        timezone: 'America/New_York',
      }),
    );
  });

  it('returns null when market configuration does not exist', async () => {
    await expect(repository.findByMarketCode('BVC')).resolves.toBeNull();
  });

  it('updates an existing market configuration', async () => {
    const marketHours = MarketHours.configure('NYSE', {
      timezone: 'America/New_York',
      openTime: { hour: 10, minute: 0 },
      closeTime: { hour: 15, minute: 30 },
      operatingDays: [1, 2, 3, 4, 5],
    });

    await repository.save(marketHours, {
      marketCode: 'NYSE',
      changeType: 'SCHEDULE_CONFIGURED',
      actor: 'admin@nexus.local',
      context: 'NEX-83 schedule update',
    });

    await expect(repository.findByMarketCode('NYSE')).resolves.toBe(
      marketHours,
    );
  });

  it('stores a new market configuration', async () => {
    const marketHours = MarketHours.configure('BVC', {
      timezone: 'America/Bogota',
      openTime: { hour: 9, minute: 0 },
      closeTime: { hour: 15, minute: 0 },
      operatingDays: [1, 2, 3, 4, 5],
    });

    await repository.save(marketHours, {
      marketCode: 'BVC',
      changeType: 'SCHEDULE_CONFIGURED',
      actor: 'admin@nexus.local',
      context: 'NEX-83 new schedule',
    });

    await expect(repository.findByMarketCode('BVC')).resolves.toBe(marketHours);
  });
});
