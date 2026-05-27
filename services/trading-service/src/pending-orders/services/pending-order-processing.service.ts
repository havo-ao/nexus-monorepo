import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { roundMoney } from '../../common/money';
import type { MarketValidation } from '../../market-validation/entities/market-validation.entity';
import { MarketValidationService } from '../../market-validation/services/market-validation.service';
import {
  MARKET_PRICE_CLIENT,
  type MarketPriceClient,
} from '../clients/market-price.client';
import {
  PendingOrderEvaluation,
  type PendingOrderEvaluationStatus,
  PendingOrderProcessingResult,
} from '../entities/pending-order-processing-result.entity';
import {
  PENDING_ORDER_REPOSITORY,
  type PendingOrderRepository,
  type ProcessableOrder,
} from '../repositories/pending-order.repository';

export type ProcessPendingOrdersInput = {
  limit?: number;
  evaluatedAt?: string;
};

@Injectable()
export class PendingOrderProcessingService {
  private readonly logger = new Logger(PendingOrderProcessingService.name);

  constructor(
    @Inject(PENDING_ORDER_REPOSITORY)
    private readonly pendingOrderRepository: PendingOrderRepository,
    @Inject(MARKET_PRICE_CLIENT)
    private readonly marketPriceClient: MarketPriceClient,
    private readonly marketValidationService: MarketValidationService,
  ) {}

  async processPendingOrders(
    input: ProcessPendingOrdersInput = {},
  ): Promise<PendingOrderProcessingResult> {
    const evaluatedAt = this.parseEvaluatedAt(input.evaluatedAt);
    const limit = this.parseLimit(input.limit);
    const pendingOrders =
      await this.pendingOrderRepository.findProcessableOrders(limit);

    const evaluations: PendingOrderEvaluation[] = [];
    for (const order of pendingOrders) {
      evaluations.push(await this.evaluateOrder(order, evaluatedAt));
    }

    const readyForExecution = evaluations.filter(
      (evaluation) => evaluation.status === 'READY_FOR_EXECUTION',
    ).length;
    const failed = evaluations.filter(
      (evaluation) => evaluation.status === 'FAILED',
    ).length;

    return new PendingOrderProcessingResult(
      evaluatedAt.toISOString(),
      pendingOrders.length,
      readyForExecution,
      pendingOrders.length - readyForExecution - failed,
      failed,
      evaluations,
    );
  }

  private async evaluateOrder(
    order: ProcessableOrder,
    evaluatedAt: Date,
  ): Promise<PendingOrderEvaluation> {
    try {
      if (order.status === 'PENDING_MARKET_OPEN') {
        return await this.evaluateMarketOpenOrder(order, evaluatedAt);
      }

      if (order.status === 'PENDING_CONDITION') {
        return await this.evaluateConditionalOrder(order, evaluatedAt);
      }

      return this.recordEvaluation(
        order,
        evaluatedAt,
        'SKIPPED',
        'SKIPPED_STATUS',
        `Order cannot be processed from status ${order.status}`,
      );
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : 'Pending order evaluation failed unexpectedly';
      this.logger.warn(
        `Pending order ${order.orderReference} evaluation failed: ${reason}`,
      );
      await this.pendingOrderRepository.recordEvaluation({
        order,
        matched: false,
        action: 'PROCESSING_FAILED',
        reason,
        evaluatedAt,
      });

      return new PendingOrderEvaluation(order.orderReference, 'FAILED', reason);
    }
  }

  private async evaluateMarketOpenOrder(
    order: ProcessableOrder,
    evaluatedAt: Date,
  ): Promise<PendingOrderEvaluation> {
    const marketValidation =
      await this.marketValidationService.validateMarketStatus(
        order.exchangeId,
        evaluatedAt.toISOString(),
      );

    if (!marketValidation.canOperate) {
      return this.recordEvaluation(
        order,
        evaluatedAt,
        'WAITING_MARKET_OPEN',
        'WAITING_MARKET_OPEN',
        marketValidation.reason ?? 'Market is not open yet',
        marketValidation,
      );
    }

    await this.pendingOrderRepository.markReadyForExecution({
      order,
      matched: true,
      action: 'MARKET_OPEN_MATCHED',
      reason: 'Market is open; order moved to pending execution',
      evaluatedAt,
      marketStatus: marketValidation.marketStatus,
      nextStatus: 'PENDING_EXECUTION',
    });

    return new PendingOrderEvaluation(
      order.orderReference,
      'READY_FOR_EXECUTION',
      'Market is open; order moved to pending execution',
      marketValidation.marketStatus,
    );
  }

