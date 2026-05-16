import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Instrument } from '../../instruments/entities/instrument.entity';
import type { InstrumentsRepository } from '../../instruments/repositories/instruments.repository';
import { MarketQuote } from '../../quotes/entities/market-quote.entity';
import type { QuotesRepository } from '../../quotes/repositories/quotes.repository';
import { InMemoryPriceAlertsRepository } from '../repositories/in-memory-price-alerts.repository';
import { PriceAlertsService } from './price-alerts.service';

describe('PriceAlertsService', () => {
  let repository: InMemoryPriceAlertsRepository;
  let instrumentsRepository: jest.Mocked<InstrumentsRepository>;
  let quotesRepository: jest.Mocked<QuotesRepository>;
  let service: PriceAlertsService;

  beforeEach(() => {
    repository = new InMemoryPriceAlertsRepository();
    instrumentsRepository = {
      findAvailable: jest.fn(),
      findBySymbol: jest.fn().mockResolvedValue(
        Instrument.restore({
          symbol: 'AAPL',
          name: 'Apple Inc.',
          marketCode: 'NASDAQ',
          currency: 'USD',
          status: 'ACTIVE',
          sector: 'Technology',
        }),
      ),
    };
    quotesRepository = {
      saveQuotes: jest.fn(),
      findLatestBySymbol: jest.fn(),
      findHistoryBySymbol: jest.fn(),
      recordSyncEvent: jest.fn(),
    };
    service = new PriceAlertsService(
      repository,
      instrumentsRepository,
      quotesRepository,
    );
  });

  it('creates a target price alert for an available instrument', async () => {
    const alert = await service.createAlert({
      traderId: 'trader-123',
      symbol: 'aapl',
      targetPrice: 190,
    });

    expect(alert).toMatchObject({
      id: 1,
      traderId: 'trader-123',
      symbol: 'AAPL',
      targetPrice: 190,
      condition: 'ABOVE_OR_EQUAL',
      status: 'ACTIVE',
    });
  });

  it('creates below target alerts with explicit condition', async () => {
    const alert = await service.createAlert({
      traderId: ' trader-123 ',
      symbol: ' aapl ',
      targetPrice: '200' as unknown as number,
      condition: 'BELOW_OR_EQUAL',
    });

    expect(alert).toMatchObject({
      traderId: 'trader-123',
      symbol: 'AAPL',
      targetPrice: 200,
      condition: 'BELOW_OR_EQUAL',
      triggeredAt: null,
    });
  });

  it('rejects unknown instruments', async () => {
    instrumentsRepository.findBySymbol.mockResolvedValueOnce(null);

    await expect(
      service.createAlert({
        traderId: 'trader-123',
        symbol: 'ZZZZ',
        targetPrice: 190,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects invalid target price requests', async () => {
    await expect(
      service.createAlert({
        traderId: 'trader-123',
        symbol: 'AAPL',
        targetPrice: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid trader and symbol requests', async () => {
    await expect(
      service.createAlert({
        traderId: '',
        symbol: 'AAPL',
        targetPrice: 190,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.createAlert({
        traderId: 'trader-123',
        symbol: '',
        targetPrice: 190,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unsupported alert conditions', async () => {
    await expect(
      service.createAlert({
        traderId: 'trader-123',
        symbol: 'AAPL',
        targetPrice: 190,
        condition: 'EQUAL' as never,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists alerts for a trader', async () => {
    await service.createAlert({
      traderId: 'trader-123',
      symbol: 'AAPL',
      targetPrice: 190,
    });

    await expect(service.getAlertsByTrader(' trader-123 ')).resolves.toEqual([
      expect.objectContaining({
        traderId: 'trader-123',
        symbol: 'AAPL',
      }),
    ]);
  });

  it('evaluates active alerts and records trigger events', async () => {
    await service.createAlert({
      traderId: 'trader-123',
      symbol: 'AAPL',
      targetPrice: 180,
    });
    quotesRepository.findLatestBySymbol.mockResolvedValue(
      MarketQuote.fromProvider({
        symbol: 'AAPL',
        price: 186.4,
        bid: 186.35,
        ask: 186.45,
        currency: 'USD',
        provider: 'alpha-vantage-compatible',
        asOf: new Date('2026-05-16T12:00:00.000Z'),
      }),
    );

    const result = await service.evaluateAlerts();

    expect(result.evaluatedCount).toBe(1);
    expect(result.triggeredCount).toBe(1);
    expect(result.triggeredEvents[0]).toMatchObject({
      alertId: 1,
      symbol: 'AAPL',
      marketPrice: 186.4,
    });

    await expect(service.getAlertsByTrader('trader-123')).resolves.toEqual([
      expect.objectContaining({
        status: 'TRIGGERED',
        triggeredAt: expect.any(String) as string,
      }),
    ]);
  });

  it('keeps alerts active when quotes are missing or target is not reached', async () => {
    await service.createAlert({
      traderId: 'trader-123',
      symbol: 'AAPL',
      targetPrice: 300,
    });
    quotesRepository.findLatestBySymbol.mockResolvedValue(
      MarketQuote.fromProvider({
        symbol: 'AAPL',
        price: 186.4,
        bid: 186.35,
        ask: 186.45,
        currency: 'USD',
        provider: 'alpha-vantage-compatible',
        asOf: new Date('2026-05-16T12:00:00.000Z'),
      }),
    );

    await expect(service.evaluateAlerts()).resolves.toEqual({
      evaluatedCount: 1,
      triggeredCount: 0,
      triggeredEvents: [],
    });

    quotesRepository.findLatestBySymbol.mockResolvedValueOnce(null);
    await expect(service.evaluateAlerts()).resolves.toEqual({
      evaluatedCount: 1,
      triggeredCount: 0,
      triggeredEvents: [],
    });
  });
});
