import { PriceAlertEvent } from './price-alert-event.entity';

describe('PriceAlertEvent', () => {
  it('creates a normalized price alert event', () => {
    const occurredAt = new Date('2026-05-16T12:00:00.000Z');
    const event = PriceAlertEvent.create({
      alertId: 1,
      traderId: ' trader-123 ',
      symbol: ' aapl ',
      targetPrice: 190,
      marketPrice: 191,
      condition: ' ABOVE_OR_EQUAL ',
      occurredAt,
    });

    expect(event.toSnapshot()).toEqual({
      alertId: 1,
      traderId: 'trader-123',
      symbol: 'AAPL',
      targetPrice: 190,
      marketPrice: 191,
      condition: 'ABOVE_OR_EQUAL',
      occurredAt,
    });
  });

  it('rejects invalid market prices', () => {
    expect(() =>
      PriceAlertEvent.create({
        alertId: 1,
        traderId: 'trader-123',
        symbol: 'AAPL',
        targetPrice: 190,
        marketPrice: 0,
        condition: 'ABOVE_OR_EQUAL',
        occurredAt: new Date(),
      }),
    ).toThrow(RangeError);
  });
});
