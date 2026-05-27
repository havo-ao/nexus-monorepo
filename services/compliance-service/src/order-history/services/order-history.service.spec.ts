import { AuditEventsRepository } from '../../audit/repositories/audit-events.repository';
import { AuditService } from '../../audit/services/audit.service';
import { OrderHistoryRepository } from '../repositories/order-history.repository';
import { OrderHistoryService } from './order-history.service';

describe('OrderHistoryService', () => {
  it('records order history and mirrors it into audit', () => {
    const auditService = new AuditService(new AuditEventsRepository());
    const service = new OrderHistoryService(
      new OrderHistoryRepository(),
      auditService,
    );

    const event = service.record({
      orderReference: 'ORD-2',
      fromStatus: 'PENDING_EXECUTION',
      toStatus: 'SENT_TO_BROKER',
      actorId: 'broker-15',
      actorRole: 'BROKER',
      reason: 'Broker approved.',
      sourceService: 'trading-service',
      correlationId: 'corr-1',
      occurredAt: '2026-05-27T15:30:00.000Z',
    });

    expect(event).toEqual(
      expect.objectContaining({
        orderReference: 'ORD-2',
        toStatus: 'SENT_TO_BROKER',
      }),
    );
    expect(service.findByOrder('ORD-2')).toHaveLength(1);
    expect(service.findByOrder('missing')).toHaveLength(0);
    expect(service.count()).toBe(1);
    expect(auditService.find({ entityId: 'ORD-2' })).toHaveLength(1);
  });
});
