import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { OrderStatus } from './trading-order.entity';

export type OrderStatusActorType = 'TRADER' | 'SYSTEM' | 'BROKER';

@Entity({ name: 'trading_order_status_event' })
export class OrderStatusEventEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'order_id', type: 'bigint' })
  orderId!: string;

  @Column({ name: 'order_reference', type: 'varchar', length: 36 })
  orderReference!: string;

  @Column({ name: 'from_status', type: 'varchar', length: 24, nullable: true })
  fromStatus?: OrderStatus;

  @Column({ name: 'to_status', type: 'varchar', length: 24 })
  toStatus!: OrderStatus;

  @Column({ name: 'actor_type', type: 'varchar', length: 24 })
  actorType!: OrderStatusActorType;

  @Column({ name: 'actor_id', type: 'varchar', length: 64 })
  actorId!: string;

  @Column({ type: 'varchar', length: 255 })
  reason!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
