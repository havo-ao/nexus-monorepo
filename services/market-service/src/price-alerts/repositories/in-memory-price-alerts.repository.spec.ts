import { PriceAlert } from '../entities/price-alert.entity';
import { PriceAlertEvent } from '../entities/price-alert-event.entity';
import { InMemoryPriceAlertsRepository } from './in-memory-price-alerts.repository';

describe('InMemoryPriceAlertsRepository', () => {
  it('saves alerts and finds them by trader', () => {
    const repository = new InMemoryPriceAlertsRepository();

    repository.saveAlert(
      PriceAlert.create({
        traderId: 'trader-123',
        symbol: 'AAPL',
        targetPrice: 190,
        condition: 'ABOVE_OR_EQUAL',
      }),
    );

    const alerts = repository.findByTraderId('trader-123');

    expect(alerts).toHaveLength(1);
    expect(alerts[0].toSnapshot()).toMatchObject({
      id: 1,
      symbol: 'AAPL',
    });
  });

  it('preserves an explicit alert id', () => {
    const repository = new InMemoryPriceAlertsRepository();
    const alert = repository.saveAlert(
      PriceAlert.create({
        id: 10,
        traderId: 'trader-123',
        symbol: 'AAPL',
        targetPrice: 190,
        condition: 'ABOVE_OR_EQUAL',
      }),
    );

    expect(alert.toSnapshot().id).toBe(10);
  });

  it('keeps triggered alerts out of the active list', () => {
    const repository = new InMemoryPriceAlertsRepository();
    const alert = repository.saveAlert(
      PriceAlert.create({
        traderId: 'trader-123',
        symbol: 'AAPL',
        targetPrice: 190,
        condition: 'ABOVE_OR_EQUAL',
      }),
    );

    repository.markTriggered(alert.markTriggered(new Date()));
    repository.recordEvent(
      PriceAlertEvent.create({
        alertId: 1,
        traderId: 'trader-123',
        symbol: 'AAPL',
        targetPrice: 190,
        marketPrice: 191,
        condition: 'ABOVE_OR_EQUAL',
        occurredAt: new Date(),
      }),
    );

    expect(repository.findActiveAlerts()).toEqual([]);
  });
});
