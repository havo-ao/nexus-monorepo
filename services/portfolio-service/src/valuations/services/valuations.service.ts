import { Injectable } from '@nestjs/common';
import { MarketInstrumentsClient } from '../clients/market-instruments.client';
import { MarketQuotesClient } from '../clients/market-quotes.client';

export interface PositionValuationInput {
  symbol?: string | null;
  quantity: number;
  totalInvested: number;
}

export interface PositionValuation {
  currentPrice: number | null;
  currentValue: number | null;
  profitLoss: number | null;
  returnPercentage: number | null;
}

export interface SectorDistributionPosition {
  symbol: string | null;
  currentValue: number | null;
  totalInvested: number;
}

export interface SectorDistributionItem {
  sector: string;
  value: number;
  percentage: number;
  positions: number;
}

export interface SectorDistribution {
  totalValue: number;
  sectors: SectorDistributionItem[];
}

@Injectable()
export class ValuationsService {
  constructor(
    private readonly marketQuotesClient: MarketQuotesClient,
    private readonly marketInstrumentsClient: MarketInstrumentsClient,
  ) {}

  async valuePosition(
    position: PositionValuationInput,
  ): Promise<PositionValuation> {
    const currentPrice = position.symbol
      ? await this.marketQuotesClient.getLatestPrice(position.symbol)
      : null;
    const currentValue = this.calculateCurrentValue(
      position.quantity,
      currentPrice,
    );
    const profitLoss = this.calculateProfitLoss(
      currentValue,
      position.totalInvested,
    );

    return {
      currentPrice,
      currentValue,
      profitLoss,
      returnPercentage: this.calculateReturnPercentage(
        profitLoss,
        position.totalInvested,
      ),
    };
  }

  calculateCurrentValue(
    quantity: number,
    currentPrice: number | null,
  ): number | null {
    if (currentPrice === null) {
      return null;
    }

    return Number((quantity * currentPrice).toFixed(2));
  }

  calculateProfitLoss(
    currentValue: number | null,
    totalInvested: number,
  ): number | null {
    if (currentValue === null) {
      return null;
    }

    return Number((currentValue - totalInvested).toFixed(2));
  }

  calculateReturnPercentage(
    profitLoss: number | null,
    totalInvested: number,
  ): number | null {
    if (profitLoss === null || totalInvested === 0) {
      return null;
    }

    return Number(((profitLoss / totalInvested) * 100).toFixed(4));
  }

  async calculateSectorDistribution(
    positions: SectorDistributionPosition[],
  ): Promise<SectorDistribution> {
    const valuedPositions = await Promise.all(
      positions.map(async (position) => ({
        sector: await this.resolveSector(position.symbol),
        value: position.currentValue ?? position.totalInvested,
      })),
    );
    const totalValue = Number(
      valuedPositions
        .reduce((total, position) => total + position.value, 0)
        .toFixed(2),
    );
    const bySector = new Map<string, { value: number; positions: number }>();

    for (const position of valuedPositions) {
      const current = bySector.get(position.sector) ?? {
        value: 0,
        positions: 0,
      };
      bySector.set(position.sector, {
        value: current.value + position.value,
        positions: current.positions + 1,
      });
    }

    return {
      totalValue,
      sectors: [...bySector.entries()]
        .map(([sector, distribution]) => ({
          sector,
          value: Number(distribution.value.toFixed(2)),
          percentage:
            totalValue === 0
              ? 0
              : Number(((distribution.value / totalValue) * 100).toFixed(4)),
          positions: distribution.positions,
        }))
        .sort((first, second) => second.value - first.value),
    };
  }

  private async resolveSector(symbol: string | null): Promise<string> {
    if (!symbol) {
      return 'Unknown';
    }

    return (await this.marketInstrumentsClient.getSector(symbol)) ?? 'Unknown';
  }
}
