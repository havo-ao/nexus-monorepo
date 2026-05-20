import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  calculateHoldingAfterBuy,
  calculateHoldingAfterSell,
  roundMoney,
  toMoneyString,
} from '../entities/position-holding-calculator';
import { PortfolioPositionMovement } from '../entities/portfolio-position-movement.entity';
import { PortfolioPosition } from '../entities/portfolio-position.entity';

export interface ExecutedBuyInput {
  traderId: string;
  stockId: string;
  quantity: number;
  executionPrice: number;
  sourceOrderId?: string;
  sourceTransactionId?: string;
  executedAt: Date;
}

export interface ExecutedSellInput {
  traderId: string;
  stockId: string;
  quantity: number;
  executionPrice: number;
  sourceOrderId?: string;
  sourceTransactionId?: string;
  executedAt: Date;
}

@Injectable()
export class PortfolioPositionsRepository {
  constructor(@Optional() private readonly dataSource?: DataSource) {}

  async applyExecutedBuy(input: ExecutedBuyInput): Promise<PortfolioPosition> {
    const grossAmount = roundMoney(input.quantity * input.executionPrice);

    if (!this.dataSource) {
      return {
        id: '0',
        traderId: input.traderId,
        stockId: input.stockId,
        quantity: input.quantity,
        avgBuyPrice: toMoneyString(input.executionPrice),
        totalInvested: toMoneyString(grossAmount),
        lastUpdated: input.executedAt,
        symbol: null,
      };
    }

    return this.dataSource.transaction(async (manager) => {
      const existingPosition = await this.findPositionForUpdate(
        manager,
        input.traderId,
        input.stockId,
      );
      const position = existingPosition
        ? await this.increasePosition(manager, existingPosition, input)
        : await this.createPosition(manager, input, grossAmount);

      await this.recordMovement(manager, input, position.id, grossAmount);

      return position;
    });
  }

  async applyExecutedSell(
    input: ExecutedSellInput,
  ): Promise<PortfolioPosition> {
    const grossAmount = roundMoney(input.quantity * input.executionPrice);

    if (!this.dataSource) {
      return {
        id: '0',
        traderId: input.traderId,
        stockId: input.stockId,
        quantity: 0,
        avgBuyPrice: toMoneyString(0),
        totalInvested: toMoneyString(0),
        lastUpdated: input.executedAt,
        symbol: null,
      };
    }

    return this.dataSource.transaction(async (manager) => {
      const existingPosition = await this.findPositionForUpdate(
        manager,
        input.traderId,
        input.stockId,
      );

      if (!existingPosition) {
        throw new BadRequestException(
          'Cannot record an executed sell without a position',
        );
      }

      if (input.quantity > Number(existingPosition.quantity)) {
        throw new BadRequestException(
          'Cannot sell more shares than the current holding',
        );
      }

      const position = await this.decreasePosition(
        manager,
        existingPosition,
        input,
      );

      await this.recordMovement(
        manager,
        input,
        position.id,
        grossAmount,
        'SELL',
      );

      return position;
    });
  }

  async findByTraderIdAndPositionId(
    traderId: string,
    positionId: string,
  ): Promise<PortfolioPosition | null> {
    if (!this.dataSource) {
      return null;
    }

    const rows = await this.findRawPositions(traderId, positionId);
    const [position] = this.mapRows(rows);

    return position ?? null;
  }

  async findByTraderId(traderId: string): Promise<PortfolioPosition[]> {
    if (!this.dataSource) {
      return [];
    }

    const rows = await this.findRawPositions(traderId);

    return this.mapRows(rows);
  }

  private async findRawPositions(
    traderId: string,
    positionId?: string,
  ): Promise<
    {
      id: string;
      traderId: string;
      stockId: string;
      quantity: number;
      avgBuyPrice: string;
      totalInvested: string;
      lastUpdated: Date;
      symbol: string | null;
    }[]
  > {
    const query = this.dataSource!.getRepository(PortfolioPosition)
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
      .orderBy('stock.symbol', 'ASC');

    if (positionId) {
      query.andWhere('position.id = :positionId', { positionId });
    }

    return query.getRawMany();
  }

