import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type {
  OrderStatus,
  OrderType,
} from '../../orders/entities/trading-order.entity';

@Entity({ name: 'pending_order_processing_event' })
export class PendingOrderProcessingEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'order_id', type: 'bigint' })
  orderId!: string;

  @Column({ name: 'order_reference', type: 'varchar', length: 36 })
  orderReference!: string;

  @Column({ name: 'from_status', type: 'varchar', length: 24 })
  fromStatus!: OrderStatus;

  @Column({
    name: 'to_status',
    type: 'varchar',
    length: 24,
    nullable: true,
  })
  toStatus?: OrderStatus;

  @Column({ type: 'varchar', length: 16 })
  symbol!: string;

  @Column({ name: 'order_type', type: 'varchar', length: 24 })
  orderType!: OrderType;

  @Column({
    name: 'market_status',
    type: 'varchar',
    length: 24,
    nullable: true,
  })
  marketStatus?: string;

  @Column({
    name: 'market_price',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  marketPrice?: string;

  @Column({
    name: 'trigger_price',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  triggerPrice?: string;

  @Column({ name: 'matched', type: 'boolean' })
  matched!: boolean;

  @Column({ type: 'varchar', length: 40 })
  action!: string;

  @Column({ type: 'varchar', length: 255 })
  reason!: string;

  @Column({ name: 'evaluated_at', type: 'timestamp' })
  evaluatedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
