import { PriceAlert } from './price-alert.entity';

describe('PriceAlert', () => {
  it('normalizes alert data and defaults to active status', () => {
    const alert = PriceAlert.create({
      traderId: ' trader-123 ',
      symbol: ' aapl ',
      targetPrice: 190,
      condition: 'ABOVE_OR_EQUAL',
    });

    expect(alert.toSnapshot()).toMatchObject({
      traderId: 'trader-123',
      symbol: 'AAPL',
      targetPrice: 190,
      condition: 'ABOVE_OR_EQUAL',
      status: 'ACTIVE',
    });
  });

  it('evaluates above and below target conditions', () => {
    const aboveAlert = PriceAlert.create({
      traderId: 'trader-123',
      symbol: 'AAPL',
      targetPrice: 190,
      condition: 'ABOVE_OR_EQUAL',
    });
    const belowAlert = PriceAlert.create({
      traderId: 'trader-123',
      symbol: 'TSLA',
      targetPrice: 200,
      condition: 'BELOW_OR_EQUAL',
    });

    expect(aboveAlert.isTriggeredBy(190)).toBe(true);
    expect(aboveAlert.isTriggeredBy(189.99)).toBe(false);
    expect(belowAlert.isTriggeredBy(199)).toBe(true);
    expect(belowAlert.isTriggeredBy(201)).toBe(false);
  });

  it('marks an alert as triggered', () => {
    const triggeredAt = new Date('2026-05-16T12:00:00.000Z');
    const alert = PriceAlert.create({
      id: 1,
      traderId: 'trader-123',
      symbol: 'AAPL',
      targetPrice: 190,
      condition: 'ABOVE_OR_EQUAL',
    }).markTriggered(triggeredAt);

    expect(alert.toSnapshot()).toMatchObject({
      status: 'TRIGGERED',
      triggeredAt,
    });
  });

  it('rejects invalid target prices', () => {
    expect(() =>
      PriceAlert.create({
        traderId: 'trader-123',
        symbol: 'AAPL',
        targetPrice: 0,
        condition: 'ABOVE_OR_EQUAL',
      }),
    ).toThrow(RangeError);
  });
});
