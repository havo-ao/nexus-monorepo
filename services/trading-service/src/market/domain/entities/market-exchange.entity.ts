import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'market_exchange' })
export class MarketExchange {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 80 })
  country!: string;

  @Column({ type: 'varchar', length: 64 })
  timezone!: string;

  @Column({ name: 'open_time', type: 'time' })
  openTime!: string;

  @Column({ name: 'close_time', type: 'time' })
  closeTime!: string;
}
