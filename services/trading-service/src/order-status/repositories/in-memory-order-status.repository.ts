import { Injectable } from '@nestjs/common';
import { OrderStatusHistoryEntry } from '../entities/order-status-history-entry.entity';
import { OrderStatusSnapshot } from '../entities/order-status-snapshot.entity';
import type { OrderStatusRepository } from './order-status.repository';

@Injectable()
export class InMemoryOrderStatusRepository implements OrderStatusRepository {
  private readonly snapshots = new Map<string, OrderStatusSnapshot>([
    [
      'order-reference',
      new OrderStatusSnapshot(
        '1',
        'order-reference',
        '101',
        'BUY',
        'MARKET',
        'PENDING_EXECUTION',
        'AAPL',
        '1',
        1,
        250,
        250,
        250,
        'USD',
        '2026-05-26T14:30:00.000Z',
        '2026-05-26T14:30:00.000Z',
      ),
    ],
  ]);
  private readonly history = new Map<string, OrderStatusHistoryEntry[]>([
    [
      'order-reference',
      [
        new OrderStatusHistoryEntry(
          '1',
          '1',
          'order-reference',
          'PENDING_EXECUTION',
          'TRADER',
          '101',
          'Market buy order created after funds reservation',
          '2026-05-26T14:30:00.000Z',
        ),
      ],
    ],
  ]);

  findCurrentStatusByReference(
    orderReference: string,
  ): Promise<OrderStatusSnapshot | null> {
    return Promise.resolve(this.snapshots.get(orderReference) ?? null);
  }

  findStatusHistoryByReference(
    orderReference: string,
  ): Promise<OrderStatusHistoryEntry[]> {
    return Promise.resolve(this.history.get(orderReference) ?? []);
  }
}
