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
});
