import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'order_settlement_event' })
export class OrderSettlementEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'order_id', type: 'bigint' })
  orderId!: string;

  @Column({ name: 'order_reference', type: 'varchar', length: 36 })
  orderReference!: string;

  @Column({ name: 'broker_name', type: 'varchar', length: 40 })
  brokerName!: string;

  @Column({ name: 'external_order_id', type: 'varchar', length: 80 })
  externalOrderId!: string;

  @Column({ name: 'broker_status', type: 'varchar', length: 32 })
  brokerStatus!: string;

  @Column({ name: 'internal_status', type: 'varchar', length: 24 })
  internalStatus!: string;

  @Column({ name: 'filled_quantity', type: 'decimal', precision: 18, scale: 6 })
  filledQuantity!: string;

  @Column({
    name: 'average_filled_price',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  averageFilledPrice?: string;

  @Column({ name: 'settled_amount', type: 'decimal', precision: 18, scale: 2 })
  settledAmount!: string;

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

  @Column({ type: 'varchar', length: 255 })
  reason!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
