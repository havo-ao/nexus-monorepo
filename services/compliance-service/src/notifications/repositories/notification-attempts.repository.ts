import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  NotificationAttempt,
  NotificationAttemptFilters,
} from '../entities/notification-attempt.entity';

@Injectable()
export class NotificationAttemptsRepository {
  private readonly attempts: NotificationAttempt[] = [];

  save(
    attempt: Omit<NotificationAttempt, 'id' | 'recordedAt'>,
  ): NotificationAttempt {
    const persisted = {
      ...attempt,
      id: randomUUID(),
      recordedAt: new Date().toISOString(),
    };
    this.attempts.push(persisted);
    return persisted;
  }

  find(filters: NotificationAttemptFilters = {}): NotificationAttempt[] {
    return this.attempts
      .filter((attempt) => this.matchesFilters(attempt, filters))
      .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
  }

  count(filters: NotificationAttemptFilters = {}): number {
    return this.find(filters).length;
  }

  private matchesFilters(
    attempt: NotificationAttempt,
    filters: NotificationAttemptFilters,
  ): boolean {
    if (filters.category && attempt.category !== filters.category) return false;
    if (
      filters.deliveryStatus &&
      attempt.deliveryStatus !== filters.deliveryStatus
    )
      return false;
    if (
      filters.recipientEmail &&
      attempt.recipientEmail !== filters.recipientEmail
    )
      return false;
    if (filters.entityId && attempt.entityId !== filters.entityId) return false;
    return true;
  }
}
