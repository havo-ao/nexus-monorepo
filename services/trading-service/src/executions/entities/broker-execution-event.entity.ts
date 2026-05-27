import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'broker_execution_event' })
export class BrokerExecutionEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'order_id', type: 'bigint' })
  orderId!: string;

  @Column({
    name: 'order_reference',
    type: 'varchar',
    length: 36,
  })
  orderReference!: string;

  @Column({ name: 'broker_name', type: 'varchar', length: 40 })
  brokerName!: string;

  @Column({ name: 'external_order_id', type: 'varchar', length: 80 })
  externalOrderId!: string;

  @Column({ name: 'request_summary', type: 'varchar', length: 255 })
  requestSummary!: string;

  @Column({ name: 'response_summary', type: 'varchar', length: 255 })
  responseSummary!: string;

  @Column({ name: 'broker_status', type: 'varchar', length: 32 })
  brokerStatus!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
