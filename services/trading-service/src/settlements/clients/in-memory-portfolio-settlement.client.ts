import { Injectable } from '@nestjs/common';
import type {
  ApplyPortfolioSettlementCommand,
  PortfolioSettlementClient,
  PortfolioSettlementResult,
} from './portfolio-settlement.client';

@Injectable()
export class InMemoryPortfolioSettlementClient implements PortfolioSettlementClient {
  readonly settlements: ApplyPortfolioSettlementCommand[] = [];

  applyExecutedOrder(
    command: ApplyPortfolioSettlementCommand,
  ): Promise<PortfolioSettlementResult> {
    this.settlements.push(command);
    return Promise.resolve({
      portfolioUpdated: Boolean(command.stockId),
      fundsUpdated: true,
    });
  }
}
