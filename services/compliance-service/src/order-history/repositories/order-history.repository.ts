import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  OrderHistoryEvent,
  OrderHistoryFilters,
} from '../entities/order-history-event.entity';

@Injectable()
export class OrderHistoryRepository {
  private readonly events: OrderHistoryEvent[] = [];

  save(event: Omit<OrderHistoryEvent, 'id' | 'recordedAt'>): OrderHistoryEvent {
    const persisted = {
      ...event,
      id: randomUUID(),
      recordedAt: new Date().toISOString(),
    };
    this.events.push(persisted);
    return persisted;
  }

  find(filters: OrderHistoryFilters = {}): OrderHistoryEvent[] {
    return this.events
      .filter((event) => this.matchesFilters(event, filters))
      .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
  }

  count(filters: OrderHistoryFilters = {}): number {
    return this.find(filters).length;
  }

  private matchesFilters(
    event: OrderHistoryEvent,
    filters: OrderHistoryFilters,
  ): boolean {
    if (
      filters.orderReference &&
      event.orderReference !== filters.orderReference
    )
      return false;
    if (filters.actorId && event.actorId !== filters.actorId) return false;
    if (filters.toStatus && event.toStatus !== filters.toStatus) return false;
    return true;
  }
}
