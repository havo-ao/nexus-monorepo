export type AuditResult = 'SUCCESS' | 'FAILURE' | 'PENDING' | 'INFO';

export interface AuditEvent {
  id: string;
  eventType: string;
  sourceService: string;
  actorId: string;
  actorRole?: string;
  entityType: string;
  entityId: string;
  correlationId?: string;
  result: AuditResult;
  critical: boolean;
  context: Record<string, unknown>;
  occurredAt: string;
  recordedAt: string;
}

export interface AuditEventFilters {
  actorId?: string;
  sourceService?: string;
  eventType?: string;
  entityType?: string;
  entityId?: string;
  correlationId?: string;
  critical?: boolean;
  from?: string;
  to?: string;
}
