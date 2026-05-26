import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { roundMoney } from '../../../common/money';
import { FundsValidation } from '../../domain/entities/funds-validation.entity';
import { TRADER_FUNDS_REPOSITORY } from '../../domain/repositories/trader-funds.repository';
import type { TraderFundsRepository } from '../../domain/repositories/trader-funds.repository';

@Injectable()
export class FundsValidationService {
  constructor(
    @Inject(TRADER_FUNDS_REPOSITORY)
    private readonly traderFundsRepository: TraderFundsRepository,
  ) {}

  async validateBuyFunds(
    traderId: string,
    grossAmount: number,
  ): Promise<FundsValidation> {
    this.assertValidInput(traderId, grossAmount);

    const requiredAmount = roundMoney(grossAmount);
    const reservation = await this.traderFundsRepository.reserveBuyFunds(
      traderId,
      requiredAmount,
    );

    return new FundsValidation(
      reservation.approved,
      reservation.traderId,
      reservation.availableAmount,
      reservation.requiredAmount,
      reservation.reservedAmount,
      reservation.reason,
    );
  }

  private assertValidInput(traderId: string, grossAmount: number): void {
    if (!traderId || traderId.trim().length === 0) {
      throw new BadRequestException('traderId is required');
    }

    if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
      throw new BadRequestException('grossAmount must be greater than zero');
    }
  }
}
