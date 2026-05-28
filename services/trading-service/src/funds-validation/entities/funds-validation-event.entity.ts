import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'funds_validation_event' })
export class FundsValidationEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'trader_id', type: 'bigint' })
  traderId!: string;

  @Column({ name: 'validation_type', type: 'varchar', length: 50 })
  validationType!: string;

  @Column({ type: 'boolean' })
  approved!: boolean;

  @Column({ name: 'required_amount', type: 'decimal', precision: 18, scale: 2 })
  requiredAmount!: string;

  @Column({
    name: 'available_amount',
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  availableAmount!: string;

  @Column({ name: 'reserved_amount', type: 'decimal', precision: 18, scale: 2 })
  reservedAmount!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
