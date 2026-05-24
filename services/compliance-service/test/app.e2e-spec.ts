import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let originalMailFrom: string | undefined;
  let originalMailUser: string | undefined;
  let originalMailPass: string | undefined;
  const sendMailMock = jest.fn();

  beforeEach(async () => {
    originalMailFrom = process.env.MAIL_FROM;
    originalMailUser = process.env.MAIL_USER;
    originalMailPass = process.env.MAIL_PASS;
    process.env.MAIL_FROM = 'no-reply@nexus.local';
    process.env.MAIL_USER = 'smtp-user@nexus.local';
    process.env.MAIL_PASS = 'smtp-pass';
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
});
