import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { HoldingsValidation } from '../../domain/entities/holdings-validation.entity';
import { TRADER_HOLDINGS_REPOSITORY } from '../../domain/repositories/trader-holdings.repository';
import type { TraderHoldingsRepository } from '../../domain/repositories/trader-holdings.repository';

@Injectable()
export class HoldingsValidationService {
  constructor(
    @Inject(TRADER_HOLDINGS_REPOSITORY)
    private readonly traderHoldingsRepository: TraderHoldingsRepository,
  ) {}

  async validateSellHoldings(input: {
    traderId: string;
    stockId: string;
    symbol?: string;
    quantity: number;
  }): Promise<HoldingsValidation> {
    this.assertValidInput(input);

    const result = await this.traderHoldingsRepository.validateSellHoldings({
      traderId: input.traderId.trim(),
      stockId: input.stockId.trim(),
      symbol: input.symbol?.trim().toUpperCase() || undefined,
      quantity: input.quantity,
    });

    return new HoldingsValidation(
      result.approved,
      result.traderId,
      result.stockId,
      result.requestedQuantity,
      result.availableQuantity,
      result.symbol,
      result.reason,
    );
  }

  private assertValidInput(input: {
    traderId: string;
    stockId: string;
    quantity: number;
  }): void {
    if (!input.traderId || input.traderId.trim().length === 0) {
      throw new BadRequestException('traderId is required');
    }

    if (!input.stockId || input.stockId.trim().length === 0) {
      throw new BadRequestException('stockId is required');
    }

    if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
      throw new BadRequestException('quantity must be greater than zero');
    }
  }
}
