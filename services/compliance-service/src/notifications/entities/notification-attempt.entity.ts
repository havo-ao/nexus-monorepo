export type NotificationCategory =
  | 'ORDER_STATUS'
  | 'MARKET_ALERT'
  | 'PORTFOLIO_CHANGE'
  | 'SECURITY'
  | 'ONBOARDING';

export type NotificationDeliveryStatus = 'SENT' | 'FAILED' | 'SKIPPED';

export interface NotificationAttempt {
  id: string;
  category: NotificationCategory;
  channel: 'EMAIL';
  recipientEmail?: string;
  subject: string;
  sourceService: string;
  entityType: string;
  entityId: string;
  correlationId?: string;
  deliveryStatus: NotificationDeliveryStatus;
  failureReason?: string;
  occurredAt: string;
  recordedAt: string;
}

export interface NotificationAttemptFilters {
  category?: NotificationCategory;
  deliveryStatus?: NotificationDeliveryStatus;
  recipientEmail?: string;
  entityId?: string;
}
