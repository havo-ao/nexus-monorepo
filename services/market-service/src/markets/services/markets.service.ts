import { Inject, Injectable } from '@nestjs/common';
import { MarketResponseDto } from '../dto/market-response.dto';
import { Market } from '../entities/market.entity';
import { MARKETS_REPOSITORY } from '../repositories/markets.repository';
import type { MarketsRepository } from '../repositories/markets.repository';

@Injectable()
export class MarketsService {
  constructor(
    @Inject(MARKETS_REPOSITORY)
    private readonly marketsRepository: MarketsRepository,
  ) {}

  async getAvailableMarkets(): Promise<MarketResponseDto[]> {
    const markets = await this.marketsRepository.findAvailable();

    return markets.map((market) => this.toResponse(market));
  }

  private toResponse(market: Market): MarketResponseDto {
    const snapshot = market.toSnapshot();

    return {
      code: snapshot.code,
      name: snapshot.name,
      country: snapshot.country,
      currency: snapshot.currency,
      timezone: snapshot.timezone,
      status: snapshot.status,
      representativeSymbols: snapshot.representativeSymbols,
    };
  }
}
