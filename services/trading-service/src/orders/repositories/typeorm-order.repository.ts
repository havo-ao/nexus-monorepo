import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource, EntityManager } from 'typeorm';
import { roundMoney } from '../../common/money';
import { FundsValidationEvent } from '../../funds-validation/entities/funds-validation-event.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { OrderStatusEventEntity } from '../entities/order-status-event.entity';
import { TradingOrder } from '../entities/trading-order';
import { TradingOrderEntity } from '../entities/trading-order.entity';
import type {
  CreateMarketBuyOrderCommand,
  MarketBuyOrderCreationResult,
  OrderRepository,
} from './order.repository';

@Injectable()
export class TypeOrmOrderRepository implements OrderRepository {
  constructor(private readonly dataSource: DataSource) {}

  createMarketBuyOrder(
    command: CreateMarketBuyOrderCommand,
  ): Promise<MarketBuyOrderCreationResult> {
    return this.dataSource.transaction((manager) =>
      this.createMarketBuyOrderInTransaction(manager, command),
    );
  }

  private async createMarketBuyOrderInTransaction(
    manager: EntityManager,
    command: CreateMarketBuyOrderCommand,
  ): Promise<MarketBuyOrderCreationResult> {
    const walletRepository = manager.getRepository(Wallet);
    const fundsEventRepository = manager.getRepository(FundsValidationEvent);
    const orderRepository = manager.getRepository(TradingOrderEntity);
    const statusEventRepository = manager.getRepository(OrderStatusEventEntity);

    const wallet = await walletRepository.findOne({
      where: { traderId: command.traderId },
      lock: { mode: 'pessimistic_write' },
    });

    const availableAmount = roundMoney(
      wallet ? Number(wallet.availableBalance) : 0,
    );
    const currentReservedAmount = roundMoney(
      wallet ? Number(wallet.reservedBalance) : 0,
    );

    if (!wallet || availableAmount < command.grossAmount) {
      await fundsEventRepository.save(
        this.toFundsEvent({
          approved: false,
          traderId: command.traderId,
          availableAmount,
          requiredAmount: command.grossAmount,
          reservedAmount: currentReservedAmount,
          reason: 'Insufficient available funds',
        }),
      );

      return {
        approved: false,
        reason: 'Insufficient available funds',
        availableAmount,
        requiredAmount: command.grossAmount,
      };
    }

    const reservedAmount = roundMoney(
      currentReservedAmount + command.grossAmount,
    );
    wallet.availableBalance = this.toDecimal(
      availableAmount - command.grossAmount,
    );
    wallet.reservedBalance = this.toDecimal(reservedAmount);
    await walletRepository.save(wallet);

    await fundsEventRepository.save(
      this.toFundsEvent({
        approved: true,
        traderId: command.traderId,
        availableAmount,
        requiredAmount: command.grossAmount,
        reservedAmount,
      }),
    );

    const orderEntity = new TradingOrderEntity();
    orderEntity.orderReference = randomUUID();
    orderEntity.traderId = command.traderId;
    orderEntity.side = 'BUY';
    orderEntity.orderType = 'MARKET';
    orderEntity.status = 'PENDING_EXECUTION';
    orderEntity.symbol = command.symbol;
    orderEntity.exchangeId = command.exchangeId;
    orderEntity.quantity = command.quantity.toFixed(6);
    orderEntity.estimatedUnitPrice = this.toDecimal(command.estimatedUnitPrice);
    orderEntity.grossAmount = this.toDecimal(command.grossAmount);
    orderEntity.reservedAmount = this.toDecimal(command.grossAmount);
    orderEntity.currency = command.currency;

    const savedOrder = await orderRepository.save(orderEntity);

    const statusEvent = new OrderStatusEventEntity();
    statusEvent.orderId = savedOrder.id;
    statusEvent.orderReference = savedOrder.orderReference;
    statusEvent.toStatus = 'PENDING_EXECUTION';
    statusEvent.actorType = 'TRADER';
    statusEvent.actorId = command.traderId;
    statusEvent.reason = 'Market buy order created after funds reservation';
    await statusEventRepository.save(statusEvent);

    return {
      approved: true,
      order: this.toDomain(savedOrder),
      availableAmount,
      requiredAmount: command.grossAmount,
    };
  }

  private toFundsEvent(result: {
    approved: boolean;
    traderId: string;
    availableAmount: number;
    requiredAmount: number;
    reservedAmount: number;
    reason?: string;
  }): FundsValidationEvent {
    const event = new FundsValidationEvent();
    event.traderId = result.traderId;
    event.validationType = 'BUY_ORDER_FUNDS_RESERVATION';
    event.approved = result.approved;
    event.requiredAmount = this.toDecimal(result.requiredAmount);
    event.availableAmount = this.toDecimal(result.availableAmount);
    event.reservedAmount = this.toDecimal(result.reservedAmount);
    event.reason = result.reason;
    return event;
  }

  private toDomain(entity: TradingOrderEntity): TradingOrder {
    return new TradingOrder(
      entity.id,
      entity.orderReference,
      entity.traderId,
      entity.side,
      entity.orderType,
      entity.status,
      entity.symbol,
      entity.exchangeId,
      Number(entity.quantity),
      Number(entity.estimatedUnitPrice),
      Number(entity.grossAmount),
      Number(entity.reservedAmount),
      entity.currency,
      entity.createdAt.toISOString(),
      entity.rejectionReason,
    );
  }

  private toDecimal(value: number): string {
    return roundMoney(value).toFixed(2);
  }
}
