process.env.NEXUS_DISABLE_DB = 'true';
process.env.NEXUS_JWT_SECRET = 'local-test-jwt-secret-with-at-least-32-bytes';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const authHeader = `Bearer ${createTestToken('1')}`;

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

  it('/api/v1/health (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({
        status: 'ok',
        service: 'portfolio-service',
      });

    expect(response.body).toEqual({
      status: 'ok',
      service: 'portfolio-service',
    });
  });

  it('/api/v1/portfolio/:traderId (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/portfolio/1')
      .set('Authorization', authHeader)
      .expect(200)
      .expect({
        traderId: '1',
        positions: [],
        totalInvested: 0,
        currentValue: 0,
        profitLoss: 0,
        returnPercentage: null,
      });

    expect(response.body).toEqual({
      traderId: '1',
      positions: [],
      totalInvested: 0,
      currentValue: 0,
      profitLoss: 0,
      returnPercentage: null,
    });
  });

  it('/api/v1/portfolio/:traderId/distribution/sectors (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/portfolio/1/distribution/sectors')
      .set('Authorization', authHeader)
      .expect(200)
      .expect({
        traderId: '1',
        totalValue: 0,
        sectors: [],
      });

    expect(response.body).toEqual({
      traderId: '1',
      totalValue: 0,
      sectors: [],
    });
  });

  it('/api/v1/portfolio/:traderId/balance (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/portfolio/1/balance')
      .set('Authorization', authHeader)
      .expect(200);

    expect(response.body).toEqual({
      traderId: '1',
      availableBalance: 0,
      reservedBalance: 0,
      totalBalance: 0,
      currency: 'USD',
    });
  });

  it('/api/v1/portfolio/:traderId/deposits (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/portfolio/1/deposits')
      .set('Authorization', authHeader)
      .send({
        amount: 250,
        currency: 'USD',
        sourceTransactionId: 'pay_123456',
        depositedAt: '2026-05-21T22:15:00.000Z',
      })
      .expect(201);

    expect(response.body).toEqual({
      movementId: '0',
      traderId: '1',
      amount: 250,
      availableBalance: 250,
      reservedBalance: 0,
      totalBalance: 250,
      currency: 'USD',
      movementType: 'DEPOSIT',
      sourceTransactionId: 'pay_123456',
      createdAt: '2026-05-21T22:15:00.000Z',
    });
  });

  it('/api/v1/portfolio/:traderId/reservations (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/portfolio/1/reservations')
      .set('Authorization', authHeader)
      .send({
        amount: 125,
        currency: 'USD',
        sourceOrderId: 'order_123456',
        reservedAt: '2026-05-22T14:15:00.000Z',
      })
      .expect(201);

    expect(response.body).toEqual({
      movementId: '0',
      traderId: '1',
      amount: 125,
      availableBalance: 0,
      reservedBalance: 125,
      totalBalance: 125,
      currency: 'USD',
      movementType: 'RESERVE',
      sourceOrderId: 'order_123456',
      createdAt: '2026-05-22T14:15:00.000Z',
    });
  });

  it('/api/v1/portfolio/:traderId/reservations/releases (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/portfolio/1/reservations/releases')
      .set('Authorization', authHeader)
      .send({
        amount: 125,
        currency: 'USD',
        sourceOrderId: 'order_123456',
        releasedAt: '2026-05-22T14:30:00.000Z',
      })
      .expect(201);

    expect(response.body).toEqual({
      movementId: '0',
      traderId: '1',
      amount: 125,
      availableBalance: 125,
      reservedBalance: 0,
      totalBalance: 125,
      currency: 'USD',
      movementType: 'RELEASE',
      sourceOrderId: 'order_123456',
      createdAt: '2026-05-22T14:30:00.000Z',
    });
  });

  it('/api/v1/portfolio/:traderId/reservations/captures (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/portfolio/1/reservations/captures')
      .set('Authorization', authHeader)
      .send({
        amount: 125,
        currency: 'USD',
        sourceOrderId: 'order_123456',
        capturedAt: '2026-05-22T14:45:00.000Z',
      })
      .expect(201);

    expect(response.body).toEqual({
      movementId: '0',
      traderId: '1',
      amount: 125,
      availableBalance: 0,
      reservedBalance: 0,
      totalBalance: 0,
      currency: 'USD',
      movementType: 'CAPTURE',
      sourceOrderId: 'order_123456',
      createdAt: '2026-05-22T14:45:00.000Z',
    });
  });

  it('/api/v1/portfolio/:traderId/positions/:positionId (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/portfolio/1/positions/99')
      .set('Authorization', authHeader)
      .expect(404);

    expect(response.status).toBe(404);
  });

  it('/api/v1/portfolio/:traderId (GET) rejects missing token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/portfolio/1')
      .expect(401);

    expect(response.status).toBe(401);
  });

  it('/api/v1/portfolio/:traderId (GET) rejects another trader id', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/portfolio/2')
      .set('Authorization', authHeader)
      .expect(403);

    expect(response.status).toBe(403);
  });

  it('/api/v1/portfolio/positions/purchases (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/portfolio/positions/purchases')
      .set('Authorization', authHeader)
      .send({
        traderId: '1',
        stockId: '25',
        quantity: 10,
        executionPrice: 152.35,
        executedAt: '2026-05-17T22:15:00.000Z',
      })
      .expect(201);

    expect(response.body).toEqual({
      positionId: '0',
      stockId: '25',
      symbol: null,
      quantity: 10,
      averageBuyPrice: 152.35,
      totalInvested: 1523.5,
      currentPrice: null,
      currentValue: null,
      profitLoss: null,
      returnPercentage: null,
      lastUpdated: '2026-05-17T22:15:00.000Z',
    });
  });

  it('/api/v1/portfolio/positions/sales (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/portfolio/positions/sales')
      .set('Authorization', authHeader)
      .send({
        traderId: '1',
        stockId: '25',
        quantity: 4,
        executionPrice: 178.45,
        executedAt: '2026-05-18T20:45:00.000Z',
      })
      .expect(201);

    expect(response.body).toEqual({
      positionId: '0',
      stockId: '25',
      symbol: null,
      quantity: 0,
      averageBuyPrice: 0,
      totalInvested: 0,
      currentPrice: null,
      currentValue: null,
      profitLoss: null,
      returnPercentage: null,
      lastUpdated: '2026-05-18T20:45:00.000Z',
    });
  });
});

function createTestToken(userId: string): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: 'trader@nexus.test',
      userId,
      role: 'TRADER',
      type: 'access',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString('base64url');
  const signature = createHmac('sha256', process.env.NEXUS_JWT_SECRET!)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}
