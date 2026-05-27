import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { roundMoney } from '../../common/money';
import { HoldingsValidationService } from '../../holdings-validation/services/holdings-validation.service';
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
  queueWhenMarketClosed?: boolean;
};

export type CreateLimitBuyOrderInput = {
  traderId: string;
  symbol: string;
  exchangeId: string;
  quantity: number;
  limitPrice: number;
  currency?: string;
};

export type CreateMarketSellOrderInput = {
  traderId: string;
  stockId: string;
  symbol: string;
  exchangeId: string;
  quantity: number;
  estimatedUnitPrice: number;
  currency?: string;
  marketEvaluatedAt?: string;
  queueWhenMarketClosed?: boolean;
};

export type CreateLimitSellOrderInput = {
  traderId: string;
  stockId: string;
  symbol: string;
  exchangeId: string;
  quantity: number;
  limitPrice: number;
  currency?: string;
};

export type CreateStopLossOrderInput = {
  traderId: string;
  stockId: string;
  symbol: string;
  exchangeId: string;
  quantity: number;
  stopPrice: number;
  currency?: string;
};

export type CreateTakeProfitOrderInput = {
  traderId: string;
  stockId: string;
  symbol: string;
  exchangeId: string;
  quantity: number;
  targetPrice: number;
  currency?: string;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly marketValidationService: MarketValidationService,
    private readonly holdingsValidationService: HoldingsValidationService,
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

    const queueForMarketOpen =
      marketValidation.marketStatus === 'CLOSED' &&
      input.queueWhenMarketClosed !== false;

    if (!marketValidation.canOperate && !queueForMarketOpen) {
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
      ...(queueForMarketOpen
        ? {
            initialStatus: 'PENDING_MARKET_OPEN' as const,
            statusReason: 'Market buy order queued until market opens',
          }
        : {}),
    });

    if (!result.approved || !result.order) {
      throw new ConflictException(result.reason ?? 'Unable to create order');
    }

    return result.order;
  }

  private assertValidMarketBuyOrder(input: CreateMarketBuyOrderInput): void {
    this.assertValidOrderBase(input);

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
    this.assertValidOrderBase(input);

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

  async createMarketSellOrder(
    input: CreateMarketSellOrderInput,
  ): Promise<TradingOrder> {
    this.assertValidMarketSellOrder(input);

    const marketValidation =
      await this.marketValidationService.validateMarketStatus(
        input.exchangeId,
        input.marketEvaluatedAt,
      );

    const queueForMarketOpen =
      marketValidation.marketStatus === 'CLOSED' &&
      input.queueWhenMarketClosed !== false;

    if (!marketValidation.canOperate && !queueForMarketOpen) {
      throw new ConflictException(
        marketValidation.reason ??
          `Market cannot operate with status ${marketValidation.marketStatus}`,
      );
    }

    const holdingsValidation =
      await this.holdingsValidationService.validateSellHoldings({
        traderId: input.traderId,
        stockId: input.stockId,
        symbol: input.symbol,
        quantity: input.quantity,
      });

    if (!holdingsValidation.approved) {
      throw new ConflictException(
        holdingsValidation.reason ?? 'Insufficient available holdings',
      );
    }

    const grossAmount = roundMoney(input.quantity * input.estimatedUnitPrice);
    const result = await this.orderRepository.createMarketSellOrder({
      traderId: input.traderId.trim(),
      stockId: input.stockId.trim(),
      symbol: input.symbol.trim().toUpperCase(),
      exchangeId: input.exchangeId.trim(),
      quantity: input.quantity,
      estimatedUnitPrice: input.estimatedUnitPrice,
      grossAmount,
      currency: input.currency?.trim().toUpperCase() || 'USD',
      ...(queueForMarketOpen
        ? {
            initialStatus: 'PENDING_MARKET_OPEN' as const,
            statusReason: 'Market sell order queued until market opens',
          }
        : {}),
    });

    if (!result.approved || !result.order) {
      throw new ConflictException(result.reason ?? 'Unable to create order');
    }

    return result.order;
  }

  async createLimitSellOrder(
    input: CreateLimitSellOrderInput,
  ): Promise<TradingOrder> {
    this.assertValidLimitSellOrder(input);

    const holdingsValidation =
      await this.holdingsValidationService.validateSellHoldings({
        traderId: input.traderId,
        stockId: input.stockId,
        symbol: input.symbol,
        quantity: input.quantity,
      });

    if (!holdingsValidation.approved) {
      throw new ConflictException(
        holdingsValidation.reason ?? 'Insufficient available holdings',
      );
    }

    const grossAmount = roundMoney(input.quantity * input.limitPrice);
    const result = await this.orderRepository.createLimitSellOrder({
      traderId: input.traderId.trim(),
      stockId: input.stockId.trim(),
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

  async createStopLossOrder(
    input: CreateStopLossOrderInput,
  ): Promise<TradingOrder> {
    this.assertValidStopLossOrder(input);

    const holdingsValidation =
      await this.holdingsValidationService.validateSellHoldings({
        traderId: input.traderId,
        stockId: input.stockId,
        symbol: input.symbol,
        quantity: input.quantity,
      });

    if (!holdingsValidation.approved) {
      throw new ConflictException(
        holdingsValidation.reason ?? 'Insufficient available holdings',
      );
    }

    const grossAmount = roundMoney(input.quantity * input.stopPrice);
    const result = await this.orderRepository.createStopLossOrder({
      traderId: input.traderId.trim(),
      stockId: input.stockId.trim(),
      symbol: input.symbol.trim().toUpperCase(),
      exchangeId: input.exchangeId.trim(),
      quantity: input.quantity,
      stopPrice: input.stopPrice,
      grossAmount,
      currency: input.currency?.trim().toUpperCase() || 'USD',
    });

    if (!result.approved || !result.order) {
      throw new ConflictException(result.reason ?? 'Unable to create order');
    }

    return result.order;
  }

  async createTakeProfitOrder(
    input: CreateTakeProfitOrderInput,
  ): Promise<TradingOrder> {
    this.assertValidTakeProfitOrder(input);

    const holdingsValidation =
      await this.holdingsValidationService.validateSellHoldings({
        traderId: input.traderId,
        stockId: input.stockId,
        symbol: input.symbol,
        quantity: input.quantity,
      });

    if (!holdingsValidation.approved) {
      throw new ConflictException(
        holdingsValidation.reason ?? 'Insufficient available holdings',
      );
    }

    const grossAmount = roundMoney(input.quantity * input.targetPrice);
    const result = await this.orderRepository.createTakeProfitOrder({
      traderId: input.traderId.trim(),
      stockId: input.stockId.trim(),
      symbol: input.symbol.trim().toUpperCase(),
      exchangeId: input.exchangeId.trim(),
      quantity: input.quantity,
      targetPrice: input.targetPrice,
      grossAmount,
      currency: input.currency?.trim().toUpperCase() || 'USD',
    });

    if (!result.approved || !result.order) {
      throw new ConflictException(result.reason ?? 'Unable to create order');
    }

    return result.order;
  }

  private assertValidMarketSellOrder(input: CreateMarketSellOrderInput): void {
    this.assertValidOrderBase(input);
    this.assertValidSellFields(input);

    if (
      !Number.isFinite(input.estimatedUnitPrice) ||
      input.estimatedUnitPrice <= 0
    ) {
      throw new BadRequestException(
        'estimatedUnitPrice must be greater than zero',
      );
    }
  }

  private assertValidLimitSellOrder(input: CreateLimitSellOrderInput): void {
    this.assertValidOrderBase(input);
    this.assertValidSellFields(input);

    if (!Number.isFinite(input.limitPrice) || input.limitPrice <= 0) {
      throw new BadRequestException('limitPrice must be greater than zero');
    }
  }

  private assertValidStopLossOrder(input: CreateStopLossOrderInput): void {
    this.assertValidOrderBase(input);
    this.assertValidSellFields(input);

    if (!Number.isFinite(input.stopPrice) || input.stopPrice <= 0) {
      throw new BadRequestException('stopPrice must be greater than zero');
    }
  }

  private assertValidTakeProfitOrder(input: CreateTakeProfitOrderInput): void {
    this.assertValidOrderBase(input);
    this.assertValidSellFields(input);

    if (!Number.isFinite(input.targetPrice) || input.targetPrice <= 0) {
      throw new BadRequestException('targetPrice must be greater than zero');
    }
  }

  private assertValidSellFields(input: { stockId: string }): void {
    if (!input.stockId || input.stockId.trim().length === 0) {
      throw new BadRequestException('stockId is required');
    }
  }

  private assertValidOrderBase(
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
