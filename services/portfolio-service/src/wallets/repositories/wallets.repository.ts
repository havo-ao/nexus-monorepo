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

export interface RecordDepositInput {
  traderId: string;
  amount: number;
  currency: string;
  sourceTransactionId?: string;
  depositedAt?: Date;
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
          availableBalance: input.amount.toFixed(2),
          reservedBalance: '0.00',
          currency: input.currency,
          createdAt,
          updatedAt: createdAt,
        });
      }

      const savedWallet = await walletRepository.save(wallet);
      await manager.query('UPDATE wallet SET balance = ? WHERE id = ?', [
        (
          Number(savedWallet.availableBalance) +
          Number(savedWallet.reservedBalance)
        ).toFixed(2),
        savedWallet.id,
      ]);

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

  private emptyBalance(traderId: string): WalletBalance {
    return {
      traderId,
      availableBalance: 0,
      reservedBalance: 0,
      currency: 'USD',
    };
  }
}
