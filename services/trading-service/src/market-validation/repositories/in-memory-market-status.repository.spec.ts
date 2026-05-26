import { InMemoryMarketStatusRepository } from './in-memory-market-status.repository';

describe('InMemoryMarketStatusRepository', () => {
  let repository: InMemoryMarketStatusRepository;

  beforeEach(() => {
    repository = new InMemoryMarketStatusRepository();
  });

  it('returns open market status and records an event for a configured exchange', async () => {
    const result = await repository.validateMarketStatus(
      '1',
      new Date('2026-05-12T14:30:00.000Z'),
    );

    expect(result).toMatchObject({
      canOperate: true,
      exchangeId: '1',
      marketStatus: 'OPEN',
      timezone: 'America/New_York',
      openTime: '09:30:00',
      closeTime: '16:00:00',
    });
    expect(repository.validationEvents).toEqual([result]);
  });

  it('returns restricted market status and records an event for an unknown exchange', async () => {
    const evaluatedAt = new Date('2026-05-12T14:30:00.000Z');
    const result = await repository.validateMarketStatus('99', evaluatedAt);

    expect(result).toEqual({
      canOperate: false,
      exchangeId: '99',
      marketStatus: 'RESTRICTED',
      evaluatedAt,
      reason: 'Market exchange is not available for trading',
    });
    expect(repository.validationEvents).toEqual([result]);
  });
});
