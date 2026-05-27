import { Injectable } from '@nestjs/common';
import { CreateAuditEventDto } from '../../audit/dto/create-audit-event.dto';
import { AuditService } from '../../audit/services/audit.service';
import { RecordOrderHistoryEventDto } from '../dto/record-order-history-event.dto';
import { OrderHistoryEvent } from '../entities/order-history-event.entity';
import { OrderHistoryRepository } from '../repositories/order-history.repository';

@Injectable()
export class OrderHistoryService {
  constructor(
    private readonly orderHistoryRepository: OrderHistoryRepository,
    private readonly auditService: AuditService,
  ) {}

  record(dto: RecordOrderHistoryEventDto): OrderHistoryEvent {
    const occurredAt = dto.occurredAt
      ? new Date(dto.occurredAt).toISOString()
      : new Date().toISOString();
    const event = this.orderHistoryRepository.save({
      orderReference: dto.orderReference.trim(),
      fromStatus: dto.fromStatus?.trim(),
      toStatus: dto.toStatus.trim(),
      actorId: dto.actorId.trim(),
      actorRole: dto.actorRole?.trim(),
      reason: dto.reason.trim(),
      sourceService: dto.sourceService.trim(),
      correlationId: dto.correlationId?.trim(),
      occurredAt,
    });

    const auditEvent: CreateAuditEventDto = {
      eventType: 'ORDER_STATUS_CHANGED',
      sourceService: event.sourceService,
      actorId: event.actorId,
      actorRole: event.actorRole,
      entityType: 'ORDER',
      entityId: event.orderReference,
      correlationId: event.correlationId,
      result: 'SUCCESS',
      critical: true,
      context: {
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        reason: event.reason,
      },
      occurredAt,
    };
    this.auditService.record(auditEvent);

    return event;
  }

  findByOrder(orderReference: string): OrderHistoryEvent[] {
    return this.orderHistoryRepository.find({ orderReference });
  }

  count(): number {
    return this.orderHistoryRepository.count();
  }
}
