import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'sell_holdings_validation_event' })
export class HoldingsValidationEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'trader_id', type: 'bigint' })
  traderId!: string;

  @Column({ name: 'stock_id', type: 'bigint' })
  stockId!: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  symbol?: string;

  @Column({
    name: 'requested_quantity',
    type: 'decimal',
    precision: 18,
    scale: 6,
  })
  requestedQuantity!: string;

  @Column({
    name: 'available_quantity',
    type: 'decimal',
    precision: 18,
    scale: 6,
  })
  availableQuantity!: string;

  @Column({ type: 'boolean' })
  approved!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
