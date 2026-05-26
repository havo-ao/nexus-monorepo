import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { roundMoney } from '../../common/money';
import { MarketValidationService } from '../../market-validation/services/market-validation.service';
import { TradingOrder } from '../entities/trading-order';
import { ORDER_REPOSITORY } from '../repositories/order.repository';
import type { OrderRepository } from '../repositories/order.repository';

export type CreateMarketBuyOrderInput = {
  traderId: string;
  symbol: string;
  exchangeId: string;
  quantity: number;
  estimatedUnitPrice: number;
  currency?: string;
  marketEvaluatedAt?: string;
};

export type CreateLimitBuyOrderInput = {
  traderId: string;
  symbol: string;
  exchangeId: string;
  quantity: number;
  limitPrice: number;
  currency?: string;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly marketValidationService: MarketValidationService,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
  ) {}

  async createMarketBuyOrder(
    input: CreateMarketBuyOrderInput,
  ): Promise<TradingOrder> {
    this.assertValidMarketBuyOrder(input);

    const marketValidation =
      await this.marketValidationService.validateMarketStatus(
        input.exchangeId,
        input.marketEvaluatedAt,
      );

    if (!marketValidation.canOperate) {
      throw new ConflictException(
        marketValidation.reason ??
          `Market cannot operate with status ${marketValidation.marketStatus}`,
      );
    }

    const grossAmount = roundMoney(input.quantity * input.estimatedUnitPrice);
    const result = await this.orderRepository.createMarketBuyOrder({
      traderId: input.traderId.trim(),
      symbol: input.symbol.trim().toUpperCase(),
      exchangeId: input.exchangeId.trim(),
      quantity: input.quantity,
      estimatedUnitPrice: input.estimatedUnitPrice,
      grossAmount,
      currency: input.currency?.trim().toUpperCase() || 'USD',
    });

    if (!result.approved || !result.order) {
      throw new ConflictException(result.reason ?? 'Unable to create order');
    }

    return result.order;
  }

  private assertValidMarketBuyOrder(input: CreateMarketBuyOrderInput): void {
    this.assertValidBuyOrderBase(input);

    if (
      !Number.isFinite(input.estimatedUnitPrice) ||
      input.estimatedUnitPrice <= 0
    ) {
      throw new BadRequestException(
        'estimatedUnitPrice must be greater than zero',
      );
    }
  }

  async createLimitBuyOrder(
    input: CreateLimitBuyOrderInput,
  ): Promise<TradingOrder> {
    this.assertValidBuyOrderBase(input);

    if (!Number.isFinite(input.limitPrice) || input.limitPrice <= 0) {
      throw new BadRequestException('limitPrice must be greater than zero');
    }

    const grossAmount = roundMoney(input.quantity * input.limitPrice);
    const result = await this.orderRepository.createLimitBuyOrder({
      traderId: input.traderId.trim(),
      symbol: input.symbol.trim().toUpperCase(),
      exchangeId: input.exchangeId.trim(),
      quantity: input.quantity,
      limitPrice: input.limitPrice,
      grossAmount,
      currency: input.currency?.trim().toUpperCase() || 'USD',
    });

    if (!result.approved || !result.order) {
      throw new ConflictException(result.reason ?? 'Unable to create order');
    }

    return result.order;
  }

  private assertValidBuyOrderBase(
    input: Pick<
      CreateMarketBuyOrderInput,
      'traderId' | 'symbol' | 'exchangeId' | 'quantity'
    >,
  ): void {
    if (!input.traderId || input.traderId.trim().length === 0) {
      throw new BadRequestException('traderId is required');
    }

    if (!input.symbol || input.symbol.trim().length === 0) {
      throw new BadRequestException('symbol is required');
    }

    if (!input.exchangeId || input.exchangeId.trim().length === 0) {
      throw new BadRequestException('exchangeId is required');
    }

    if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
      throw new BadRequestException('quantity must be greater than zero');
    }
  }
}
