import { Injectable, NotFoundException } from '@nestjs/common';
import { PortfolioPositionsRepository } from '../../positions/repositories/portfolio-positions.repository';
import { ValuationsService } from '../../valuations/services/valuations.service';
import { PortfolioPositionResponseDto } from '../dto/portfolio-position-response.dto';
import { PortfolioSectorDistributionResponseDto } from '../dto/portfolio-sector-distribution-response.dto';
import { PortfolioSummaryResponseDto } from '../dto/portfolio-summary-response.dto';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly positionsRepository: PortfolioPositionsRepository,
    private readonly valuationsService: ValuationsService,
  ) {}

  async getConsolidatedPortfolio(
    traderId: string,
  ): Promise<PortfolioSummaryResponseDto> {
    const positions = await this.positionsRepository.findByTraderId(traderId);
    const mappedPositions = await Promise.all(
      positions.map((position) => this.toPositionResponse(position)),
    );
    const totalInvested = this.sumInvested(mappedPositions);
    const currentValue = this.sumCurrentValue(mappedPositions);
    const profitLoss = this.valuationsService.calculateProfitLoss(
      currentValue,
      totalInvested,
    );

    return {
      traderId,
      positions: mappedPositions,
      totalInvested,
      currentValue,
      profitLoss,
      returnPercentage: this.valuationsService.calculateReturnPercentage(
        profitLoss,
        totalInvested,
      ),
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

  async getSectorDistribution(
    traderId: string,
  ): Promise<PortfolioSectorDistributionResponseDto> {
    const positions = await this.positionsRepository.findByTraderId(traderId);
    const mappedPositions = await Promise.all(
      positions.map((position) => this.toPositionResponse(position)),
    );
    const distribution =
      await this.valuationsService.calculateSectorDistribution(
        mappedPositions.map((position) => ({
          symbol: position.symbol,
          currentValue: position.currentValue,
          totalInvested: position.totalInvested,
        })),
      );

    return {
      traderId,
      totalValue: distribution.totalValue,
      sectors: distribution.sectors,
    };
  }

  calculateCurrentValue(
    quantity: number,
    currentPrice: number | null,
  ): number | null {
    return this.valuationsService.calculateCurrentValue(quantity, currentPrice);
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

  private async toPositionResponse(position: {
    id: string;
    stockId: string;
    symbol?: string | null;
    quantity: number;
    avgBuyPrice: string;
    totalInvested: string;
    lastUpdated: Date;
  }): Promise<PortfolioPositionResponseDto> {
    const totalInvested = Number(position.totalInvested);
    const valuation = await this.valuationsService.valuePosition({
      symbol: position.symbol,
      quantity: position.quantity,
      totalInvested,
    });

    return {
      positionId: position.id,
      stockId: position.stockId,
      symbol: position.symbol ?? null,
      quantity: position.quantity,
      averageBuyPrice: Number(position.avgBuyPrice),
      totalInvested,
      currentPrice: valuation.currentPrice,
      currentValue: valuation.currentValue,
      profitLoss: valuation.profitLoss,
      returnPercentage: valuation.returnPercentage,
      lastUpdated: position.lastUpdated.toISOString(),
    };
  }
}
