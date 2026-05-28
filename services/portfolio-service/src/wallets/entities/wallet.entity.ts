import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'wallet' })
export class Wallet {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'trader_id', type: 'bigint', unique: true })
  traderId!: string;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  balance!: string;

  @Column({
    name: 'available_balance',
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  availableBalance!: string;

  @Column({
    name: 'reserved_balance',
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  reservedBalance!: string;

  @Column({ type: 'varchar', length: 10 })
  currency!: string;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
