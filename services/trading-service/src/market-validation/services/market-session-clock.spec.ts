import { evaluateMarketSession } from './market-session-clock';

describe('evaluateMarketSession', () => {
  const schedule = {
    exchangeId: '1',
    timezone: 'America/New_York',
    openTime: '09:30:00',
    closeTime: '16:00:00',
  };

  it('returns OPEN when the evaluated time is inside market hours', () => {
    const result = evaluateMarketSession(
      schedule,
      '1',
      new Date('2026-05-12T14:30:00.000Z'),
    );

    expect(result).toEqual({
      canOperate: true,
      exchangeId: '1',
      marketStatus: 'OPEN',
      evaluatedAt: new Date('2026-05-12T14:30:00.000Z'),
      timezone: 'America/New_York',
      openTime: '09:30:00',
      closeTime: '16:00:00',
    });
  });

  it('returns CLOSED when the evaluated time is outside market hours', () => {
    const result = evaluateMarketSession(
      schedule,
      '1',
      new Date('2026-05-12T22:00:00.000Z'),
    );

    expect(result).toMatchObject({
      canOperate: false,
      exchangeId: '1',
      marketStatus: 'CLOSED',
      reason: 'Market is closed at this time',
    });
  });

  it('returns RESTRICTED when the exchange has no local schedule', () => {
    const evaluatedAt = new Date('2026-05-12T14:30:00.000Z');
    const result = evaluateMarketSession(null, '99', evaluatedAt);

    expect(result).toEqual({
      canOperate: false,
      exchangeId: '99',
      marketStatus: 'RESTRICTED',
      evaluatedAt,
      reason: 'Market exchange is not available for trading',
    });
  });
});
