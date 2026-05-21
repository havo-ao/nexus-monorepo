process.env.NEXUS_DISABLE_DB = 'true';

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
        service: 'portfolio-service',
      });
  });

  it('/api/v1/portfolio/:traderId (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/portfolio/1')
      .expect(200)
      .expect({
        traderId: '1',
        positions: [],
        totalInvested: 0,
        currentValue: 0,
        profitLoss: 0,
        returnPercentage: null,
      });
  });

  it('/api/v1/portfolio/:traderId/distribution/sectors (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/portfolio/1/distribution/sectors')
      .expect(200)
      .expect({
        traderId: '1',
        totalValue: 0,
        sectors: [],
      });
  });

  it('/api/v1/portfolio/:traderId/positions/:positionId (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/portfolio/1/positions/99')
      .expect(404);
  });

  it('/api/v1/portfolio/positions/purchases (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/portfolio/positions/purchases')
      .send({
        traderId: '1',
        stockId: '25',
        quantity: 10,
        executionPrice: 152.35,
        executedAt: '2026-05-17T22:15:00.000Z',
      })
      .expect(201)
      .expect({
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

  it('/api/v1/portfolio/positions/sales (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/portfolio/positions/sales')
      .send({
        traderId: '1',
        stockId: '25',
        quantity: 4,
        executionPrice: 178.45,
        executedAt: '2026-05-18T20:45:00.000Z',
      })
      .expect(201)
      .expect({
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
