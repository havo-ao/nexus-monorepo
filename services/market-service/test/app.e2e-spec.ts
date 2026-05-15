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

interface MarketQuoteResponse {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  spread: number;
  currency: string;
  provider: string;
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
});
