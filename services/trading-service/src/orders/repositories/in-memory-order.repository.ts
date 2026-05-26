import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { roundMoney } from '../../common/money';
import { TradingOrder } from '../entities/trading-order';
import type {
  CreateLimitBuyOrderCommand,
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
    return this.createBuyOrder(command, 'MARKET', 'PENDING_EXECUTION');
  }

  createLimitBuyOrder(
    command: CreateLimitBuyOrderCommand,
  ): Promise<MarketBuyOrderCreationResult> {
    return this.createBuyOrder(command, 'LIMIT', 'PENDING_CONDITION');
  }

  private createBuyOrder(
    command: CreateMarketBuyOrderCommand | CreateLimitBuyOrderCommand,
    orderType: 'MARKET' | 'LIMIT',
    status: 'PENDING_EXECUTION' | 'PENDING_CONDITION',
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
      orderType,
      status,
      command.symbol,
      command.exchangeId,
      command.quantity,
      'estimatedUnitPrice' in command
        ? command.estimatedUnitPrice
        : command.limitPrice,
      command.grossAmount,
      this.reservedAmount,
      command.currency,
      now,
      'limitPrice' in command ? command.limitPrice : undefined,
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
