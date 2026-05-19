import { BadRequestException, Injectable } from '@nestjs/common';
import { RecordExecutedBuyDto } from '../dto/record-executed-buy.dto';
import { RecordExecutedSellDto } from '../dto/record-executed-sell.dto';
import { PortfolioPosition } from '../entities/portfolio-position.entity';
import { PortfolioPositionsRepository } from '../repositories/portfolio-positions.repository';

@Injectable()
export class PositionsService {
  constructor(
    private readonly positionsRepository: PortfolioPositionsRepository,
  ) {}

  async recordExecutedBuy(
    dto: RecordExecutedBuyDto,
  ): Promise<PortfolioPosition> {
    this.assertValidExecutedBuy(dto);

    return this.positionsRepository.applyExecutedBuy({
      traderId: dto.traderId.trim(),
      stockId: dto.stockId.trim(),
      quantity: dto.quantity,
      executionPrice: dto.executionPrice,
      sourceOrderId: dto.sourceOrderId?.trim(),
      sourceTransactionId: dto.sourceTransactionId?.trim(),
      executedAt: dto.executedAt ? new Date(dto.executedAt) : new Date(),
    });
  }

  async recordExecutedSell(
    dto: RecordExecutedSellDto,
  ): Promise<PortfolioPosition> {
    this.assertValidExecutedSell(dto);

    return this.positionsRepository.applyExecutedSell({
      traderId: dto.traderId.trim(),
      stockId: dto.stockId.trim(),
      quantity: dto.quantity,
      executionPrice: dto.executionPrice,
      sourceOrderId: dto.sourceOrderId?.trim(),
      sourceTransactionId: dto.sourceTransactionId?.trim(),
      executedAt: dto.executedAt ? new Date(dto.executedAt) : new Date(),
    });
  }

  private assertValidExecutedBuy(dto: RecordExecutedBuyDto): void {
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

  private assertValidExecutedSell(dto: RecordExecutedSellDto): void {
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
