import { Injectable, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';

export interface WalletBalance {
  traderId: string;
  availableBalance: number;
  reservedBalance: number;
  currency: string;
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

  private emptyBalance(traderId: string): WalletBalance {
    return {
      traderId,
      availableBalance: 0,
      reservedBalance: 0,
      currency: 'USD',
    };
  }
}
