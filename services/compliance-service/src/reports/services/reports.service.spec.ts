import { AuditEventsRepository } from '../../audit/repositories/audit-events.repository';
import { AuditService } from '../../audit/services/audit.service';
import { NotificationAttemptsRepository } from '../../notifications/repositories/notification-attempts.repository';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { OrderHistoryRepository } from '../../order-history/repositories/order-history.repository';
import { OrderHistoryService } from '../../order-history/services/order-history.service';
import { RestrictionsRepository } from '../../restrictions/repositories/restrictions.repository';
import { RestrictionsService } from '../../restrictions/services/restrictions.service';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  it('summarizes operational, regulatory and executive evidence', () => {
    const auditService = new AuditService(new AuditEventsRepository());
    const notificationsService = new NotificationsService(
      { sendMail: jest.fn() } as never,
      new NotificationAttemptsRepository(),
      auditService,
    );
    const orderHistoryService = new OrderHistoryService(
      new OrderHistoryRepository(),
      auditService,
    );
    const restrictionsService = new RestrictionsService(
      new RestrictionsRepository(),
      auditService,
    );
    const service = new ReportsService(
      auditService,
      notificationsService,
      orderHistoryService,
      restrictionsService,
    );

    auditService.record({
      eventType: 'CRITICAL_EVENT',
      sourceService: 'identity-service',
      actorId: 'admin-1',
      entityType: 'USER',
      entityId: 'user-1',
      result: 'INFO',
      critical: true,
    });
    restrictionsService.upsert('trader-101', {
      status: 'RESTRICTED',
      updatedBy: 'compliance-1',
    });

    expect(service.operational({}).metrics.auditEvents).toBeGreaterThan(0);
    expect(service.regulatory({}).metrics.restrictedTraders).toBe(1);
    expect(service.executive({}).summary.criticalEvents).toBeGreaterThan(0);
  });
});