  private mapRows(
    rows: {
      id: string;
      traderId: string;
      stockId: string;
      quantity: number;
      avgBuyPrice: string;
      totalInvested: string;
      lastUpdated: Date;
      symbol: string | null;
    }[],
  ): PortfolioPosition[] {
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

  private async findPositionForUpdate(
    manager: EntityManager,
    traderId: string,
    stockId: string,
  ): Promise<PortfolioPosition | null> {
    const row = await manager
      .getRepository(PortfolioPosition)
      .createQueryBuilder('position')
      .setLock('pessimistic_write')
      .where('position.trader_id = :traderId', { traderId })
      .andWhere('position.stock_id = :stockId', { stockId })
      .getOne();

    return row ?? null;
  }

  private async increasePosition(
    manager: EntityManager,
    position: PortfolioPosition,
    input: ExecutedBuyInput,
  ): Promise<PortfolioPosition> {
    const updatedHolding = calculateHoldingAfterBuy(
      {
        quantity: Number(position.quantity),
        totalInvested: Number(position.totalInvested),
      },
      {
        quantity: input.quantity,
        executionPrice: input.executionPrice,
      },
    );

    await manager.getRepository(PortfolioPosition).update(position.id, {
      quantity: updatedHolding.quantity,
      avgBuyPrice: toMoneyString(updatedHolding.averageBuyPrice),
      totalInvested: toMoneyString(updatedHolding.totalInvested),
      lastUpdated: input.executedAt,
    });

    return {
      ...position,
      quantity: updatedHolding.quantity,
      avgBuyPrice: toMoneyString(updatedHolding.averageBuyPrice),
      totalInvested: toMoneyString(updatedHolding.totalInvested),
      lastUpdated: input.executedAt,
    };
  }

  private async createPosition(
    manager: EntityManager,
    input: ExecutedBuyInput,
    grossAmount: number,
  ): Promise<PortfolioPosition> {
    const insertResult = await manager.getRepository(PortfolioPosition).insert({
      traderId: input.traderId,
      stockId: input.stockId,
      quantity: input.quantity,
      avgBuyPrice: toMoneyString(input.executionPrice),
      totalInvested: toMoneyString(grossAmount),
      lastUpdated: input.executedAt,
    });

    return {
      id: String(insertResult.identifiers[0].id),
      traderId: input.traderId,
      stockId: input.stockId,
      quantity: input.quantity,
      avgBuyPrice: toMoneyString(input.executionPrice),
      totalInvested: toMoneyString(grossAmount),
      lastUpdated: input.executedAt,
      symbol: null,
    };
  }

  private async recordMovement(
    manager: EntityManager,
    input: ExecutedBuyInput | ExecutedSellInput,
    positionId: string,
    grossAmount: number,
    movementType: 'BUY' | 'SELL' = 'BUY',
  ): Promise<void> {
    await manager.getRepository(PortfolioPositionMovement).insert({
      traderId: input.traderId,
      stockId: input.stockId,
      positionId,
      movementType,
      quantity: input.quantity,
      executionPrice: toMoneyString(input.executionPrice),
      grossAmount: toMoneyString(grossAmount),
      sourceOrderId: input.sourceOrderId ?? null,
      sourceTransactionId: input.sourceTransactionId ?? null,
      occurredAt: input.executedAt,
      createdAt: new Date(),
    });
  }

  private async decreasePosition(
    manager: EntityManager,
    position: PortfolioPosition,
    input: ExecutedSellInput,
  ): Promise<PortfolioPosition> {
    const updatedHolding = calculateHoldingAfterSell(
      {
        quantity: Number(position.quantity),
        totalInvested: Number(position.totalInvested),
      },
      {
        quantity: input.quantity,
      },
    );

    if (updatedHolding.closed) {
      await manager.getRepository(PortfolioPosition).delete(position.id);
    } else {
      await manager.getRepository(PortfolioPosition).update(position.id, {
        quantity: updatedHolding.quantity,
        avgBuyPrice: toMoneyString(updatedHolding.averageBuyPrice),
        totalInvested: toMoneyString(updatedHolding.totalInvested),
        lastUpdated: input.executedAt,
      });
    }

    return {
      ...position,
      quantity: updatedHolding.quantity,
      avgBuyPrice: toMoneyString(updatedHolding.averageBuyPrice),
      totalInvested: toMoneyString(updatedHolding.totalInvested),
      lastUpdated: input.executedAt,
    };
  }
}
