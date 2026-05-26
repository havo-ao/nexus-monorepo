import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { roundMoney } from '../../common/money';
import { TradingOrder } from '../entities/trading-order';
import type {
  CreateMarketBuyOrderCommand,
  MarketBuyOrderCreationResult,
  OrderRepository,
} from './order.repository';

@Injectable()
export class InMemoryOrderRepository implements OrderRepository {
  private availableAmount = 1000;
  private reservedAmount = 0;
  readonly orders: TradingOrder[] = [];

  createMarketBuyOrder(
    command: CreateMarketBuyOrderCommand,
  ): Promise<MarketBuyOrderCreationResult> {
    const availableAmount = roundMoney(this.availableAmount);

    if (availableAmount < command.grossAmount) {
      return Promise.resolve({
        approved: false,
        reason: 'Insufficient available funds',
        availableAmount,
        requiredAmount: command.grossAmount,
      });
    }

    this.availableAmount = roundMoney(availableAmount - command.grossAmount);
    this.reservedAmount = roundMoney(this.reservedAmount + command.grossAmount);

    const now = new Date().toISOString();
    const order = new TradingOrder(
      String(this.orders.length + 1),
      randomUUID(),
      command.traderId,
      'BUY',
      'MARKET',
      'PENDING_EXECUTION',
      command.symbol,
      command.exchangeId,
      command.quantity,
      command.estimatedUnitPrice,
      command.grossAmount,
      this.reservedAmount,
      command.currency,
      now,
    );

    this.orders.push(order);

    return Promise.resolve({
      approved: true,
      order,
      availableAmount,
      requiredAmount: command.grossAmount,
    });
  }
}
