import { Injectable } from '@nestjs/common';
import { roundMoney } from '../../common/money';
import {
  FundsReservationResult,
  TraderFundsRepository,
} from './trader-funds.repository';

@Injectable()
export class InMemoryTraderFundsRepository implements TraderFundsRepository {
  private readonly fundsByTrader = new Map<
    string,
    { availableAmount: number; reservedAmount: number }
  >([
    ['trader-1', { availableAmount: 100000, reservedAmount: 0 }],
    ['trader-2', { availableAmount: 5000, reservedAmount: 0 }],
  ]);

  readonly validationEvents: FundsReservationResult[] = [];

  reserveBuyFunds(
    traderId: string,
    requiredAmount: number,
  ): Promise<FundsReservationResult> {
    const funds = this.fundsByTrader.get(traderId) ?? {
      availableAmount: 0,
      reservedAmount: 0,
    };
    const availableAmount = roundMoney(funds.availableAmount);
    const currentReservedAmount = roundMoney(funds.reservedAmount);

    if (availableAmount < requiredAmount) {
      const result = {
        approved: false,
        traderId,
        availableAmount,
        requiredAmount,
        reservedAmount: currentReservedAmount,
        reason: 'Insufficient available funds',
      };
      this.validationEvents.push(result);
      return Promise.resolve(result);
    }

    const result = {
      approved: true,
      traderId,
      availableAmount,
      requiredAmount,
      reservedAmount: roundMoney(currentReservedAmount + requiredAmount),
    };

    this.fundsByTrader.set(traderId, {
      availableAmount: roundMoney(availableAmount - requiredAmount),
      reservedAmount: result.reservedAmount,
    });
    this.validationEvents.push(result);

    return Promise.resolve(result);
  }
}
