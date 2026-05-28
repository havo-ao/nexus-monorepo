import type { OrderStatusHistoryEntry } from '../entities/order-status-history-entry.entity';
import type { OrderStatusSnapshot } from '../entities/order-status-snapshot.entity';

export const ORDER_STATUS_REPOSITORY = Symbol('ORDER_STATUS_REPOSITORY');

export interface OrderStatusRepository {
  findCurrentStatusByReference(
    orderReference: string,
  ): Promise<OrderStatusSnapshot | null>;

  findStatusHistoryByReference(
    orderReference: string,
  ): Promise<OrderStatusHistoryEntry[]>;
}
