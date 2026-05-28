import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EXTERNAL_BROKER_CLIENT,
  BrokerOrderSubmissionError,
  type BrokerOrderStatusResponse,
  type ExternalBrokerClient,
} from '../../executions/clients/external-broker.client';
import { calculatePlatformCommission } from '../../common/commission';
import { roundMoney } from '../../common/money';
import type { OrderStatus } from '../../orders/entities/trading-order.entity';
import {
  PORTFOLIO_SETTLEMENT_CLIENT,
  PortfolioSettlementError,
  type PortfolioSettlementClient,
} from '../clients/portfolio-settlement.client';
import {
  TRADING_NOTIFICATION_CLIENT,
  type TradingNotificationClient,
  type TradingNotificationRecipient,
} from '../clients/trading-notification.client';
import type { OrderSettlement } from '../entities/order-settlement.entity';
import {
  ORDER_SETTLEMENT_REPOSITORY,
  type OrderSettlementRepository,
} from '../repositories/order-settlement.repository';

export type SyncOrderSettlementInput = {
  orderReference: string;
  authorizationHeader?: string;
  actorId?: string;
  notificationRecipient?: TradingNotificationRecipient;
};

const TERMINAL_STATUSES: readonly OrderStatus[] = [
  'EXECUTED',
  'REJECTED',
  'CANCELLED',
  'FAILED',
];

@Injectable()
export class OrderSettlementService {
  constructor(
    @Inject(ORDER_SETTLEMENT_REPOSITORY)
    private readonly settlementRepository: OrderSettlementRepository,
    @Inject(EXTERNAL_BROKER_CLIENT)
    private readonly brokerClient: ExternalBrokerClient,
    @Inject(TRADING_NOTIFICATION_CLIENT)
    private readonly notificationClient: TradingNotificationClient,
    @Inject(PORTFOLIO_SETTLEMENT_CLIENT)
    private readonly portfolioClient: PortfolioSettlementClient,
  ) {}

  async syncOrderSettlement(
    input: SyncOrderSettlementInput,
  ): Promise<OrderSettlement> {
    const orderReference = input.orderReference.trim();
    if (!orderReference) {
      throw new NotFoundException('orderReference is required');
    }

    const context =
      await this.settlementRepository.findSettlementContext(orderReference);
    if (!context) {
      throw new NotFoundException('Order or broker execution was not found');
    }
    if (TERMINAL_STATUSES.includes(context.order.status)) {
      throw new ConflictException(
        `Order already has terminal status ${context.order.status}`,
      );
    }

    const brokerStatus = await this.getBrokerStatus(
      context.execution.externalOrderId,
    );
    const nextStatus = this.mapBrokerStatus(brokerStatus.brokerStatus);
    const reason = `Broker ${brokerStatus.brokerName} returned ${brokerStatus.brokerStatus}`;
    const filledQuantity = this.resolveFilledQuantity(context, brokerStatus);
    const averageFilledPrice =
      brokerStatus.averageFilledPrice ?? context.order.estimatedUnitPrice;
    const settledAmount = roundMoney(filledQuantity * averageFilledPrice);
    const commissionAmount =
      nextStatus === 'EXECUTED'
        ? calculatePlatformCommission(settledAmount)
        : 0;
    const netAmount =
      context.order.side === 'BUY'
        ? roundMoney(settledAmount + commissionAmount)
        : roundMoney(settledAmount - commissionAmount);
    const portfolioSettlement =
      nextStatus === 'EXECUTED'
        ? await this.applyPortfolioSettlement({
            authorizationHeader: input.authorizationHeader,
            traderId: context.order.traderId,
            stockId: context.order.stockId,
            side: context.order.side,
            quantity: filledQuantity,
            executionPrice: averageFilledPrice,
            grossAmount: settledAmount,
            netAmount,
            reservedAmount: context.order.reservedAmount,
            currency: context.order.currency,
            orderReference,
            externalOrderId: brokerStatus.externalOrderId,
            executedAt: new Date().toISOString(),
          })
        : {
            portfolioUpdated: false,
            fundsUpdated: false,
          };
    const notification =
      nextStatus === 'EXECUTED'
        ? await this.notificationClient.sendOrderExecuted({
            orderReference,
            recipient: input.notificationRecipient,
            occurredAt: new Date().toISOString(),
          })
        : {
            delivered: false,
            reason: 'Order is not executed yet',
          };

    return this.settlementRepository.settleBrokerStatus({
      context,
      brokerStatus,
      nextStatus,
      actorId: input.actorId?.trim() || brokerStatus.brokerName,
      reason,
      commissionAmount,
      portfolioUpdated: portfolioSettlement.portfolioUpdated,
      fundsUpdated: portfolioSettlement.fundsUpdated,
      notification,
    });
  }

  private async getBrokerStatus(
    externalOrderId: string,
  ): Promise<BrokerOrderStatusResponse> {
    try {
      return await this.brokerClient.getOrderStatus(externalOrderId);
    } catch (error) {
      if (error instanceof BrokerOrderSubmissionError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  private mapBrokerStatus(brokerStatus: string): OrderStatus {
    const normalized = brokerStatus.trim().toLowerCase();
    if (normalized === 'filled') {
      return 'EXECUTED';
    }
    if (normalized === 'canceled' || normalized === 'cancelled') {
      return 'CANCELLED';
    }
    if (normalized === 'rejected') {
      return 'REJECTED';
    }
    if (normalized === 'expired' || normalized === 'stopped') {
      return 'FAILED';
    }
    return 'SENT_TO_BROKER';
  }

  private resolveFilledQuantity(
    context: {
      order: { quantity: number };
    },
    brokerStatus: BrokerOrderStatusResponse,
  ): number {
    return brokerStatus.filledQuantity > 0
      ? brokerStatus.filledQuantity
      : context.order.quantity;
  }

  private async applyPortfolioSettlement(
    command: Parameters<PortfolioSettlementClient['applyExecutedOrder']>[0],
  ) {
    try {
      return await this.portfolioClient.applyExecutedOrder(command);
    } catch (error) {
      if (error instanceof PortfolioSettlementError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
