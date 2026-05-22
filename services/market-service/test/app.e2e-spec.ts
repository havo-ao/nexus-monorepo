import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface MarketHoursConfigurationResponse {
  restrictions: Array<{
    date: string;
    status: string;
    reason: string;
  }>;
}

interface SyncMarketDataResponse {
  updatedQuotes: Array<{
    symbol: string;
    currency: string;
    provider: string;
  }>;
}

interface MarketResponse {
  code: string;
  name: string;
  currency: string;
  representativeSymbols: string[];
}

interface InstrumentResponse {
  symbol: string;
  name: string;
  marketCode: string;
  currency: string;
  sector: string;
}

interface SyncInstrumentsResponse {
  status: string;
  provider: string;
  updatedCount: number;
  preservedLocalCatalog: boolean;
  instruments: InstrumentResponse[];
}

interface InstrumentDetailResponse extends InstrumentResponse {
  assetType: string | null;
  industry: string | null;
  country: string | null;
  description: string | null;
  metadataProvider: string | null;
  metadataUpdatedAt: string | null;
  quote: MarketQuoteResponse | null;
}

interface SyncInstrumentMetadataResponse {
  status: string;
  provider: string;
  symbol: string;
  preservedLastKnownMetadata: boolean;
  instrument: InstrumentDetailResponse;
}

interface MarketQuoteResponse {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  spread: number;
  currency: string;
  provider: string;
}

interface MarketQuoteHistoryResponse {
  symbol: string;
  prices: MarketQuoteResponse[];
}

interface WatchlistResponse {
  traderId: string;
  items: Array<{
    symbol: string;
    quote: MarketQuoteResponse | null;
  }>;
}

interface PriceAlertResponse {
  id: number;
  traderId: string;
  symbol: string;
  targetPrice: number;
  condition: string;
  status: string;
}

interface EvaluatePriceAlertsResponse {
  evaluatedCount: number;
  triggeredCount: number;
  triggeredEvents: Array<{
    alertId: number;
    symbol: string;
    marketPrice: number;
  }>;
}

