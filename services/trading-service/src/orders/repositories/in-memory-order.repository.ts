import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { roundMoney } from '../../common/money';
import { TradingOrder } from '../entities/trading-order';
import type {
  CreateLimitBuyOrderCommand,
  CreateLimitSellOrderCommand,
  CreateMarketBuyOrderCommand,
  CreateMarketSellOrderCommand,
  OrderCreationResult,
  OrderRepository,
} from './order.repository';

@Injectable()
export class InMemoryOrderRepository implements OrderRepository {
  private availableAmount = 1000;
  private reservedAmount = 0;
  readonly orders: TradingOrder[] = [];

  createMarketBuyOrder(
    command: CreateMarketBuyOrderCommand,
  ): Promise<OrderCreationResult> {
    return this.createBuyOrder(command, 'MARKET', 'PENDING_EXECUTION');
  }

  createLimitBuyOrder(
    command: CreateLimitBuyOrderCommand,
  ): Promise<OrderCreationResult> {
    return this.createBuyOrder(command, 'LIMIT', 'PENDING_CONDITION');
  }

  createMarketSellOrder(
    command: CreateMarketSellOrderCommand,
  ): Promise<OrderCreationResult> {
    return this.createSellOrder(command, 'MARKET', 'PENDING_EXECUTION');
  }

  createLimitSellOrder(
    command: CreateLimitSellOrderCommand,
  ): Promise<OrderCreationResult> {
    return this.createSellOrder(command, 'LIMIT', 'PENDING_CONDITION');
  }

  private createSellOrder(
    command: CreateMarketSellOrderCommand | CreateLimitSellOrderCommand,
    orderType: 'MARKET' | 'LIMIT',
    status: 'PENDING_EXECUTION' | 'PENDING_CONDITION',
  ): Promise<OrderCreationResult> {
    const order = this.createOrder(
      command,
      'SELL',
      orderType,
      status,
      0,
      'limitPrice' in command ? command.limitPrice : undefined,
      command.stockId,
    );
    this.orders.push(order);

    return Promise.resolve({
      approved: true,
      order,
      requiredQuantity: command.quantity,
    });
  }

  private createBuyOrder(
    command: CreateMarketBuyOrderCommand | CreateLimitBuyOrderCommand,
    orderType: 'MARKET' | 'LIMIT',
    status: 'PENDING_EXECUTION' | 'PENDING_CONDITION',
  ): Promise<OrderCreationResult> {
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

    const order = this.createOrder(
      command,
      'BUY',
      orderType,
      status,
      this.reservedAmount,
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

  private createOrder(
    command:
      | CreateMarketBuyOrderCommand
      | CreateLimitBuyOrderCommand
      | CreateMarketSellOrderCommand
      | CreateLimitSellOrderCommand,
    side: 'BUY' | 'SELL',
    orderType: 'MARKET' | 'LIMIT',
    status: 'PENDING_EXECUTION' | 'PENDING_CONDITION',
    reservedAmount: number,
    limitPrice?: number,
    stockId?: string,
  ): TradingOrder {
    const unitPrice =
      'limitPrice' in command ? command.limitPrice : command.estimatedUnitPrice;

    return new TradingOrder(
      String(this.orders.length + 1),
      randomUUID(),
      command.traderId,
      side,
      orderType,
      status,
      command.symbol,
      command.exchangeId,
      command.quantity,
      unitPrice,
      command.grossAmount,
      reservedAmount,
      command.currency,
      new Date().toISOString(),
      limitPrice,
      undefined,
      stockId,
    );
  }
}
