import { Injectable, NotFoundException } from '@nestjs/common';
import { PortfolioPositionsRepository } from '../../positions/repositories/portfolio-positions.repository';
import { PortfolioPositionResponseDto } from '../dto/portfolio-position-response.dto';
import { PortfolioSummaryResponseDto } from '../dto/portfolio-summary-response.dto';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly positionsRepository: PortfolioPositionsRepository,
  ) {}

  async getConsolidatedPortfolio(
    traderId: string,
  ): Promise<PortfolioSummaryResponseDto> {
    const positions = await this.positionsRepository.findByTraderId(traderId);
    const mappedPositions = positions.map((position) =>
      this.toPositionResponse(position),
    );

    return {
      traderId,
      positions: mappedPositions,
      totalInvested: this.sumInvested(mappedPositions),
      currentValue: this.sumCurrentValue(mappedPositions),
    };
  }

  async getPositionDetail(
    traderId: string,
    positionId: string,
  ): Promise<PortfolioPositionResponseDto> {
    const position = await this.positionsRepository.findByTraderIdAndPositionId(
      traderId,
      positionId,
    );

    if (!position) {
      throw new NotFoundException(
        `Position ${positionId} was not found for trader ${traderId}`,
      );
    }

    return this.toPositionResponse(position);
  }

  calculateCurrentValue(
    quantity: number,
    currentPrice: number | null,
  ): number | null {
    if (currentPrice === null) {
      return null;
    }

    return quantity * currentPrice;
  }

  private sumInvested(positions: PortfolioPositionResponseDto[]): number {
    return positions.reduce(
      (total, position) => total + position.totalInvested,
      0,
    );
  }

  private sumCurrentValue(
    positions: PortfolioPositionResponseDto[],
  ): number | null {
    if (positions.some((position) => position.currentValue === null)) {
      return null;
    }

    return positions.reduce(
      (total, position) => total + Number(position.currentValue),
      0,
    );
  }

  private toPositionResponse(position: {
    id: string;
    stockId: string;
    symbol?: string | null;
    quantity: number;
    avgBuyPrice: string;
    totalInvested: string;
    lastUpdated: Date;
  }): PortfolioPositionResponseDto {
    const currentPrice = null;

    return {
      positionId: position.id,
      stockId: position.stockId,
      symbol: position.symbol ?? null,
      quantity: position.quantity,
      averageBuyPrice: Number(position.avgBuyPrice),
      totalInvested: Number(position.totalInvested),
      currentPrice,
      currentValue: this.calculateCurrentValue(position.quantity, currentPrice),
      lastUpdated: position.lastUpdated.toISOString(),
    };
  }
}
