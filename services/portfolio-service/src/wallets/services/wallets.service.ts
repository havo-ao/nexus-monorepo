import { BadRequestException, Injectable } from '@nestjs/common';
import { WalletBalanceResponseDto } from '../dto/wallet-balance-response.dto';
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

  private assertValidTraderId(traderId: string): void {
    if (!traderId || traderId.trim().length === 0) {
      throw new BadRequestException('traderId is required');
    }
  }
}
