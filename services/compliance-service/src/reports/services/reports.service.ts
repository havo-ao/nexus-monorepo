import { Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/services/audit.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { OrderHistoryService } from '../../order-history/services/order-history.service';
import { RestrictionsService } from '../../restrictions/services/restrictions.service';
import { ReportQueryDto } from '../dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly orderHistoryService: OrderHistoryService,
    private readonly restrictionsService: RestrictionsService,
  ) {}

  operational(query: ReportQueryDto) {
    return {
      reportType: 'OPERATIONAL',
      generatedAt: new Date().toISOString(),
      range: this.normalizeRange(query),
      metrics: {
        auditEvents: this.auditService.count(this.normalizeRange(query)),
        orderHistoryEvents: this.orderHistoryService.count(),
        notificationAttempts: this.notificationsService.countAttempts(),
        failedNotifications: this.notificationsService.countAttempts({
          deliveryStatus: 'FAILED',
        }),
      },
    };
  }

  regulatory(query: ReportQueryDto) {
    const range = this.normalizeRange(query);
    return {
      reportType: 'REGULATORY',
      generatedAt: new Date().toISOString(),
      range,
      metrics: {
        criticalEvents: this.auditService.count({ ...range, critical: true }),
        restrictedTraders: this.restrictionsService.countRestricted(),
        notificationEvidence: this.notificationsService.countAttempts(),
      },
      provenance: {
        audit: '/api/v1/audit/events',
        notifications: '/api/v1/notifications/attempts',
        restrictions: '/api/v1/restrictions/traders/{traderId}',
      },
    };
  }

  executive(query: ReportQueryDto) {
    const operational = this.operational(query);
    const regulatory = this.regulatory(query);
    return {
      reportType: 'EXECUTIVE',
      generatedAt: new Date().toISOString(),
      range: this.normalizeRange(query),
      summary: {
        auditEvents: operational.metrics.auditEvents,
        orderHistoryEvents: operational.metrics.orderHistoryEvents,
        criticalEvents: regulatory.metrics.criticalEvents,
        restrictedTraders: regulatory.metrics.restrictedTraders,
      },
    };
  }

  private normalizeRange(query: ReportQueryDto) {
    return {
      from: query.from ? new Date(query.from).toISOString() : undefined,
      to: query.to ? new Date(query.to).toISOString() : undefined,
    };
  }
}
