import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type {
  OrderSide,
  OrderType,
} from '../../orders/entities/trading-order.entity';

@Entity({ name: 'commission_calculation_event' })
export class CommissionCalculationEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'trader_id', type: 'bigint' })
  traderId!: string;

  @Column({
    name: 'order_reference',
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  orderReference?: string;

  @Column({ type: 'varchar', length: 16 })
  side!: OrderSide;

  @Column({ name: 'order_type', type: 'varchar', length: 24 })
  orderType!: OrderType;

  @Column({ name: 'gross_amount', type: 'decimal', precision: 18, scale: 2 })
  grossAmount!: string;

  @Column({ name: 'rate_bps', type: 'int' })
  rateBps!: number;

  @Column({
    name: 'commission_amount',
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  commissionAmount!: string;

  @Column({ name: 'net_amount', type: 'decimal', precision: 18, scale: 2 })
  netAmount!: string;

  @Column({ type: 'varchar', length: 10 })
  currency!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