interface DashboardResponse {
  markets: {
    total: number;
    active: number;
  };
  instruments: {
    total: number;
  };
  quotes: {
    trackedCount: number;
    latest: MarketQuoteResponse[];
    topGainers: MarketQuoteResponse[];
    topLosers: MarketQuoteResponse[];
  };
  platform: {
    service: string;
    status: string;
  };
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({
        status: 'ok',
        service: 'market-service',
      });
  });

  it('/api/v1/market-hours/:marketCode/status (GET) allows open market', () => {
    return request(app.getHttpServer())
      .get('/api/v1/market-hours/NYSE/status?at=2026-05-11T14:00:00.000Z')
      .expect(200)
      .expect({
        marketCode: 'NYSE',
        status: 'OPEN',
        canProcessOrder: true,
        evaluatedAt: '2026-05-11T14:00:00.000Z',
        timezone: 'America/New_York',
        reason: 'Market is open for trading',
      });
  });

  it('/api/v1/market-hours/:marketCode/status (GET) blocks closed market', () => {
    return request(app.getHttpServer())
      .get('/api/v1/market-hours/NYSE/status?at=2026-05-11T21:00:00.000Z')
      .expect(200)
      .expect({
        marketCode: 'NYSE',
        status: 'CLOSED',
        canProcessOrder: false,
        evaluatedAt: '2026-05-11T21:00:00.000Z',
        timezone: 'America/New_York',
        reason: 'Market is outside trading hours',
      });
  });

  it('/api/v1/markets (GET) lists available markets', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/markets')
      .expect(200)
      .expect((response) => {
        const body = response.body as MarketResponse[];

        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: 'NYSE',
              name: 'New York Stock Exchange',
              currency: 'USD',
              representativeSymbols: ['AAPL', 'JPM', 'KO'],
            }),
            expect.objectContaining({
              code: 'NASDAQ',
              currency: 'USD',
            }),
          ]),
        );
      });
  });

  it('/api/v1/instruments (GET) lists available instruments', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/instruments')
      .expect(200)
      .expect((response) => {
        const body = response.body as InstrumentResponse[];

        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              symbol: 'AAPL',
              name: 'Apple Inc.',
              marketCode: 'NASDAQ',
              currency: 'USD',
              sector: 'Technology',
            }),
            expect.objectContaining({
              symbol: 'JPM',
              marketCode: 'NYSE',
              currency: 'USD',
            }),
          ]),
        );
      });
  });

  it('/api/v1/instruments/sync (POST) synchronizes available instruments', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/instruments/sync')
      .expect(200)
      .expect((response) => {
        const body = response.body as SyncInstrumentsResponse;

        expect(body).toEqual(
          expect.objectContaining({
            status: 'SUCCESS',
            provider: 'alpha-vantage-listing-compatible',
            preservedLocalCatalog: false,
          }),
        );
        expect(body.updatedCount).toBeGreaterThan(0);
        expect(body.instruments).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              symbol: 'AAPL',
              marketCode: 'NASDAQ',
              currency: 'USD',
            }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/instruments')
      .expect(200)
      .expect((response) => {
        const body = response.body as InstrumentResponse[];

        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              symbol: 'AAPL',
              name: 'Apple Inc.',
            }),
          ]),
        );
      });
  });

  it('/api/v1/instruments/:symbol (GET) returns instrument detail', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/quotes/sync')
      .send({
        symbols: ['AAPL'],
        requestedBy: 'system@nexus.local',
      })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/instruments/AAPL')
      .expect(200)
      .expect((response) => {
        const body = response.body as InstrumentDetailResponse;

        expect(body).toEqual(
          expect.objectContaining({
            symbol: 'AAPL',
            name: 'Apple Inc.',
            marketCode: 'NASDAQ',
            currency: 'USD',
            sector: 'Technology',
            status: 'ACTIVE',
            assetType: null,
            industry: null,
            country: null,
            description: null,
            metadataProvider: null,
            metadataUpdatedAt: null,
          }),
        );
        expect(body.quote).toEqual(
          expect.objectContaining({
            symbol: 'AAPL',
            currency: 'USD',
            provider: 'alpha-vantage-compatible',
          }),
        );
      });
  });

  it('/api/v1/instruments/:symbol/metadata/sync (POST) enriches instrument detail', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/instruments/AAPL/metadata/sync')
      .expect(200)
      .expect((response) => {
        const body = response.body as SyncInstrumentMetadataResponse;

        expect(body).toEqual(
          expect.objectContaining({
            status: 'SUCCESS',
            provider: 'alpha-vantage-overview-compatible',
            symbol: 'AAPL',
            preservedLastKnownMetadata: false,
          }),
        );
        expect(body.instrument).toEqual(
          expect.objectContaining({
            symbol: 'AAPL',
            assetType: 'Common Stock',
            industry: 'Consumer Electronics',
            country: 'USA',
            metadataProvider: 'alpha-vantage-overview-compatible',
          }),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/instruments/AAPL')
      .expect(200)
      .expect((response) => {
        const body = response.body as InstrumentDetailResponse;

        expect(body.description).toContain('Apple Inc.');
        expect(body.metadataUpdatedAt).toEqual(expect.any(String));
      });
  });

  it('/api/v1/admin/market-hours/:marketCode (PUT) configures schedule', async () => {
    await request(app.getHttpServer())
      .put('/api/v1/admin/market-hours/BVC')
      .send({
        timezone: 'America/Bogota',
        openTime: { hour: 9, minute: 0 },
        closeTime: { hour: 15, minute: 0 },
        operatingDays: [1, 2, 3, 4, 5],
        actor: 'admin@nexus.local',
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            marketCode: 'BVC',
            timezone: 'America/Bogota',
            operatingDays: [1, 2, 3, 4, 5],
          }),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/market-hours/BVC/status?at=2026-05-11T15:00:00.000Z')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            marketCode: 'BVC',
            status: 'OPEN',
            canProcessOrder: true,
          }),
        );
      });
  });

  it('/api/v1/admin/market-hours/:marketCode/restrictions (POST) configures restriction', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/market-hours/NYSE/restrictions')
      .send({
        date: '2026-06-19',
        status: 'CLOSED',
        reason: 'Juneteenth market holiday',
        actor: 'admin@nexus.local',
      })
      .expect(200)
      .expect((response) => {
        const body = response.body as MarketHoursConfigurationResponse;

        expect(body.restrictions).toEqual(
          expect.arrayContaining([
            {
              date: '2026-06-19',
              status: 'CLOSED',
              reason: 'Juneteenth market holiday',
            },
          ]),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/market-hours/NYSE/status?at=2026-06-19T14:00:00.000Z')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            marketCode: 'NYSE',
            status: 'CLOSED',
            canProcessOrder: false,
            reason: 'Juneteenth market holiday',
          }),
        );
      });
  });

  it('/api/v1/quotes/sync (POST) synchronizes market data', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/quotes/sync')
      .send({
        symbols: ['AAPL'],
        requestedBy: 'system@nexus.local',
      })
      .expect(200)
      .expect((response) => {
        const body = response.body as SyncMarketDataResponse;

        expect(response.body).toEqual(
          expect.objectContaining({
            status: 'SUCCESS',
            provider: 'alpha-vantage-compatible',
            failedSymbols: [],
            preservedLastKnownData: false,
          }),
        );
        expect(body.updatedQuotes).toEqual([
          expect.objectContaining({
            symbol: 'AAPL',
            currency: 'USD',
            provider: 'alpha-vantage-compatible',
          }),
        ]);
      });
  });

  it('/api/v1/quotes/:symbol (GET) returns latest price components', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/quotes/sync')
      .send({
        symbols: ['AAPL'],
        requestedBy: 'system@nexus.local',
      })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/quotes/AAPL')
      .expect(200)
      .expect((response) => {
        const body = response.body as MarketQuoteResponse;

        expect(body).toEqual(
          expect.objectContaining({
            symbol: 'AAPL',
            currency: 'USD',
            provider: 'alpha-vantage-compatible',
          }),
        );
        expect(typeof body.price).toBe('number');
        expect(typeof body.bid).toBe('number');
        expect(typeof body.ask).toBe('number');
        expect(typeof body.spread).toBe('number');
        expect(body.bid).toBeLessThanOrEqual(body.ask);
        expect(body.spread).toBeGreaterThanOrEqual(0);
      });
  });

  it('/api/v1/quotes/:symbol/history (GET) returns historical prices', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/quotes/sync')
      .send({
        symbols: ['AAPL'],
        requestedBy: 'system@nexus.local',
      })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/quotes/AAPL/history')
      .expect(200)
      .expect((response) => {
        const body = response.body as MarketQuoteHistoryResponse;

        expect(body.symbol).toBe('AAPL');
        expect(body.prices.length).toBeGreaterThan(0);
        expect(body.prices[0]).toEqual(
          expect.objectContaining({
            symbol: 'AAPL',
            currency: 'USD',
            provider: 'alpha-vantage-compatible',
          }),
        );
      });
  });

  it('/api/v1/quotes/:symbol/history/sync (POST) synchronizes historical prices', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/quotes/AAPL/history/sync')
      .expect(200)
      .expect((response) => {
        const body = response.body as {
          status: string;
          provider: string;
          symbol: string;
          updatedCount: number;
          preservedLocalHistory: boolean;
          prices: MarketQuoteResponse[];
        };

        expect(body.status).toBe('SUCCESS');
        expect(body.provider).toBe('alpha-vantage-history-compatible');
        expect(body.symbol).toBe('AAPL');
        expect(body.updatedCount).toBeGreaterThan(0);
        expect(body.preservedLocalHistory).toBe(false);
        expect(body.prices[0]).toEqual(
          expect.objectContaining({
            symbol: 'AAPL',
            currency: 'USD',
            provider: 'alpha-vantage-history-compatible',
          }),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/quotes/AAPL/history')
      .expect(200)
      .expect((response) => {
        const body = response.body as MarketQuoteHistoryResponse;

        expect(body.prices.length).toBeGreaterThan(1);
        expect(body.prices[0]?.provider).toBe(
          'alpha-vantage-history-compatible',
        );
      });
  });

  it('/api/v1/watchlists/:traderId manages watched symbols with current quotes', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/quotes/sync')
      .send({
        symbols: ['AAPL'],
        requestedBy: 'system@nexus.local',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/watchlists/trader-123/items')
      .send({ symbol: 'aapl' })
      .expect(200)
      .expect((response) => {
        const body = response.body as WatchlistResponse;
        const quote = body.items[0]?.quote;

        expect(body.traderId).toBe('trader-123');
        expect(body.items[0]?.symbol).toBe('AAPL');
        expect(quote?.symbol).toBe('AAPL');
        expect(quote?.currency).toBe('USD');
        expect(quote?.provider).toBe('alpha-vantage-compatible');
      });

    await request(app.getHttpServer())
      .delete('/api/v1/watchlists/trader-123/items/AAPL')
      .expect(200)
      .expect((response) => {
        const body = response.body as WatchlistResponse;

        expect(body.items).toEqual([]);
      });
  });

  it('/api/v1/price-alerts creates and evaluates target price alerts', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/quotes/sync')
      .send({
        symbols: ['AAPL'],
        requestedBy: 'system@nexus.local',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/price-alerts')
      .send({
        traderId: 'trader-123',
        symbol: 'aapl',
        targetPrice: 180,
      })
      .expect(200)
      .expect((response) => {
        const body = response.body as PriceAlertResponse;

        expect(body).toEqual(
          expect.objectContaining({
            id: 1,
            traderId: 'trader-123',
            symbol: 'AAPL',
            targetPrice: 180,
            condition: 'ABOVE_OR_EQUAL',
            status: 'ACTIVE',
          }),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/price-alerts/trader-123')
      .expect(200)
      .expect((response) => {
        const body = response.body as PriceAlertResponse[];

        expect(body).toHaveLength(1);
        expect(body[0].symbol).toBe('AAPL');
      });

    await request(app.getHttpServer())
      .post('/api/v1/price-alerts/evaluate')
      .expect(200)
      .expect((response) => {
        const body = response.body as EvaluatePriceAlertsResponse;

        expect(body.evaluatedCount).toBe(1);
        expect(body.triggeredCount).toBe(1);
        expect(body.triggeredEvents[0]).toEqual(
          expect.objectContaining({
            alertId: 1,
            symbol: 'AAPL',
          }),
        );
        expect(typeof body.triggeredEvents[0].marketPrice).toBe('number');
      });
  });

  it('/api/v1/dashboard (GET) returns market dashboard summary', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/quotes/sync')
      .send({
        symbols: ['AAPL', 'MSFT'],
        requestedBy: 'system@nexus.local',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/quotes/sync')
      .send({
        symbols: ['AAPL', 'MSFT'],
        requestedBy: 'system@nexus.local',
      })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/dashboard')
      .expect(200)
      .expect((response) => {
        const body = response.body as DashboardResponse;

        expect(body.markets.total).toBeGreaterThan(0);
        expect(body.markets.active).toBeGreaterThan(0);
        expect(body.instruments.total).toBeGreaterThan(0);
        expect(body.quotes.trackedCount).toBeGreaterThan(0);
        expect(body.quotes.latest).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              symbol: 'AAPL',
              currency: 'USD',
              provider: 'alpha-vantage-compatible',
            }),
          ]),
        );
        expect(body.quotes.topGainers[0]).toEqual(
          expect.objectContaining({
            symbol: 'AAPL',
          }),
        );
        expect(body.quotes.topLosers[0]).toEqual(
          expect.objectContaining({
            symbol: 'MSFT',
          }),
        );
        expect(body.platform).toEqual({
          service: 'market-service',
          status: 'OPERATIONAL',
          generatedAt: expect.any(String) as string,
        });
      });
  });
});
