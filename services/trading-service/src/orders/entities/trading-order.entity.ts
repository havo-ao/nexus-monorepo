import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT';
export type OrderStatus =
  | 'CREATED'
  | 'PENDING_EXECUTION'
  | 'PENDING_CONDITION'
  | 'SENT_TO_BROKER'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXECUTED'
  | 'FAILED';

@Entity({ name: 'trading_order' })
export class TradingOrderEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({
    name: 'order_reference',
    type: 'varchar',
    length: 36,
    unique: true,
  })
  orderReference!: string;

  @Column({ name: 'trader_id', type: 'bigint' })
  traderId!: string;

  @Column({ type: 'varchar', length: 16 })
  side!: OrderSide;

  @Column({ name: 'order_type', type: 'varchar', length: 24 })
  orderType!: OrderType;

  @Column({ type: 'varchar', length: 24 })
  status!: OrderStatus;

  @Column({ type: 'varchar', length: 16 })
  symbol!: string;

  @Column({ name: 'exchange_id', type: 'bigint' })
  exchangeId!: string;

  @Column({ name: 'stock_id', type: 'bigint', nullable: true })
  stockId?: string;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  quantity!: string;

  @Column({
    name: 'estimated_unit_price',
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  estimatedUnitPrice!: string;

  @Column({
    name: 'limit_price',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  limitPrice?: string;

  @Column({ name: 'gross_amount', type: 'decimal', precision: 18, scale: 2 })
  grossAmount!: string;

  @Column({ name: 'reserved_amount', type: 'decimal', precision: 18, scale: 2 })
  reservedAmount!: string;

  @Column({ type: 'varchar', length: 10 })
  currency!: string;

  @Column({
    name: 'rejection_reason',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  rejectionReason?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