  private async evaluateConditionalOrder(
    order: ProcessableOrder,
    evaluatedAt: Date,
  ): Promise<PendingOrderEvaluation> {
    const triggerPrice = order.limitPrice;
    if (!triggerPrice || triggerPrice <= 0) {
      return this.recordEvaluation(
        order,
        evaluatedAt,
        'FAILED',
        'MISSING_TRIGGER_PRICE',
        'Order trigger price is not available',
      );
    }

    const quote = await this.marketPriceClient.getLatestPrice(order.symbol);
    const marketPrice = roundMoney(quote.price);
    const matched = this.isConditionMatched(order, marketPrice, triggerPrice);

    if (!matched) {
      return this.recordEvaluation(
        order,
        evaluatedAt,
        'WAITING_CONDITION',
        'WAITING_CONDITION',
        this.getWaitingConditionReason(order, marketPrice, triggerPrice),
        undefined,
        marketPrice,
        triggerPrice,
      );
    }

    await this.pendingOrderRepository.markReadyForExecution({
      order,
      matched: true,
      action: 'CONDITION_MATCHED',
      reason: this.getMatchedConditionReason(order, marketPrice, triggerPrice),
      evaluatedAt,
      marketPrice,
      triggerPrice,
      nextStatus: 'PENDING_EXECUTION',
    });

    return new PendingOrderEvaluation(
      order.orderReference,
      'READY_FOR_EXECUTION',
      this.getMatchedConditionReason(order, marketPrice, triggerPrice),
      undefined,
      marketPrice,
      triggerPrice,
    );
  }

  private isConditionMatched(
    order: ProcessableOrder,
    marketPrice: number,
    triggerPrice: number,
  ): boolean {
    if (order.side === 'BUY' && order.orderType === 'LIMIT') {
      return marketPrice <= triggerPrice;
    }

    if (order.side === 'SELL' && order.orderType === 'LIMIT') {
      return marketPrice >= triggerPrice;
    }

    if (order.side === 'SELL' && order.orderType === 'STOP_LOSS') {
      return marketPrice <= triggerPrice;
    }

    if (order.side === 'SELL' && order.orderType === 'TAKE_PROFIT') {
      return marketPrice >= triggerPrice;
    }

    return false;
  }

  private async recordEvaluation(
    order: ProcessableOrder,
    evaluatedAt: Date,
    status: PendingOrderEvaluationStatus,
    action: string,
    reason: string,
    marketValidation?: MarketValidation,
    marketPrice?: number,
    triggerPrice?: number,
  ): Promise<PendingOrderEvaluation> {
    await this.pendingOrderRepository.recordEvaluation({
      order,
      matched: false,
      action,
      reason,
      evaluatedAt,
      marketStatus: marketValidation?.marketStatus,
      marketPrice,
      triggerPrice,
    });

    return new PendingOrderEvaluation(
      order.orderReference,
      status,
      reason,
      marketValidation?.marketStatus,
      marketPrice,
      triggerPrice,
    );
  }

  private getMatchedConditionReason(
    order: ProcessableOrder,
    marketPrice: number,
    triggerPrice: number,
  ): string {
    return `${order.orderType} condition matched at ${marketPrice.toFixed(
      2,
    )}; trigger ${triggerPrice.toFixed(2)}`;
  }

  private getWaitingConditionReason(
    order: ProcessableOrder,
    marketPrice: number,
    triggerPrice: number,
  ): string {
    return `${order.orderType} condition pending at ${marketPrice.toFixed(
      2,
    )}; trigger ${triggerPrice.toFixed(2)}`;
  }

  private parseEvaluatedAt(evaluatedAt: string | undefined): Date {
    if (!evaluatedAt) {
      return new Date();
    }

    const parsedDate = new Date(evaluatedAt);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('evaluatedAt must be a valid ISO date');
    }

    return parsedDate;
  }

  private parseLimit(limit: number | undefined): number {
    if (limit === undefined) {
      return 25;
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException('limit must be between 1 and 100');
    }

    return limit;
  }
}
