import { Injectable, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PortfolioPosition } from '../entities/portfolio-position.entity';

@Injectable()
export class PortfolioPositionsRepository {
  constructor(@Optional() private readonly dataSource?: DataSource) {}

  async findByTraderId(traderId: string): Promise<PortfolioPosition[]> {
    if (!this.dataSource) {
      return [];
    }

    const rows = await this.dataSource
      .getRepository(PortfolioPosition)
      .createQueryBuilder('position')
      .leftJoin('stock', 'stock', 'stock.id = position.stock_id')
      .select([
        'position.id AS id',
        'position.trader_id AS traderId',
        'position.stock_id AS stockId',
        'position.quantity AS quantity',
        'position.avg_buy_price AS avgBuyPrice',
        'position.total_invested AS totalInvested',
        'position.last_updated AS lastUpdated',
        'stock.symbol AS symbol',
      ])
      .where('position.trader_id = :traderId', { traderId })
      .orderBy('stock.symbol', 'ASC')
      .getRawMany<{
        id: string;
        traderId: string;
        stockId: string;
        quantity: number;
        avgBuyPrice: string;
        totalInvested: string;
        lastUpdated: Date;
        symbol: string | null;
      }>();

    return rows.map((row) => ({
      id: row.id,
      traderId: row.traderId,
      stockId: row.stockId,
      quantity: Number(row.quantity),
      avgBuyPrice: row.avgBuyPrice,
      totalInvested: row.totalInvested,
      lastUpdated: row.lastUpdated,
      symbol: row.symbol,
    }));
  }
}
