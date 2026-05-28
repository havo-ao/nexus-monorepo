import { Injectable, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WalletMovement } from '../entities/wallet-movement.entity';
import { Wallet } from '../entities/wallet.entity';

export interface WalletBalance {
  traderId: string;
  availableBalance: number;
  reservedBalance: number;
  currency: string;
}

export interface WalletDeposit {
  movementId: string;
  traderId: string;
  amount: number;
  availableBalance: number;
  reservedBalance: number;
  currency: string;
  sourceTransactionId?: string;
  createdAt: Date;
}

export interface WalletWithdrawal {
  movementId: string;
  traderId: string;
  amount: number;
  availableBalance: number;
  reservedBalance: number;
  currency: string;
  sourceTransactionId?: string;
  createdAt: Date;
}

export interface RecordDepositInput {
  traderId: string;
  amount: number;
  currency: string;
  sourceTransactionId?: string;
  depositedAt?: Date;
}

export interface RecordWithdrawalInput {
  traderId: string;
  amount: number;
  currency: string;
  sourceTransactionId?: string;
  withdrawnAt?: Date;
}

export interface WalletReservation {
  movementId: string;
  traderId: string;
  amount: number;
  availableBalance: number;
  reservedBalance: number;
  currency: string;
  movementType: WalletReservationMovementType;
  sourceOrderId?: string;
  createdAt: Date;
}

export type WalletReservationMovementType = 'RESERVE' | 'RELEASE' | 'CAPTURE';

export interface WalletHistoryMovement {
  movementId: string;
  traderId: string;
  movementType: string;
  amount: number;
  currency: string;
  sourceTransactionId?: string;
  sourceOrderId?: string;
  createdAt: Date;
}

export interface RecordReservationInput {
  traderId: string;
  amount: number;
  currency: string;
  sourceOrderId?: string;
  occurredAt?: Date;
}

@Injectable()
export class WalletsRepository {
  constructor(@Optional() private readonly dataSource?: DataSource) {}

  async findBalanceByTraderId(traderId: string): Promise<WalletBalance> {
    if (!this.dataSource) {
      return this.emptyBalance(traderId);
    }

    const wallet = await this.dataSource.getRepository(Wallet).findOne({
      where: { traderId },
    });

    if (!wallet) {
      return this.emptyBalance(traderId);
    }

    return {
      traderId: wallet.traderId,
      availableBalance: Number(wallet.availableBalance),
      reservedBalance: Number(wallet.reservedBalance),
      currency: wallet.currency,
    };
  }

