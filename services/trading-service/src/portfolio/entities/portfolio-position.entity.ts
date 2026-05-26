import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'portfolio_position' })
export class PortfolioPosition {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'trader_id', type: 'bigint' })
  traderId!: string;

  @Column({ name: 'stock_id', type: 'bigint' })
  stockId!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ name: 'avg_buy_price', type: 'decimal', precision: 18, scale: 2 })
  avgBuyPrice!: string;

  @Column({ name: 'total_invested', type: 'decimal', precision: 18, scale: 2 })
  totalInvested!: string;

  @Column({ name: 'last_updated', type: 'timestamp' })
  lastUpdated!: Date;
}
