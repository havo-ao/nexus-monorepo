import { BadRequestException, Injectable } from '@nestjs/common';
import { RecordBalanceReservationDto } from '../dto/record-balance-reservation.dto';
import { RecordDepositDto } from '../dto/record-deposit.dto';
import { RecordWithdrawalDto } from '../dto/record-withdrawal.dto';
import { ReleaseBalanceReservationDto } from '../dto/release-balance-reservation.dto';
import { WalletBalanceResponseDto } from '../dto/wallet-balance-response.dto';
import { WalletDepositResponseDto } from '../dto/wallet-deposit-response.dto';
import { WalletHistoryResponseDto } from '../dto/wallet-history-response.dto';
import { WalletReservationResponseDto } from '../dto/wallet-reservation-response.dto';
import { WalletWithdrawalResponseDto } from '../dto/wallet-withdrawal-response.dto';
import {
  InsufficientReservedBalanceError,
  InsufficientWalletBalanceError,
  WalletReservation,
  WalletsRepository,
} from '../repositories/wallets.repository';

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

  async recordWithdrawal(
    traderId: string,
    dto: RecordWithdrawalDto,
  ): Promise<WalletWithdrawalResponseDto> {
    this.assertValidTraderId(traderId);
    this.assertValidWithdrawal(dto);

    try {
      const withdrawal = await this.walletsRepository.recordWithdrawal({
        traderId: traderId.trim(),
        amount: Number(dto.amount),
        currency: this.normalizeCurrency(dto.currency),
        sourceTransactionId: dto.sourceTransactionId?.trim() || undefined,
        withdrawnAt: dto.withdrawnAt ? new Date(dto.withdrawnAt) : undefined,
      });

      return {
        movementId: withdrawal.movementId,
        traderId: withdrawal.traderId,
        amount: withdrawal.amount,
        availableBalance: withdrawal.availableBalance,
        reservedBalance: withdrawal.reservedBalance,
        totalBalance: Number(
          (withdrawal.availableBalance + withdrawal.reservedBalance).toFixed(2),
        ),
        currency: withdrawal.currency,
        movementType: 'WITHDRAWAL',
        sourceTransactionId: withdrawal.sourceTransactionId,
        createdAt: withdrawal.createdAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof InsufficientWalletBalanceError) {
        throw new BadRequestException('available balance is insufficient');
      }

      throw error;
    }
  }

  async getFinancialHistory(
    traderId: string,
  ): Promise<WalletHistoryResponseDto> {
    this.assertValidTraderId(traderId);

    const normalizedTraderId = traderId.trim();
    const movements =
      await this.walletsRepository.findMovementsByTraderId(normalizedTraderId);

    return {
      traderId: normalizedTraderId,
      movements: movements.map((movement) => ({
        movementId: movement.movementId,
        traderId: movement.traderId,
        movementType: movement.movementType,
        amount: movement.amount,
        currency: movement.currency,
        sourceTransactionId: movement.sourceTransactionId,
        sourceOrderId: movement.sourceOrderId,
        createdAt: movement.createdAt.toISOString(),
      })),
    };
  }

  async reserveBalance(
    traderId: string,
    dto: RecordBalanceReservationDto,
  ): Promise<WalletReservationResponseDto> {
    this.assertValidTraderId(traderId);
    this.assertValidReservation(dto, dto.reservedAt);

    try {
      const reservation = await this.walletsRepository.reserveBalance({
        traderId: traderId.trim(),
        amount: Number(dto.amount),
        currency: this.normalizeCurrency(dto.currency),
        sourceOrderId: dto.sourceOrderId?.trim() || undefined,
        occurredAt: dto.reservedAt ? new Date(dto.reservedAt) : undefined,
      });

      return this.toReservationResponse(reservation);
    } catch (error) {
      if (error instanceof InsufficientWalletBalanceError) {
        throw new BadRequestException('available balance is insufficient');
      }

      throw error;
    }
  }

  async releaseReservedBalance(
    traderId: string,
    dto: ReleaseBalanceReservationDto,
  ): Promise<WalletReservationResponseDto> {
    this.assertValidTraderId(traderId);
    this.assertValidReservation(dto, dto.releasedAt);

    try {
      const reservation = await this.walletsRepository.releaseReservedBalance({
        traderId: traderId.trim(),
        amount: Number(dto.amount),
        currency: this.normalizeCurrency(dto.currency),
        sourceOrderId: dto.sourceOrderId?.trim() || undefined,
        occurredAt: dto.releasedAt ? new Date(dto.releasedAt) : undefined,
      });

      return this.toReservationResponse(reservation);
    } catch (error) {
      if (error instanceof InsufficientReservedBalanceError) {
        throw new BadRequestException('reserved balance is insufficient');
      }

      throw error;
    }
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

    this.assertValidCurrency(dto.currency);

    if (dto.depositedAt && Number.isNaN(new Date(dto.depositedAt).getTime())) {
      throw new BadRequestException('depositedAt must be a valid date');
    }
  }

  private assertValidWithdrawal(dto: RecordWithdrawalDto): void {
    if (!Number.isFinite(Number(dto.amount)) || Number(dto.amount) <= 0) {
      throw new BadRequestException('amount must be greater than zero');
    }

    this.assertValidCurrency(dto.currency);

    if (dto.withdrawnAt && Number.isNaN(new Date(dto.withdrawnAt).getTime())) {
      throw new BadRequestException('withdrawnAt must be a valid date');
    }
  }

  private assertValidReservation(
    dto: RecordBalanceReservationDto | ReleaseBalanceReservationDto,
    occurredAt?: string,
  ): void {
    if (!Number.isFinite(Number(dto.amount)) || Number(dto.amount) <= 0) {
      throw new BadRequestException('amount must be greater than zero');
    }

    this.assertValidCurrency(dto.currency);

    if (occurredAt && Number.isNaN(new Date(occurredAt).getTime())) {
      throw new BadRequestException('reservation date must be valid');
    }
  }

  private assertValidCurrency(currency?: string): void {
    if (currency && !/^[A-Za-z]{3}$/.test(currency.trim())) {
      throw new BadRequestException('currency must be an ISO-4217 code');
    }
  }

  private normalizeCurrency(currency?: string): string {
    return currency?.trim().toUpperCase() || 'USD';
  }

  private toReservationResponse(
    reservation: WalletReservation,
  ): WalletReservationResponseDto {
    return {
      movementId: reservation.movementId,
      traderId: reservation.traderId,
      amount: reservation.amount,
      availableBalance: reservation.availableBalance,
      reservedBalance: reservation.reservedBalance,
      totalBalance: Number(
        (reservation.availableBalance + reservation.reservedBalance).toFixed(2),
      ),
      currency: reservation.currency,
      movementType: reservation.movementType,
      sourceOrderId: reservation.sourceOrderId,
      createdAt: reservation.createdAt.toISOString(),
    };
  }
}
