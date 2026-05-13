import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'market_validation_event' })
export class MarketValidationEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'exchange_id', type: 'bigint' })
  exchangeId!: string;

  @Column({ name: 'market_status', type: 'varchar', length: 20 })
  marketStatus!: string;

  @Column({ name: 'can_operate', type: 'boolean' })
  canOperate!: boolean;

  @Column({ name: 'evaluated_at', type: 'timestamp' })
  evaluatedAt!: Date;

  @Column({ type: 'varchar', length: 64, nullable: true })
  timezone?: string;

  @Column({ name: 'open_time', type: 'varchar', length: 8, nullable: true })
  openTime?: string;

  @Column({ name: 'close_time', type: 'varchar', length: 8, nullable: true })
  closeTime?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
