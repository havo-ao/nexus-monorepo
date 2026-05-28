/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { createHmac } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let originalMailFrom: string | undefined;
  let originalMailUser: string | undefined;
  let originalMailPass: string | undefined;
  const sendMailMock = jest.fn();
  const jwtSecret = 'e2e-secret-at-least-256-bits-for-tests';
  const legalAuth = {
    Authorization: `Bearer ${signToken({ role: 'LEGAL_USER', userId: 'legal-1' }, jwtSecret)}`,
  };

  beforeEach(async () => {
    originalMailFrom = process.env.MAIL_FROM;
    originalMailUser = process.env.MAIL_USER;
    originalMailPass = process.env.MAIL_PASS;
    process.env.MAIL_FROM = 'no-reply@nexus.local';
    process.env.MAIL_USER = 'smtp-user@nexus.local';
    process.env.MAIL_PASS = 'smtp-pass';
    process.env.NEXUS_JWT_SECRET = jwtSecret;
    sendMailMock.mockResolvedValue(undefined);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailerService)
      .useValue({ sendMail: sendMailMock })
      .compile();

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

    if (originalMailFrom === undefined) {
      delete process.env.MAIL_FROM;
    } else {
      process.env.MAIL_FROM = originalMailFrom;
    }

    if (originalMailUser === undefined) {
      delete process.env.MAIL_USER;
    } else {
      process.env.MAIL_USER = originalMailUser;
    }

    if (originalMailPass === undefined) {
      delete process.env.MAIL_PASS;
    } else {
      process.env.MAIL_PASS = originalMailPass;
    }
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({
        status: 'ok',
        service: 'compliance-service',
      });
  });

  it('sends an email notification using templateName and user identity data', async () => {
    const payload = {
      templateName: 'LOGIN_FAILED',
      email: 'user@nexus.local',
      name: 'Jane',
      surname: 'Doe',
      username: 'jdoe',
      occurredAt: '2026-05-23T20:20:00.000Z',
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/notifications/email')
      .send(payload)
      .expect(201);

    expect(response.body).toEqual({
      success: true,
      message: 'Email notification sent successfully.',
      templateName: 'LOGIN_FAILED',
    });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@nexus.local',
        from: 'no-reply@nexus.local',
        subject: 'Nexus: multiple failed sign-in attempts detected',
        template: 'login-failed',
        context: expect.objectContaining({
          appName: 'Nexus',
          username: 'jdoe',
          recipientEmail: 'user@nexus.local',
          occurredAt: '2026-05-23T20:20:00.000Z',
          occurredAtDisplay: expect.any(String),
        }),
      }),
    );
  });

  it('records and queries auditable events', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/audit/events')
      .send({
        eventType: 'BROKER_VALIDATION_RECORDED',
        sourceService: 'trading-service',
        actorId: 'broker-15',
        actorRole: 'BROKER',
        entityType: 'ORDER',
        entityId: 'ORD-2026-0001',
        result: 'SUCCESS',
        critical: true,
        context: { decision: 'APPROVE' },
        occurredAt: '2026-05-27T15:30:00.000Z',
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        eventType: 'BROKER_VALIDATION_RECORDED',
        sourceService: 'trading-service',
        actorId: 'broker-15',
        entityType: 'ORDER',
        entityId: 'ORD-2026-0001',
        result: 'SUCCESS',
        critical: true,
      }),
    );

    const query = await request(app.getHttpServer())
      .get('/api/v1/audit/events?entityId=ORD-2026-0001&critical=true')
      .set(legalAuth)
      .expect(200);

    expect(query.body).toHaveLength(1);
    expect(query.body[0].eventType).toBe('BROKER_VALIDATION_RECORDED');
  });

  it('records operational order history and exposes it by order', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/order-history/events')
      .send({
        orderReference: 'ORD-2026-0002',
        fromStatus: 'PENDING_EXECUTION',
        toStatus: 'SENT_TO_BROKER',
        actorId: 'broker-15',
        actorRole: 'BROKER',
        reason: 'Approved and submitted to Alpaca.',
        sourceService: 'trading-service',
        occurredAt: '2026-05-27T15:31:00.000Z',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/api/v1/order-history/orders/ORD-2026-0002')
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        orderReference: 'ORD-2026-0002',
        fromStatus: 'PENDING_EXECUTION',
        toStatus: 'SENT_TO_BROKER',
      }),
    );
  });

  it('records notification attempts for compliance events', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/notifications/events')
      .send({
        category: 'ORDER_STATUS',
        sourceService: 'trading-service',
        entityType: 'ORDER',
        entityId: 'ORD-2026-0003',
        subject: 'Order status changed',
        message: 'Your order moved to SENT_TO_BROKER.',
        recipient: {
          email: 'trader@nexus.local',
          name: 'Andy',
          surname: 'Trader',
          username: 'andytrader',
        },
        occurredAt: '2026-05-27T15:32:00.000Z',
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        category: 'ORDER_STATUS',
        deliveryStatus: 'SENT',
        entityId: 'ORD-2026-0003',
      }),
    );

    const attempts = await request(app.getHttpServer())
      .get('/api/v1/notifications/attempts?entityId=ORD-2026-0003')
      .set(legalAuth)
      .expect(200);

    expect(attempts.body).toHaveLength(1);
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'trader@nexus.local',
        subject: 'Nexus: Order status changed',
        template: 'compliance-event',
      }),
    );
  });

  it('blocks restricted trader operations and records the compliance decision', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/restrictions/traders/trader-101')
      .set(legalAuth)
      .send({
        status: 'RESTRICTED',
        reason: 'Unusual activity under review.',
        updatedBy: 'compliance-officer-1',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/v1/restrictions/validate-operation')
      .send({
        traderId: 'trader-101',
        operation: 'CREATE_ORDER',
        sourceService: 'trading-service',
      })
      .expect(201);

    expect(response.body).toEqual({
      traderId: 'trader-101',
      operation: 'CREATE_ORDER',
      allowed: false,
      status: 'RESTRICTED',
      reason: 'Unusual activity under review.',
    });
  });

  it('generates compliance reports from recorded evidence', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/audit/events')
      .send({
        eventType: 'REPORT_SOURCE_EVENT',
        sourceService: 'identity-service',
        actorId: 'admin-1',
        entityType: 'USER',
        entityId: 'user-1',
        result: 'INFO',
        occurredAt: '2026-05-27T15:33:00.000Z',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/executive')
      .set(legalAuth)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        reportType: 'EXECUTIVE',
        summary: expect.objectContaining({
          auditEvents: expect.any(Number),
          criticalEvents: expect.any(Number),
        }),
      }),
    );
  });
});

function signToken(
  payload: { role: string; userId: string },
  secret: string,
): string {
  const encodedHeader = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const encodedPayload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + 3600,
      type: 'access',
      ...payload,
    }),
  ).toString('base64url');
  const signature = createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
