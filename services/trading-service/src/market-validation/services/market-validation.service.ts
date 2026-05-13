import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { MarketValidation } from '../entities/market-validation.entity';
import { MARKET_STATUS_REPOSITORY } from '../repositories/market-status.repository';
import type { MarketStatusRepository } from '../repositories/market-status.repository';

@Injectable()
export class MarketValidationService {
  constructor(
    @Inject(MARKET_STATUS_REPOSITORY)
    private readonly marketStatusRepository: MarketStatusRepository,
  ) {}

  async validateMarketStatus(
    exchangeId: string,
    evaluatedAtInput?: string,
  ): Promise<MarketValidation> {
    this.assertValidInput(exchangeId, evaluatedAtInput);

    const evaluatedAt = evaluatedAtInput
      ? new Date(evaluatedAtInput)
      : new Date();

    const result = await this.marketStatusRepository.validateMarketStatus(
      exchangeId,
      evaluatedAt,
    );

    return new MarketValidation(
      result.canOperate,
      result.exchangeId,
      result.marketStatus,
      result.evaluatedAt.toISOString(),
      result.timezone,
      result.openTime,
      result.closeTime,
      result.reason,
    );
  }

  private assertValidInput(
    exchangeId: string,
    evaluatedAtInput?: string,
  ): void {
    if (!exchangeId || exchangeId.trim().length === 0) {
      throw new BadRequestException('exchangeId is required');
    }

    if (
      evaluatedAtInput &&
      Number.isNaN(new Date(evaluatedAtInput).getTime())
    ) {
      throw new BadRequestException(
        'evaluatedAt must be a valid ISO timestamp',
      );
    }
  }
}
