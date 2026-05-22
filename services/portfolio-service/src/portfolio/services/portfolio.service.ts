import { Injectable, NotFoundException } from '@nestjs/common';
import { RecordExecutedBuyDto } from '../../positions/dto/record-executed-buy.dto';
import { RecordExecutedSellDto } from '../../positions/dto/record-executed-sell.dto';
import { PortfolioPositionsRepository } from '../../positions/repositories/portfolio-positions.repository';
import { PositionsService } from '../../positions/services/positions.service';
import { ValuationsService } from '../../valuations/services/valuations.service';
import { RecordBalanceReservationDto } from '../../wallets/dto/record-balance-reservation.dto';
import { RecordDepositDto } from '../../wallets/dto/record-deposit.dto';
import { ReleaseBalanceReservationDto } from '../../wallets/dto/release-balance-reservation.dto';
import { WalletBalanceResponseDto } from '../../wallets/dto/wallet-balance-response.dto';
import { WalletDepositResponseDto } from '../../wallets/dto/wallet-deposit-response.dto';
import { WalletReservationResponseDto } from '../../wallets/dto/wallet-reservation-response.dto';
import { WalletsService } from '../../wallets/services/wallets.service';
import { PortfolioPositionResponseDto } from '../dto/portfolio-position-response.dto';
import { PortfolioSectorDistributionResponseDto } from '../dto/portfolio-sector-distribution-response.dto';
import { PortfolioSummaryResponseDto } from '../dto/portfolio-summary-response.dto';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly positionsRepository: PortfolioPositionsRepository,
    private readonly positionsService: PositionsService,
    private readonly valuationsService: ValuationsService,
    private readonly walletsService: WalletsService,
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

  getAvailableBalance(traderId: string): Promise<WalletBalanceResponseDto> {
    return this.walletsService.getAvailableBalance(traderId);
  }

  recordDeposit(
    traderId: string,
    dto: RecordDepositDto,
  ): Promise<WalletDepositResponseDto> {
    return this.walletsService.recordDeposit(traderId, dto);
  }

  reserveBalance(
    traderId: string,
    dto: RecordBalanceReservationDto,
  ): Promise<WalletReservationResponseDto> {
    return this.walletsService.reserveBalance(traderId, dto);
  }

  releaseReservedBalance(
    traderId: string,
    dto: ReleaseBalanceReservationDto,
  ): Promise<WalletReservationResponseDto> {
    return this.walletsService.releaseReservedBalance(traderId, dto);
  }

  async recordExecutedBuy(
    dto: RecordExecutedBuyDto,
  ): Promise<PortfolioPositionResponseDto> {
    const position = await this.positionsService.recordExecutedBuy(dto);

    return this.toPositionResponse(position);
  }

  async recordExecutedSell(
    dto: RecordExecutedSellDto,
  ): Promise<PortfolioPositionResponseDto> {
    const position = await this.positionsService.recordExecutedSell(dto);

    return this.toPositionResponse(position);
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
