import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'trading_notification_event' })
export class TradingNotificationEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'order_reference', type: 'varchar', length: 36 })
  orderReference!: string;

  @Column({ name: 'notification_type', type: 'varchar', length: 40 })
  notificationType!: string;

  @Column({
    name: 'recipient_email',
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  recipientEmail?: string;

  @Column({ type: 'boolean' })
  delivered!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
