import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { roundMoney } from '../../common/money';
import { FundsValidationEvent } from '../entities/funds-validation-event.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';
import {
  FundsReservationResult,
  TraderFundsRepository,
} from './trader-funds.repository';

@Injectable()
export class TypeOrmTraderFundsRepository implements TraderFundsRepository {
  constructor(private readonly dataSource: DataSource) {}

  reserveBuyFunds(
    traderId: string,
    requiredAmount: number,
  ): Promise<FundsReservationResult> {
    return this.dataSource.transaction((manager) =>
      this.reserveBuyFundsInTransaction(manager, traderId, requiredAmount),
    );
  }

  private async reserveBuyFundsInTransaction(
    manager: EntityManager,
    traderId: string,
    requiredAmount: number,
  ): Promise<FundsReservationResult> {
    const walletRepository = manager.getRepository(Wallet);
    const eventRepository = manager.getRepository(FundsValidationEvent);
    const wallet = await walletRepository.findOne({
      where: { traderId },
      lock: { mode: 'pessimistic_write' },
    });

    const availableAmount = roundMoney(
      wallet ? Number(wallet.availableBalance) : 0,
    );
    const currentReservedAmount = roundMoney(
      wallet ? Number(wallet.reservedBalance) : 0,
    );

    if (!wallet || availableAmount < requiredAmount) {
      const result = {
        approved: false,
        traderId,
        availableAmount,
        requiredAmount,
        reservedAmount: currentReservedAmount,
        reason: 'Insufficient available funds',
      };
      await eventRepository.save(this.toEvent(result));
      return result;
    }

    const result = {
      approved: true,
      traderId,
      availableAmount,
      requiredAmount,
      reservedAmount: roundMoney(currentReservedAmount + requiredAmount),
    };

    wallet.availableBalance = this.toDecimal(availableAmount - requiredAmount);
    wallet.reservedBalance = this.toDecimal(result.reservedAmount);
    await walletRepository.save(wallet);
    await eventRepository.save(this.toEvent(result));

    return result;
  }

  private toEvent(result: FundsReservationResult): FundsValidationEvent {
    const event = new FundsValidationEvent();
    event.traderId = result.traderId;
    event.validationType = 'BUY_FUNDS_RESERVATION';
    event.approved = result.approved;
    event.requiredAmount = this.toDecimal(result.requiredAmount);
    event.availableAmount = this.toDecimal(result.availableAmount);
    event.reservedAmount = this.toDecimal(result.reservedAmount);
    event.reason = result.reason;
    return event;
  }

  private toDecimal(value: number): string {
    return roundMoney(value).toFixed(2);
  }
}
