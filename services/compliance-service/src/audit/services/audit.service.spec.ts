import { AuditEventsRepository } from '../repositories/audit-events.repository';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(() => {
    service = new AuditService(new AuditEventsRepository());
  });

  it('records audit events and filters them', () => {
    service.record({
      eventType: 'ORDER_STATUS_CHANGED',
      sourceService: 'trading-service',
      actorId: 'trader-101',
      entityType: 'ORDER',
      entityId: 'ORD-1',
      result: 'SUCCESS',
      critical: true,
      context: { toStatus: 'SENT_TO_BROKER' },
      occurredAt: '2026-05-27T15:30:00.000Z',
    });
    service.record({
      eventType: 'LOGIN_FAILED',
      sourceService: 'identity-service',
      actorId: 'trader-101',
      entityType: 'USER',
      entityId: 'trader-101',
      result: 'FAILURE',
      occurredAt: '2026-05-27T15:31:00.000Z',
    });

    expect(service.count()).toBe(2);
    expect(service.count({ critical: true })).toBe(1);
    expect(service.find({ entityType: 'ORDER' })[0]).toEqual(
      expect.objectContaining({
        eventType: 'ORDER_STATUS_CHANGED',
        critical: true,
      }),
    );
    expect(
      service.find({
        from: '2026-05-27T15:31:00.000Z',
        to: '2026-05-27T15:32:00.000Z',
      }),
    ).toHaveLength(1);
    expect(service.find({ sourceService: 'portfolio-service' })).toHaveLength(
      0,
    );
    expect(service.find({ eventType: 'UNKNOWN' })).toHaveLength(0);
    expect(service.find({ correlationId: 'missing' })).toHaveLength(0);
  });
});
