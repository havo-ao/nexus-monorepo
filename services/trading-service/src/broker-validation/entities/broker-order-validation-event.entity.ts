import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { OrderStatus } from '../../orders/entities/trading-order.entity';
import type { BrokerValidationDecision } from './broker-order-validation.entity';

@Entity({ name: 'broker_order_validation_event' })
export class BrokerOrderValidationEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'order_id', type: 'bigint' })
  orderId!: string;

  @Column({ name: 'order_reference', type: 'varchar', length: 36 })
  orderReference!: string;

  @Column({ name: 'broker_id', type: 'bigint' })
  brokerId!: string;

  @Column({ type: 'varchar', length: 16 })
  decision!: BrokerValidationDecision;

  @Column({ name: 'from_status', type: 'varchar', length: 24 })
  fromStatus!: OrderStatus;

  @Column({ name: 'to_status', type: 'varchar', length: 24 })
  toStatus!: OrderStatus;

  @Column({ type: 'varchar', length: 255 })
  reason!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
