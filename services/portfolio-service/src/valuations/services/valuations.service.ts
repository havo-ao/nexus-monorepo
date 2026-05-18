import { Injectable } from '@nestjs/common';
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

@Injectable()
export class ValuationsService {
  constructor(private readonly marketQuotesClient: MarketQuotesClient) {}

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
}
