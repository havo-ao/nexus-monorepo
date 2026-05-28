import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'compliance_validation_event' })
export class ComplianceValidationEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'trader_id', type: 'bigint' })
  traderId!: string;

  @Column({ type: 'varchar', length: 50 })
  operation!: string;

  @Column({ type: 'boolean' })
  allowed!: boolean;

  @Column({ type: 'varchar', length: 40 })
  status!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason?: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
