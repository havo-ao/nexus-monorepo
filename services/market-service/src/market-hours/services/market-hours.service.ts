import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MarketStatusResponseDto } from '../dto/market-status-response.dto';
import { MARKET_HOURS_REPOSITORY } from '../repositories/market-hours.repository';
import type { MarketHoursRepository } from '../repositories/market-hours.repository';

@Injectable()
export class MarketHoursService {
  constructor(
    @Inject(MARKET_HOURS_REPOSITORY)
    private readonly marketHoursRepository: MarketHoursRepository,
  ) {}

  async getMarketStatus(
    marketCode: string,
    evaluatedAt = new Date(),
  ): Promise<MarketStatusResponseDto> {
    const marketHours =
      await this.marketHoursRepository.findByMarketCode(marketCode);

    if (!marketHours) {
      throw new NotFoundException(`Market ${marketCode} was not found`);
    }

    const evaluation = marketHours.evaluate(evaluatedAt);

    return {
      marketCode: evaluation.marketCode,
      status: evaluation.status,
      canProcessOrder: evaluation.canProcessOrder,
      evaluatedAt: evaluation.evaluatedAt.toISOString(),
      timezone: evaluation.timezone,
      reason: evaluation.reason,
    };
  }
}
