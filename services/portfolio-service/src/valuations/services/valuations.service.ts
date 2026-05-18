import { Injectable } from '@nestjs/common';
import { MarketQuotesClient } from '../clients/market-quotes.client';

export interface PositionValuationInput {
  symbol?: string | null;
  quantity: number;
}

export interface PositionValuation {
  currentPrice: number | null;
  currentValue: number | null;
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

    return {
      currentPrice,
      currentValue: this.calculateCurrentValue(position.quantity, currentPrice),
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
}
