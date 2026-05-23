import { BadRequestException, Injectable } from '@nestjs/common';
import { RecordExecutedBuyDto } from '../dto/record-executed-buy.dto';
import { RecordExecutedSellDto } from '../dto/record-executed-sell.dto';
import { RecordExecutedTradeDto } from '../dto/record-executed-trade.dto';
import { PortfolioPosition } from '../entities/portfolio-position.entity';
import { PortfolioPositionsRepository } from '../repositories/portfolio-positions.repository';

interface NormalizedExecutedTrade {
  traderId: string;
  stockId: string;
  quantity: number;
  executionPrice: number;
  sourceOrderId?: string;
  sourceTransactionId?: string;
  executedAt: Date;
}

@Injectable()
export class PositionsService {
  constructor(
    private readonly positionsRepository: PortfolioPositionsRepository,
  ) {}

  async recordExecutedBuy(
    dto: RecordExecutedBuyDto,
  ): Promise<PortfolioPosition> {
    return this.positionsRepository.applyExecutedBuy(
      this.normalizeExecutedTrade(dto),
    );
  }

  async recordExecutedSell(
    dto: RecordExecutedSellDto,
  ): Promise<PortfolioPosition> {
    return this.positionsRepository.applyExecutedSell(
      this.normalizeExecutedTrade(dto),
    );
  }

  private normalizeExecutedTrade(
    dto: RecordExecutedTradeDto,
  ): NormalizedExecutedTrade {
    this.assertValidExecutedTrade(dto);

    return {
      traderId: dto.traderId.trim(),
      stockId: dto.stockId.trim(),
      quantity: dto.quantity,
      executionPrice: dto.executionPrice,
      sourceOrderId: dto.sourceOrderId?.trim(),
      sourceTransactionId: dto.sourceTransactionId?.trim(),
      executedAt: dto.executedAt ? new Date(dto.executedAt) : new Date(),
    };
  }

  private assertValidExecutedTrade(dto: RecordExecutedTradeDto): void {
    if (!dto.traderId || dto.traderId.trim().length === 0) {
      throw new BadRequestException('traderId is required');
    }

    if (!dto.stockId || dto.stockId.trim().length === 0) {
      throw new BadRequestException('stockId is required');
    }

    if (!Number.isInteger(dto.quantity) || dto.quantity <= 0) {
      throw new BadRequestException('quantity must be a positive integer');
    }

    if (!Number.isFinite(dto.executionPrice) || dto.executionPrice <= 0) {
      throw new BadRequestException('executionPrice must be greater than zero');
    }

    if (dto.executedAt && Number.isNaN(new Date(dto.executedAt).getTime())) {
      throw new BadRequestException('executedAt must be a valid ISO date');
    }
  }
}
