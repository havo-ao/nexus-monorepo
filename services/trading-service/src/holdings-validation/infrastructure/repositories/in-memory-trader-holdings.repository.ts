import { Injectable } from '@nestjs/common';
import type {
  HoldingsValidationResult,
  TraderHoldingsRepository,
} from '../../domain/repositories/trader-holdings.repository';

@Injectable()
export class InMemoryTraderHoldingsRepository implements TraderHoldingsRepository {
  private readonly holdingsByTraderStock = new Map<string, number>([
    ['101:1', 10],
    ['trader-1:1', 12],
  ]);

  readonly validationEvents: HoldingsValidationResult[] = [];

  validateSellHoldings(input: {
    traderId: string;
    stockId: string;
    symbol?: string;
    quantity: number;
  }): Promise<HoldingsValidationResult> {
    const availableQuantity =
      this.holdingsByTraderStock.get(this.key(input.traderId, input.stockId)) ??
      0;

    const result: HoldingsValidationResult =
      availableQuantity >= input.quantity
        ? {
            approved: true,
            traderId: input.traderId,
            stockId: input.stockId,
            symbol: input.symbol,
            requestedQuantity: input.quantity,
            availableQuantity,
          }
        : {
            approved: false,
            traderId: input.traderId,
            stockId: input.stockId,
            symbol: input.symbol,
            requestedQuantity: input.quantity,
            availableQuantity,
            reason: 'Insufficient available holdings',
          };

    this.validationEvents.push(result);

    return Promise.resolve(result);
  }

  private key(traderId: string, stockId: string): string {
    return `${traderId}:${stockId}`;
  }
}
