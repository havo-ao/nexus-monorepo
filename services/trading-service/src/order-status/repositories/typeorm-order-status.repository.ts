import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TradingOrderEntity } from '../../orders/entities/trading-order.entity';
import { OrderStatusSnapshot } from '../entities/order-status-snapshot.entity';
import type { OrderStatusRepository } from './order-status.repository';

@Injectable()
export class TypeOrmOrderStatusRepository implements OrderStatusRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findCurrentStatusByReference(
    orderReference: string,
  ): Promise<OrderStatusSnapshot | null> {
    const order = await this.dataSource
      .getRepository(TradingOrderEntity)
      .findOne({ where: { orderReference } });

    if (!order) {
      return null;
    }

    return new OrderStatusSnapshot(
      order.id,
      order.orderReference,
      order.traderId,
      order.side,
      order.orderType,
      order.status,
      order.symbol,
      order.exchangeId,
      Number(order.quantity),
      Number(order.estimatedUnitPrice),
      Number(order.grossAmount),
      Number(order.reservedAmount),
      order.currency,
      order.createdAt.toISOString(),
      order.updatedAt.toISOString(),
      order.stockId,
      order.limitPrice ? Number(order.limitPrice) : undefined,
      order.rejectionReason,
    );
  }
}
