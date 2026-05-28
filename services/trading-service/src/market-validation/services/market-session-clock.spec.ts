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

  it('returns CLOSED when the evaluated date is a weekend', () => {
    const result = evaluateMarketSession(
      schedule,
      '1',
      new Date('2026-05-16T14:30:00.000Z'),
    );

    expect(result).toMatchObject({
      canOperate: false,
      exchangeId: '1',
      marketStatus: 'CLOSED',
      reason: 'Market is closed today',
    });
  });

  it('supports market sessions that cross midnight', () => {
    const overnightSchedule = {
      exchangeId: '2',
      timezone: 'UTC',
      openTime: '22:00:00',
      closeTime: '02:00:00',
    };

    const beforeMidnight = evaluateMarketSession(
      overnightSchedule,
      '2',
      new Date('2026-05-12T23:00:00.000Z'),
    );
    const afterMidnight = evaluateMarketSession(
      overnightSchedule,
      '2',
      new Date('2026-05-13T01:00:00.000Z'),
    );
    const closed = evaluateMarketSession(
      overnightSchedule,
      '2',
      new Date('2026-05-13T12:00:00.000Z'),
    );

    expect(beforeMidnight.canOperate).toBe(true);
    expect(afterMidnight.canOperate).toBe(true);
    expect(closed).toMatchObject({
      canOperate: false,
      marketStatus: 'CLOSED',
      reason: 'Market is closed at this time',
    });
  });

  it('accepts compact schedule times without seconds', () => {
    const compactSchedule = {
      exchangeId: '3',
      timezone: 'UTC',
      openTime: '09',
      closeTime: '16:00',
    };

    const result = evaluateMarketSession(
      compactSchedule,
      '3',
      new Date('2026-05-12T09:30:00.000Z'),
    );

    expect(result).toMatchObject({
      canOperate: true,
      exchangeId: '3',
      marketStatus: 'OPEN',
    });
  });

  it('uses zero defaults when date formatter parts are missing', () => {
    const formatterSpy = jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () =>
        ({
          formatToParts: () => [],
        }) as unknown as Intl.DateTimeFormat,
    );

    const fallbackSchedule = {
      exchangeId: '4',
      timezone: 'UTC',
      openTime: '00:00:00',
      closeTime: '00:01:00',
    };

    const result = evaluateMarketSession(
      fallbackSchedule,
      '4',
      new Date('2026-05-12T09:30:00.000Z'),
    );

    expect(result).toMatchObject({
      canOperate: true,
      exchangeId: '4',
      marketStatus: 'OPEN',
    });

    formatterSpy.mockRestore();
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
