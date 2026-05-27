import { InternalServerErrorException } from '@nestjs/common';
import { AuditEventsRepository } from '../../audit/repositories/audit-events.repository';
import { AuditService } from '../../audit/services/audit.service';
import { NotificationAttemptsRepository } from '../repositories/notification-attempts.repository';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const originalMailFrom = process.env.MAIL_FROM;
  const originalMailUser = process.env.MAIL_USER;
  const originalMailPass = process.env.MAIL_PASS;
  const sendMail = jest.fn();
  let service: NotificationsService;

  beforeEach(() => {
    process.env.MAIL_FROM = 'no-reply@nexus.local';
    process.env.MAIL_USER = 'smtp-user@nexus.local';
    process.env.MAIL_PASS = 'smtp-pass';
    sendMail.mockResolvedValue(undefined);
    service = new NotificationsService(
      { sendMail } as never,
      new NotificationAttemptsRepository(),
      new AuditService(new AuditEventsRepository()),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (originalMailFrom === undefined) delete process.env.MAIL_FROM;
    else process.env.MAIL_FROM = originalMailFrom;
    if (originalMailUser === undefined) delete process.env.MAIL_USER;
    else process.env.MAIL_USER = originalMailUser;
    if (originalMailPass === undefined) delete process.env.MAIL_PASS;
    else process.env.MAIL_PASS = originalMailPass;
  });

  it('sends template email notifications and records attempts', async () => {
    await expect(
      service.sendEmailNotification({
        templateName: 'ORDER_EXECUTED',
        email: 'trader@nexus.local',
        name: 'Andy',
        surname: 'Trader',
        username: 'andytrader',
        occurredAt: '2026-05-27T15:30:00.000Z',
      }),
    ).resolves.toEqual({
      success: true,
      message: 'Email notification sent successfully.',
      templateName: 'ORDER_EXECUTED',
    });

    expect(service.countAttempts({ category: 'ORDER_STATUS' })).toBe(1);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'trader@nexus.local',
        template: 'order-executed',
      }),
    );
  });

  it('maps identity templates to notification categories', async () => {
    await service.sendEmailNotification({
      templateName: 'LOGIN_SUCCESS',
      email: 'trader@nexus.local',
      name: 'Andy',
      surname: 'Trader',
      username: 'andytrader',
      occurredAt: '2026-05-27T15:30:00.000Z',
    });
    await service.sendEmailNotification({
      templateName: 'USER_REGISTERED',
      email: 'new@nexus.local',
      name: 'New',
      surname: 'User',
      username: 'newuser',
      occurredAt: '2026-05-27T15:30:00.000Z',
    });

    expect(service.countAttempts({ category: 'SECURITY' })).toBe(1);
    expect(service.countAttempts({ category: 'ONBOARDING' })).toBe(1);
  });

  it('records skipped notification events without recipient data', async () => {
    const attempt = await service.processNotificationEvent({
      category: 'MARKET_ALERT',
      sourceService: 'market-service',
      entityType: 'PRICE_ALERT',
      entityId: 'alert-1',
      subject: 'Price alert reached',
      message: 'AAPL reached the configured target.',
      occurredAt: '2026-05-27T15:30:00.000Z',
    });

    expect(attempt.deliveryStatus).toBe('SKIPPED');
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('sends compliance event notifications with recipient data', async () => {
    const attempt = await service.processNotificationEvent({
      category: 'ORDER_STATUS',
      sourceService: 'trading-service',
      entityType: 'ORDER',
      entityId: 'ORD-10',
      subject: 'Order changed',
      message: 'Your order changed.',
      correlationId: 'corr-10',
      context: { status: 'SENT_TO_BROKER' },
      recipient: {
        email: 'trader@nexus.local',
        name: 'Andy',
        surname: 'Trader',
        username: 'andytrader',
      },
      occurredAt: '2026-05-27T15:30:00.000Z',
    });

    expect(attempt.deliveryStatus).toBe('SENT');
    expect(service.findAttempts({ entityId: 'ORD-10' })).toHaveLength(1);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'trader@nexus.local',
        template: 'compliance-event',
      }),
    );
  });

  it('records failed attempts when mail delivery fails', async () => {
    sendMail.mockRejectedValueOnce(new Error('smtp unavailable'));

    const attempt = await service.processNotificationEvent({
      category: 'PORTFOLIO_CHANGE',
      sourceService: 'portfolio-service',
      entityType: 'PORTFOLIO',
      entityId: 'portfolio-1',
      subject: 'Portfolio changed',
      message: 'Your portfolio changed.',
      recipient: {
        email: 'trader@nexus.local',
        name: 'Andy',
        surname: 'Trader',
        username: 'andytrader',
      },
    });

    expect(attempt.deliveryStatus).toBe('FAILED');
    expect(attempt.failureReason).toBe('smtp unavailable');
  });

  it('throws when direct email notification cannot be delivered', async () => {
    sendMail.mockRejectedValueOnce(new Error('smtp unavailable'));

    await expect(
      service.sendEmailNotification({
        templateName: 'LOGIN_FAILED',
        email: 'trader@nexus.local',
        name: 'Andy',
        surname: 'Trader',
        username: 'andytrader',
        occurredAt: '2026-05-27T15:30:00.000Z',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('rejects invalid direct notification payloads', async () => {
    await expect(service.sendEmailNotification(null as never)).rejects.toThrow(
      'templateName must be a string',
    );
    await expect(
      service.sendEmailNotification({
        templateName: 'UNKNOWN',
      } as never),
    ).rejects.toThrow('templateName must be one of');
    await expect(
      service.sendEmailNotification({
        templateName: 'LOGIN_FAILED',
        email: '',
        name: 'Andy',
        surname: 'Trader',
        username: 'andytrader',
        occurredAt: '2026-05-27T15:30:00.000Z',
      }),
    ).rejects.toThrow('email must be a non-empty string');
    await expect(
      service.sendEmailNotification({
        templateName: 'LOGIN_FAILED',
        email: 'trader@nexus.local',
        name: 'Andy',
        surname: 'Trader',
        username: 'andytrader',
        occurredAt: 'not-a-date',
      }),
    ).rejects.toThrow('occurredAt must be a valid ISO 8601 datetime string');
  });

  it('fails fast when mail configuration is incomplete', async () => {
    delete process.env.MAIL_FROM;
    await expect(
      service.processNotificationEvent({
        category: 'ORDER_STATUS',
        sourceService: 'trading-service',
        entityType: 'ORDER',
        entityId: 'ORD-11',
        subject: 'Order changed',
        message: 'Your order changed.',
        recipient: {
          email: 'trader@nexus.local',
          name: 'Andy',
          surname: 'Trader',
          username: 'andytrader',
        },
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        deliveryStatus: 'FAILED',
        failureReason: 'MAIL_FROM is not configured',
      }),
    );

    process.env.MAIL_FROM = 'no-reply@nexus.local';
    delete process.env.MAIL_USER;
    await expect(
      service.sendEmailNotification({
        templateName: 'LOGIN_FAILED',
        email: 'trader@nexus.local',
        name: 'Andy',
        surname: 'Trader',
        username: 'andytrader',
        occurredAt: '2026-05-27T15:30:00.000Z',
      }),
    ).rejects.toThrow('MAIL_USER is not configured');

    process.env.MAIL_USER = 'smtp-user@nexus.local';
    delete process.env.MAIL_PASS;
    await expect(
      service.sendEmailNotification({
        templateName: 'LOGIN_FAILED',
        email: 'trader@nexus.local',
        name: 'Andy',
        surname: 'Trader',
        username: 'andytrader',
        occurredAt: '2026-05-27T15:30:00.000Z',
      }),
    ).rejects.toThrow('MAIL_PASS is not configured');
  });
});
