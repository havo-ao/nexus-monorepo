import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'portfolio_position_movement' })
export class PortfolioPositionMovement {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'trader_id', type: 'bigint' })
  traderId!: string;

  @Column({ name: 'stock_id', type: 'bigint' })
  stockId!: string;

  @Column({ name: 'position_id', type: 'bigint' })
  positionId!: string;

  @Column({ name: 'movement_type', type: 'varchar', length: 20 })
  movementType!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({
    name: 'execution_price',
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  executionPrice!: string;

  @Column({ name: 'gross_amount', type: 'decimal', precision: 18, scale: 2 })
  grossAmount!: string;

  @Column({
    name: 'source_order_id',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  sourceOrderId?: string | null;

  @Column({
    name: 'source_transaction_id',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  sourceTransactionId?: string | null;

  @Column({ name: 'occurred_at', type: 'timestamp' })
  occurredAt!: Date;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
