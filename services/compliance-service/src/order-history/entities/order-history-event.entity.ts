export interface OrderHistoryEvent {
  id: string;
  orderReference: string;
  fromStatus?: string;
  toStatus: string;
  actorId: string;
  actorRole?: string;
  reason: string;
  sourceService: string;
  correlationId?: string;
  occurredAt: string;
  recordedAt: string;
}

export interface OrderHistoryFilters {
  orderReference?: string;
  actorId?: string;
  toStatus?: string;
}
