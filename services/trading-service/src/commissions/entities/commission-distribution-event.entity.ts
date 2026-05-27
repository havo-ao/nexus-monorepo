import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'commission_distribution_event' })
export class CommissionDistributionEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'trader_id', type: 'bigint' })
  traderId!: string;

  @Column({ name: 'broker_id', type: 'bigint' })
  brokerId!: string;

  @Column({
    name: 'order_reference',
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  orderReference?: string;

  @Column({
    name: 'commission_amount',
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  commissionAmount!: string;

  @Column({ name: 'platform_amount', type: 'decimal', precision: 18, scale: 2 })
  platformAmount!: string;

  @Column({ name: 'broker_amount', type: 'decimal', precision: 18, scale: 2 })
  brokerAmount!: string;

  @Column({ name: 'platform_share_bps', type: 'int' })
  platformShareBps!: number;

  @Column({ name: 'broker_share_bps', type: 'int' })
  brokerShareBps!: number;

  @Column({ type: 'varchar', length: 10 })
  currency!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
