import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'wallet_movement' })
export class WalletMovement {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'trader_id', type: 'bigint' })
  traderId!: string;

  @Column({ name: 'movement_type', type: 'varchar', length: 20 })
  movementType!: string;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  amount!: string;

  @Column({ type: 'varchar', length: 10 })
  currency!: string;

  @Column({
    name: 'source_transaction_id',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  sourceTransactionId?: string | null;

  @Column({
    name: 'source_order_id',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  sourceOrderId?: string | null;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
