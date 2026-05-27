import { Injectable } from '@nestjs/common';
import { CreateAuditEventDto } from '../dto/create-audit-event.dto';
import { AuditEvent, AuditEventFilters } from '../entities/audit-event.entity';
import { AuditEventsRepository } from '../repositories/audit-events.repository';

@Injectable()
export class AuditService {
  constructor(private readonly auditEventsRepository: AuditEventsRepository) {}

  record(dto: CreateAuditEventDto): AuditEvent {
    return this.auditEventsRepository.save({
      eventType: dto.eventType.trim(),
      sourceService: dto.sourceService.trim(),
      actorId: dto.actorId.trim(),
      actorRole: dto.actorRole?.trim(),
      entityType: dto.entityType.trim(),
      entityId: dto.entityId.trim(),
      correlationId: dto.correlationId?.trim(),
      result: dto.result,
      critical: dto.critical ?? false,
      context: dto.context ?? {},
      occurredAt: dto.occurredAt
        ? new Date(dto.occurredAt).toISOString()
        : new Date().toISOString(),
    });
  }

  find(filters: AuditEventFilters): AuditEvent[] {
    return this.auditEventsRepository.find(filters);
  }

  count(filters: AuditEventFilters = {}): number {
    return this.auditEventsRepository.count(filters);
  }
}