  async findMovementsByTraderId(
    traderId: string,
  ): Promise<WalletHistoryMovement[]> {
    if (!this.dataSource) {
      return [];
    }

    const movements = await this.dataSource.getRepository(WalletMovement).find({
      where: { traderId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });

    return movements.map((movement) => ({
      movementId: movement.id,
      traderId: movement.traderId,
      movementType: movement.movementType,
      amount: Number(movement.amount),
      currency: movement.currency,
      sourceTransactionId: movement.sourceTransactionId ?? undefined,
      sourceOrderId: movement.sourceOrderId ?? undefined,
      createdAt: movement.createdAt,
    }));
  }

  async recordDeposit(input: RecordDepositInput): Promise<WalletDeposit> {
    if (!this.dataSource) {
      const createdAt = input.depositedAt ?? new Date();
      return {
        movementId: '0',
        traderId: input.traderId,
        amount: input.amount,
        availableBalance: input.amount,
        reservedBalance: 0,
        currency: input.currency,
        sourceTransactionId: input.sourceTransactionId,
        createdAt,
      };
    }

    return this.dataSource.transaction(async (manager) => {
      const walletRepository = manager.getRepository(Wallet);
      const movementRepository = manager.getRepository(WalletMovement);
      const createdAt = input.depositedAt ?? new Date();

      let wallet = await walletRepository.findOne({
        where: { traderId: input.traderId },
      });

      if (wallet) {
        const nextAvailableBalance =
          Number(wallet.availableBalance) + input.amount;
        wallet.availableBalance = nextAvailableBalance.toFixed(2);
        wallet.updatedAt = createdAt;
      } else {
        wallet = walletRepository.create({
          traderId: input.traderId,
          balance: input.amount.toFixed(2),
          availableBalance: input.amount.toFixed(2),
          reservedBalance: '0.00',
          currency: input.currency,
          createdAt,
          updatedAt: createdAt,
        });
      }

      this.syncTotalBalance(wallet);
      const savedWallet = await walletRepository.save(wallet);

      const movement = await movementRepository.save(
        movementRepository.create({
          traderId: input.traderId,
          movementType: 'DEPOSIT',
          amount: input.amount.toFixed(2),
          currency: savedWallet.currency,
          sourceTransactionId: input.sourceTransactionId ?? null,
          createdAt,
        }),
      );

      return {
        movementId: movement.id,
        traderId: savedWallet.traderId,
        amount: Number(movement.amount),
        availableBalance: Number(savedWallet.availableBalance),
        reservedBalance: Number(savedWallet.reservedBalance),
        currency: savedWallet.currency,
        sourceTransactionId: movement.sourceTransactionId ?? undefined,
        createdAt: movement.createdAt,
      };
    });
  }

  async recordWithdrawal(
    input: RecordWithdrawalInput,
  ): Promise<WalletWithdrawal> {
    if (!this.dataSource) {
      const createdAt = input.withdrawnAt ?? new Date();
      return {
        movementId: '0',
        traderId: input.traderId,
        amount: input.amount,
        availableBalance: 0,
        reservedBalance: 0,
        currency: input.currency,
        sourceTransactionId: input.sourceTransactionId,
        createdAt,
      };
    }

    return this.dataSource.transaction(async (manager) => {
      const walletRepository = manager.getRepository(Wallet);
      const movementRepository = manager.getRepository(WalletMovement);
      const createdAt = input.withdrawnAt ?? new Date();
      const wallet = await walletRepository.findOne({
        where: { traderId: input.traderId },
      });

      if (!wallet || Number(wallet.availableBalance) < input.amount) {
        throw new InsufficientWalletBalanceError();
      }

      wallet.availableBalance = (
        Number(wallet.availableBalance) - input.amount
      ).toFixed(2);
      wallet.updatedAt = createdAt;

      this.syncTotalBalance(wallet);
      const savedWallet = await walletRepository.save(wallet);

      const movement = await movementRepository.save(
        movementRepository.create({
          traderId: input.traderId,
          movementType: 'WITHDRAWAL',
          amount: input.amount.toFixed(2),
          currency: savedWallet.currency,
          sourceTransactionId: input.sourceTransactionId ?? null,
          createdAt,
        }),
      );

      return {
        movementId: movement.id,
        traderId: savedWallet.traderId,
        amount: Number(movement.amount),
        availableBalance: Number(savedWallet.availableBalance),
        reservedBalance: Number(savedWallet.reservedBalance),
        currency: savedWallet.currency,
        sourceTransactionId: movement.sourceTransactionId ?? undefined,
        createdAt: movement.createdAt,
      };
    });
  }

  async reserveBalance(
    input: RecordReservationInput,
  ): Promise<WalletReservation> {
    if (!this.dataSource) {
      const createdAt = input.occurredAt ?? new Date();
      return {
        movementId: '0',
        traderId: input.traderId,
        amount: input.amount,
        availableBalance: 0,
        reservedBalance: input.amount,
        currency: input.currency,
        movementType: 'RESERVE',
        sourceOrderId: input.sourceOrderId,
        createdAt,
      };
    }

    return this.dataSource.transaction(async (manager) => {
      const walletRepository = manager.getRepository(Wallet);
      const movementRepository = manager.getRepository(WalletMovement);
      const createdAt = input.occurredAt ?? new Date();
      const wallet = await walletRepository.findOne({
        where: { traderId: input.traderId },
      });

      if (!wallet || Number(wallet.availableBalance) < input.amount) {
        throw new InsufficientWalletBalanceError();
      }

      wallet.availableBalance = (
        Number(wallet.availableBalance) - input.amount
      ).toFixed(2);
      wallet.reservedBalance = (
        Number(wallet.reservedBalance) + input.amount
      ).toFixed(2);
      wallet.updatedAt = createdAt;

      this.syncTotalBalance(wallet);
      const savedWallet = await walletRepository.save(wallet);
      const movement = await this.saveReservationMovement(
        movementRepository,
        input,
        savedWallet.currency,
        'RESERVE',
        createdAt,
      );

      return this.toReservationResult(movement, savedWallet, input.amount);
    });
  }

  async releaseReservedBalance(
    input: RecordReservationInput,
  ): Promise<WalletReservation> {
    if (!this.dataSource) {
      const createdAt = input.occurredAt ?? new Date();
      return {
        movementId: '0',
        traderId: input.traderId,
        amount: input.amount,
        availableBalance: input.amount,
        reservedBalance: 0,
        currency: input.currency,
        movementType: 'RELEASE',
        sourceOrderId: input.sourceOrderId,
        createdAt,
      };
    }

    return this.dataSource.transaction(async (manager) => {
      const walletRepository = manager.getRepository(Wallet);
      const movementRepository = manager.getRepository(WalletMovement);
      const createdAt = input.occurredAt ?? new Date();
      const wallet = await walletRepository.findOne({
        where: { traderId: input.traderId },
      });

      if (!wallet || Number(wallet.reservedBalance) < input.amount) {
        throw new InsufficientReservedBalanceError();
      }

      wallet.availableBalance = (
        Number(wallet.availableBalance) + input.amount
      ).toFixed(2);
      wallet.reservedBalance = (
        Number(wallet.reservedBalance) - input.amount
      ).toFixed(2);
      wallet.updatedAt = createdAt;

      this.syncTotalBalance(wallet);
      const savedWallet = await walletRepository.save(wallet);
      const movement = await this.saveReservationMovement(
        movementRepository,
        input,
        savedWallet.currency,
        'RELEASE',
        createdAt,
      );

      return this.toReservationResult(movement, savedWallet, input.amount);
    });
  }

  async captureReservedBalance(
    input: RecordReservationInput,
  ): Promise<WalletReservation> {
    if (!this.dataSource) {
      const createdAt = input.occurredAt ?? new Date();
      return {
        movementId: '0',
        traderId: input.traderId,
        amount: input.amount,
        availableBalance: 0,
        reservedBalance: 0,
        currency: input.currency,
        movementType: 'CAPTURE',
        sourceOrderId: input.sourceOrderId,
        createdAt,
      };
    }

    return this.dataSource.transaction(async (manager) => {
      const walletRepository = manager.getRepository(Wallet);
      const movementRepository = manager.getRepository(WalletMovement);
      const createdAt = input.occurredAt ?? new Date();
      const wallet = await walletRepository.findOne({
        where: { traderId: input.traderId },
      });

      if (!wallet || Number(wallet.reservedBalance) < input.amount) {
        throw new InsufficientReservedBalanceError();
      }

      wallet.reservedBalance = (
        Number(wallet.reservedBalance) - input.amount
      ).toFixed(2);
      wallet.updatedAt = createdAt;

      this.syncTotalBalance(wallet);
      const savedWallet = await walletRepository.save(wallet);
      const movement = await this.saveReservationMovement(
        movementRepository,
        input,
        savedWallet.currency,
        'CAPTURE',
        createdAt,
      );

      return this.toReservationResult(movement, savedWallet, input.amount);
    });
  }

  private syncTotalBalance(wallet: Wallet): void {
    wallet.balance = (
      Number(wallet.availableBalance) + Number(wallet.reservedBalance)
    ).toFixed(2);
  }

  private async saveReservationMovement(
    movementRepository: {
      create: (input: Partial<WalletMovement>) => WalletMovement;
      save: (input: WalletMovement) => Promise<WalletMovement>;
    },
    input: RecordReservationInput,
    currency: string,
    movementType: WalletReservationMovementType,
    createdAt: Date,
  ): Promise<WalletMovement> {
    return movementRepository.save(
      movementRepository.create({
        traderId: input.traderId,
        movementType,
        amount: input.amount.toFixed(2),
        currency,
        sourceOrderId: input.sourceOrderId ?? null,
        createdAt,
      }),
    );
  }

  private toReservationResult(
    movement: WalletMovement,
    wallet: Wallet,
    amount: number,
  ): WalletReservation {
    return {
      movementId: movement.id,
      traderId: wallet.traderId,
      amount,
      availableBalance: Number(wallet.availableBalance),
      reservedBalance: Number(wallet.reservedBalance),
      currency: wallet.currency,
      movementType: movement.movementType as WalletReservationMovementType,
      sourceOrderId: movement.sourceOrderId ?? undefined,
      createdAt: movement.createdAt,
    };
  }

  private emptyBalance(traderId: string): WalletBalance {
    return {
      traderId,
      availableBalance: 0,
      reservedBalance: 0,
      currency: 'USD',
    };
  }
}

export class InsufficientWalletBalanceError extends Error {
  constructor() {
    super('Insufficient available balance');
  }
}

export class InsufficientReservedBalanceError extends Error {
  constructor() {
    super('Insufficient reserved balance');
  }
}
