import { BadRequestException, Injectable } from '@nestjs/common';
import { RecordDepositDto } from '../dto/record-deposit.dto';
import { WalletBalanceResponseDto } from '../dto/wallet-balance-response.dto';
import { WalletDepositResponseDto } from '../dto/wallet-deposit-response.dto';
import { WalletsRepository } from '../repositories/wallets.repository';

@Injectable()
export class WalletsService {
  constructor(private readonly walletsRepository: WalletsRepository) {}

  async getAvailableBalance(
    traderId: string,
  ): Promise<WalletBalanceResponseDto> {
    this.assertValidTraderId(traderId);

    const balance = await this.walletsRepository.findBalanceByTraderId(
      traderId.trim(),
    );

    return {
      traderId: balance.traderId,
      availableBalance: balance.availableBalance,
      reservedBalance: balance.reservedBalance,
      totalBalance: Number(
        (balance.availableBalance + balance.reservedBalance).toFixed(2),
      ),
      currency: balance.currency,
    };
  }

  async recordDeposit(
    traderId: string,
    dto: RecordDepositDto,
  ): Promise<WalletDepositResponseDto> {
    this.assertValidTraderId(traderId);
    this.assertValidDeposit(dto);

    const currency = dto.currency?.trim().toUpperCase() || 'USD';
    const deposit = await this.walletsRepository.recordDeposit({
      traderId: traderId.trim(),
      amount: Number(dto.amount),
      currency,
      sourceTransactionId: dto.sourceTransactionId?.trim() || undefined,
      depositedAt: dto.depositedAt ? new Date(dto.depositedAt) : undefined,
    });

    const totalBalance = Number(
      (deposit.availableBalance + deposit.reservedBalance).toFixed(2),
    );

    return {
      movementId: deposit.movementId,
      traderId: deposit.traderId,
      amount: deposit.amount,
      availableBalance: deposit.availableBalance,
      reservedBalance: deposit.reservedBalance,
      totalBalance,
      currency: deposit.currency,
      movementType: 'DEPOSIT',
      sourceTransactionId: deposit.sourceTransactionId,
      createdAt: deposit.createdAt.toISOString(),
    };
  }

  private assertValidTraderId(traderId: string): void {
    if (!traderId || traderId.trim().length === 0) {
      throw new BadRequestException('traderId is required');
    }
  }

  private assertValidDeposit(dto: RecordDepositDto): void {
    if (!Number.isFinite(Number(dto.amount)) || Number(dto.amount) <= 0) {
      throw new BadRequestException('amount must be greater than zero');
    }

    if (dto.currency && !/^[A-Za-z]{3}$/.test(dto.currency.trim())) {
      throw new BadRequestException('currency must be an ISO-4217 code');
    }

    if (dto.depositedAt && Number.isNaN(new Date(dto.depositedAt).getTime())) {
      throw new BadRequestException('depositedAt must be a valid date');
    }
  }
}
