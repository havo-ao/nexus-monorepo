import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

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
        service: 'trading-service',
      });
  });

  it('/api/v1/validations/market/status (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/validations/market/status')
      .send({
        exchangeId: '1',
        evaluatedAt: '2026-05-12T14:30:00.000Z',
      })
      .expect(200)
      .expect({
        canOperate: true,
        exchangeId: '1',
        marketStatus: 'OPEN',
        evaluatedAt: '2026-05-12T14:30:00.000Z',
        timezone: 'America/New_York',
        openTime: '09:30:00',
        closeTime: '16:00:00',
      });
  });

  it('/api/v1/orders/buy/market (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/orders/buy/market')
      .send({
        traderId: '101',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 1,
        estimatedUnitPrice: 250,
        marketEvaluatedAt: '2026-05-12T14:30:00.000Z',
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as Record<string, unknown>;
        expect(body).toMatchObject({
          traderId: '101',
          side: 'BUY',
          orderType: 'MARKET',
          status: 'PENDING_EXECUTION',
          symbol: 'AAPL',
          exchangeId: '1',
          quantity: 1,
          estimatedUnitPrice: 250,
          grossAmount: 250,
          reservedAmount: 250,
          currency: 'USD',
        });
        expect(body.orderReference).toEqual(expect.any(String));
      });
  });
});
