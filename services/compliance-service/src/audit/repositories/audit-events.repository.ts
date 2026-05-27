import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditEvent, AuditEventFilters } from '../entities/audit-event.entity';

@Injectable()
export class AuditEventsRepository {
  private readonly events: AuditEvent[] = [];

  save(event: Omit<AuditEvent, 'id' | 'recordedAt'>): AuditEvent {
    const persisted: AuditEvent = {
      ...event,
      id: randomUUID(),
      recordedAt: new Date().toISOString(),
    };
    this.events.push(persisted);
    return persisted;
  }

  find(filters: AuditEventFilters = {}): AuditEvent[] {
    return this.events
      .filter((event) => this.matchesFilters(event, filters))
      .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
  }

  count(filters: AuditEventFilters = {}): number {
    return this.find(filters).length;
  }

  private matchesFilters(
    event: AuditEvent,
    filters: AuditEventFilters,
  ): boolean {
    if (filters.actorId && event.actorId !== filters.actorId) return false;
    if (filters.sourceService && event.sourceService !== filters.sourceService)
      return false;
    if (filters.eventType && event.eventType !== filters.eventType)
      return false;
    if (filters.entityType && event.entityType !== filters.entityType)
      return false;
    if (filters.entityId && event.entityId !== filters.entityId) return false;
    if (filters.correlationId && event.correlationId !== filters.correlationId)
      return false;
    if (filters.critical !== undefined && event.critical !== filters.critical)
      return false;
    if (filters.from && event.occurredAt < filters.from) return false;
    if (filters.to && event.occurredAt > filters.to) return false;
    return true;
  }
}
