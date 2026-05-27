import { ComplianceNotificationClient } from './compliance-notification.client';

describe('ComplianceNotificationClient', () => {
  const originalNotificationUrl = process.env.NOTIFICATION_SERVICE_URL;
  const originalFetch = global.fetch;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    process.env.NOTIFICATION_SERVICE_URL = 'http://compliance-service:8885';
    fetchMock = jest.fn().mockResolvedValue(new Response('', { status: 200 }));
    global.fetch = fetchMock;
  });

  afterEach(() => {
    process.env.NOTIFICATION_SERVICE_URL = originalNotificationUrl;
    global.fetch = originalFetch;
  });

  it('requests order execution email delivery through compliance-service', async () => {
    const client = new ComplianceNotificationClient();

    await expect(
      client.sendOrderExecuted({
        orderReference: 'order-reference',
        occurredAt: '2026-05-27T10:00:00.000Z',
        recipient: {
          email: 'andy@nexus.local',
          name: 'Andy',
          surname: 'Trader',
          username: 'andy',
        },
      }),
    ).resolves.toEqual({
      delivered: true,
      recipientEmail: 'andy@nexus.local',
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://compliance-service:8885/api/v1/notifications/email',
    );
  });

  it('does not call compliance-service when recipient data is missing', async () => {
    const client = new ComplianceNotificationClient();

    await expect(
      client.sendOrderExecuted({
        orderReference: 'order-reference',
        occurredAt: '2026-05-27T10:00:00.000Z',
      }),
    ).resolves.toMatchObject({
      delivered: false,
      reason: 'Notification recipient was not provided',
    });
    expect(fetchMock.mock.calls).toHaveLength(0);
  });

  it('records a controlled failure when compliance-service rejects delivery', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 503 }));
    const client = new ComplianceNotificationClient();

    await expect(
      client.sendOrderExecuted({
        orderReference: 'order-reference',
        occurredAt: '2026-05-27T10:00:00.000Z',
        recipient: {
          email: 'andy@nexus.local',
          name: 'Andy',
          surname: 'Trader',
          username: 'andy',
        },
      }),
    ).resolves.toMatchObject({
      delivered: false,
      reason: 'Notification service returned 503',
    });
  });

  it('records a controlled failure when notification service URL is missing', async () => {
    process.env.NOTIFICATION_SERVICE_URL = '';
    const client = new ComplianceNotificationClient();

    await expect(
      client.sendOrderExecuted({
        orderReference: 'order-reference',
        occurredAt: '2026-05-27T10:00:00.000Z',
        recipient: {
          email: 'andy@nexus.local',
          name: 'Andy',
          surname: 'Trader',
          username: 'andy',
        },
      }),
    ).resolves.toMatchObject({
      delivered: false,
      recipientEmail: 'andy@nexus.local',
      reason: 'NOTIFICATION_SERVICE_URL is not configured',
    });
  });

  it('records a controlled failure when compliance-service is unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('connection refused'));
    const client = new ComplianceNotificationClient();

    await expect(
      client.sendOrderExecuted({
        orderReference: 'order-reference',
        occurredAt: '2026-05-27T10:00:00.000Z',
        recipient: {
          email: 'andy@nexus.local',
          name: 'Andy',
          surname: 'Trader',
          username: 'andy',
        },
      }),
    ).resolves.toMatchObject({
      delivered: false,
      recipientEmail: 'andy@nexus.local',
      reason: 'connection refused',
    });
  });
});
