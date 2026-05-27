import { Injectable } from '@nestjs/common';
import { roundMoney } from '../../common/money';
import { OrderSettlement } from '../entities/order-settlement.entity';
import type {
  OrderSettlementRepository,
  SettleBrokerStatusCommand,
  SettlementContext,
} from './order-settlement.repository';

@Injectable()
export class InMemoryOrderSettlementRepository implements OrderSettlementRepository {
  context: SettlementContext | null = null;
  readonly settlements: OrderSettlement[] = [];

  findSettlementContext(): Promise<SettlementContext | null> {
    return Promise.resolve(this.context);
  }

  settleBrokerStatus(
    command: SettleBrokerStatusCommand,
  ): Promise<OrderSettlement> {
    const filledQuantity =
      command.brokerStatus.filledQuantity || command.context.order.quantity;
    const averageFilledPrice =
      command.brokerStatus.averageFilledPrice ??
      command.context.order.estimatedUnitPrice;
    const settledAmount = roundMoney(filledQuantity * averageFilledPrice);
    const commissionAmount = command.commissionAmount;
    const netAmount =
      command.context.order.side === 'BUY'
        ? roundMoney(settledAmount + commissionAmount)
        : roundMoney(settledAmount - commissionAmount);
    const settlement = new OrderSettlement(
      command.context.order.id,
      command.context.order.orderReference,
      command.context.order.traderId,
      command.context.order.side,
      command.nextStatus,
      command.context.order.symbol,
      command.context.order.quantity,
      filledQuantity,
      averageFilledPrice,
      settledAmount,
      commissionAmount,
      netAmount,
      command.context.order.currency,
      command.brokerStatus.brokerName,
      command.brokerStatus.externalOrderId,
      command.brokerStatus.brokerStatus,
      command.portfolioUpdated,
      command.fundsUpdated,
      command.notification.delivered,
      new Date().toISOString(),
    );
    this.settlements.push(settlement);
    return Promise.resolve(settlement);
  }
}
