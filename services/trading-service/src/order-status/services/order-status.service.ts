import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { OrderStatusHistoryEntry } from '../entities/order-status-history-entry.entity';
import type { OrderStatusSnapshot } from '../entities/order-status-snapshot.entity';
import {
  ORDER_STATUS_REPOSITORY,
  type OrderStatusRepository,
} from '../repositories/order-status.repository';

@Injectable()
export class OrderStatusService {
  constructor(
    @Inject(ORDER_STATUS_REPOSITORY)
    private readonly orderStatusRepository: OrderStatusRepository,
  ) {}

  async getCurrentStatus(orderReference: string): Promise<OrderStatusSnapshot> {
    const normalizedReference = orderReference.trim();
    const snapshot =
      await this.orderStatusRepository.findCurrentStatusByReference(
        normalizedReference,
      );

    if (!snapshot) {
      throw new NotFoundException('Order was not found');
    }

    return snapshot;
  }

  async getStatusHistory(
    orderReference: string,
  ): Promise<OrderStatusHistoryEntry[]> {
    const normalizedReference = orderReference.trim();
    const snapshot =
      await this.orderStatusRepository.findCurrentStatusByReference(
        normalizedReference,
      );

    if (!snapshot) {
      throw new NotFoundException('Order was not found');
    }

    return this.orderStatusRepository.findStatusHistoryByReference(
      normalizedReference,
    );
  }
}
