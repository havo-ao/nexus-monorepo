import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InsufficientReservedBalanceError,
  InsufficientWalletBalanceError,
} from '../repositories/wallets.repository';
import { WalletsRepository } from '../repositories/wallets.repository';
import { WalletsService } from './wallets.service';

describe('WalletsService', () => {
  let service: WalletsService;
  let walletsRepository: jest.Mocked<WalletsRepository>;

  beforeEach(async () => {
    walletsRepository = {
      findBalanceByTraderId: jest.fn(),
      findMovementsByTraderId: jest.fn(),
      recordDeposit: jest.fn(),
      recordWithdrawal: jest.fn(),
      reserveBalance: jest.fn(),
      releaseReservedBalance: jest.fn(),
      captureReservedBalance: jest.fn(),
    } as unknown as jest.Mocked<WalletsRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        {
          provide: WalletsRepository,
          useValue: walletsRepository,
        },
      ],
    }).compile();

    service = module.get<WalletsService>(WalletsService);
  });

  it('returns the available, reserved, and total balance for a trader', async () => {
    walletsRepository.findBalanceByTraderId.mockResolvedValue({
      traderId: '101',
      availableBalance: 750.25,
      reservedBalance: 249.75,
      currency: 'USD',
    });

    await expect(service.getAvailableBalance(' 101 ')).resolves.toEqual({
      traderId: '101',
      availableBalance: 750.25,
      reservedBalance: 249.75,
      totalBalance: 1000,
      currency: 'USD',
    });

    expect(walletsRepository.findBalanceByTraderId.mock.calls[0][0]).toBe(
      '101',
    );
  });

  it('rejects empty trader identifiers', async () => {
    await expect(service.getAvailableBalance(' ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('records a deposit and returns the updated balance', async () => {
    const createdAt = new Date('2026-05-21T22:15:00.000Z');
    walletsRepository.recordDeposit.mockResolvedValue({
      movementId: '9001',
      traderId: '101',
      amount: 250,
      availableBalance: 1250,
      reservedBalance: 0,
      currency: 'USD',
      sourceTransactionId: 'pay_123456',
      createdAt,
    });

    await expect(
      service.recordDeposit(' 101 ', {
        amount: 250,
        currency: 'usd',
        sourceTransactionId: ' pay_123456 ',
        depositedAt: createdAt.toISOString(),
      }),
    ).resolves.toEqual({
      movementId: '9001',
      traderId: '101',
      amount: 250,
      availableBalance: 1250,
      reservedBalance: 0,
      totalBalance: 1250,
      currency: 'USD',
      movementType: 'DEPOSIT',
      sourceTransactionId: 'pay_123456',
      createdAt: createdAt.toISOString(),
    });

    expect(walletsRepository.recordDeposit.mock.calls[0][0]).toEqual({
      traderId: '101',
      amount: 250,
      currency: 'USD',
      sourceTransactionId: 'pay_123456',
      depositedAt: createdAt,
    });
  });

  it('returns wallet movement history from newest to oldest', async () => {
    const releasedAt = new Date('2026-05-22T14:30:00.000Z');
    const depositedAt = new Date('2026-05-21T22:15:00.000Z');
    walletsRepository.findMovementsByTraderId.mockResolvedValue([
      {
        movementId: '9102',
        traderId: '101',
        movementType: 'RELEASE',
        amount: 200,
        currency: 'USD',
        sourceOrderId: 'order_123456',
        createdAt: releasedAt,
      },
      {
        movementId: '9001',
        traderId: '101',
        movementType: 'DEPOSIT',
        amount: 250,
        currency: 'USD',
        sourceTransactionId: 'pay_123456',
        createdAt: depositedAt,
      },
    ]);

    await expect(service.getFinancialHistory(' 101 ')).resolves.toEqual({
      traderId: '101',
      movements: [
        {
          movementId: '9102',
          traderId: '101',
          movementType: 'RELEASE',
          amount: 200,
          currency: 'USD',
          sourceTransactionId: undefined,
          sourceOrderId: 'order_123456',
          createdAt: releasedAt.toISOString(),
        },
        {
          movementId: '9001',
          traderId: '101',
          movementType: 'DEPOSIT',
          amount: 250,
          currency: 'USD',
          sourceTransactionId: 'pay_123456',
          sourceOrderId: undefined,
          createdAt: depositedAt.toISOString(),
        },
      ],
    });

    expect(walletsRepository.findMovementsByTraderId.mock.calls[0][0]).toBe(
      '101',
    );
  });

  it('records a withdrawal and returns the updated balance', async () => {
    const createdAt = new Date('2026-05-23T16:20:00.000Z');
    walletsRepository.recordWithdrawal.mockResolvedValue({
      movementId: '9201',
      traderId: '101',
      amount: 150,
      availableBalance: 850,
      reservedBalance: 0,
      currency: 'USD',
      sourceTransactionId: 'wd_123456',
      createdAt,
    });

    await expect(
      service.recordWithdrawal(' 101 ', {
        amount: 150,
        currency: 'usd',
        sourceTransactionId: ' wd_123456 ',
        withdrawnAt: createdAt.toISOString(),
      }),
    ).resolves.toEqual({
      movementId: '9201',
      traderId: '101',
      amount: 150,
      availableBalance: 850,
      reservedBalance: 0,
      totalBalance: 850,
      currency: 'USD',
      movementType: 'WITHDRAWAL',
      sourceTransactionId: 'wd_123456',
      createdAt: createdAt.toISOString(),
    });

    expect(walletsRepository.recordWithdrawal.mock.calls[0][0]).toEqual({
      traderId: '101',
      amount: 150,
      currency: 'USD',
      sourceTransactionId: 'wd_123456',
      withdrawnAt: createdAt,
    });
  });

  it('rejects withdrawals when available balance is insufficient', async () => {
    walletsRepository.recordWithdrawal.mockRejectedValue(
      new InsufficientWalletBalanceError(),
    );

    await expect(
      service.recordWithdrawal('101', { amount: 150 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects withdrawal amounts that are not positive', async () => {
    await expect(
      service.recordWithdrawal('101', { amount: 0 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects withdrawal dates that cannot be parsed', async () => {
    await expect(
      service.recordWithdrawal('101', {
        amount: 100,
        withdrawnAt: 'not-a-date',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects deposit amounts that are not positive', async () => {
    await expect(
      service.recordDeposit('101', { amount: 0 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects deposit currencies that are not ISO-4217 codes', async () => {
    await expect(
      service.recordDeposit('101', { amount: 100, currency: 'USDT' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects deposit dates that cannot be parsed', async () => {
    await expect(
      service.recordDeposit('101', {
        amount: 100,
        depositedAt: 'not-a-date',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reserves available balance for an order', async () => {
    const createdAt = new Date('2026-05-22T14:15:00.000Z');
    walletsRepository.reserveBalance.mockResolvedValue({
      movementId: '9101',
      traderId: '101',
      amount: 450,
      availableBalance: 550,
      reservedBalance: 450,
      currency: 'USD',
      movementType: 'RESERVE',
      sourceOrderId: 'order_123456',
      createdAt,
    });

    await expect(
      service.reserveBalance(' 101 ', {
        amount: 450,
        currency: 'usd',
        sourceOrderId: ' order_123456 ',
        reservedAt: createdAt.toISOString(),
      }),
    ).resolves.toEqual({
      movementId: '9101',
      traderId: '101',
      amount: 450,
      availableBalance: 550,
      reservedBalance: 450,
      totalBalance: 1000,
      currency: 'USD',
      movementType: 'RESERVE',
      sourceOrderId: 'order_123456',
      createdAt: createdAt.toISOString(),
    });

    expect(walletsRepository.reserveBalance.mock.calls[0][0]).toEqual({
      traderId: '101',
      amount: 450,
      currency: 'USD',
      sourceOrderId: 'order_123456',
      occurredAt: createdAt,
    });
  });

  it('rejects reservations when available balance is insufficient', async () => {
    walletsRepository.reserveBalance.mockRejectedValue(
      new InsufficientWalletBalanceError(),
    );

    await expect(
      service.reserveBalance('101', { amount: 450 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects reservation amounts that are not positive', async () => {
    await expect(
      service.reserveBalance('101', { amount: -1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects reservation dates that cannot be parsed', async () => {
    await expect(
      service.reserveBalance('101', {
        amount: 100,
        reservedAt: 'not-a-date',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('propagates unexpected reservation errors', async () => {
    const error = new Error('database unavailable');
    walletsRepository.reserveBalance.mockRejectedValue(error);

    await expect(service.reserveBalance('101', { amount: 100 })).rejects.toBe(
      error,
    );
  });

  it('releases reserved balance for an order', async () => {
    const createdAt = new Date('2026-05-22T14:30:00.000Z');
    walletsRepository.releaseReservedBalance.mockResolvedValue({
      movementId: '9102',
      traderId: '101',
      amount: 200,
      availableBalance: 750,
      reservedBalance: 250,
      currency: 'USD',
      movementType: 'RELEASE',
      sourceOrderId: 'order_123456',
      createdAt,
    });

    await expect(
      service.releaseReservedBalance('101', {
        amount: 200,
        sourceOrderId: 'order_123456',
        releasedAt: createdAt.toISOString(),
      }),
    ).resolves.toEqual({
      movementId: '9102',
      traderId: '101',
      amount: 200,
      availableBalance: 750,
      reservedBalance: 250,
      totalBalance: 1000,
      currency: 'USD',
      movementType: 'RELEASE',
      sourceOrderId: 'order_123456',
      createdAt: createdAt.toISOString(),
    });
  });

  it('captures reserved balance after an executed order', async () => {
    const createdAt = new Date('2026-05-22T14:45:00.000Z');
    walletsRepository.captureReservedBalance.mockResolvedValue({
      movementId: '9103',
      traderId: '101',
      amount: 450,
      availableBalance: 550,
      reservedBalance: 0,
      currency: 'USD',
      movementType: 'CAPTURE',
      sourceOrderId: 'order_123456',
      createdAt,
    });

    await expect(
      service.captureReservedBalance('101', {
        amount: 450,
        sourceOrderId: 'order_123456',
        capturedAt: createdAt.toISOString(),
      }),
    ).resolves.toEqual({
      movementId: '9103',
      traderId: '101',
      amount: 450,
      availableBalance: 550,
      reservedBalance: 0,
      totalBalance: 550,
      currency: 'USD',
      movementType: 'CAPTURE',
      sourceOrderId: 'order_123456',
      createdAt: createdAt.toISOString(),
    });

    expect(walletsRepository.captureReservedBalance.mock.calls[0][0]).toEqual({
      traderId: '101',
      amount: 450,
      currency: 'USD',
      sourceOrderId: 'order_123456',
      occurredAt: createdAt,
    });
  });

  it('rejects releases when reserved balance is insufficient', async () => {
    walletsRepository.releaseReservedBalance.mockRejectedValue(
      new InsufficientReservedBalanceError(),
    );

    await expect(
      service.releaseReservedBalance('101', { amount: 450 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('propagates unexpected release errors', async () => {
    const error = new Error('database unavailable');
    walletsRepository.releaseReservedBalance.mockRejectedValue(error);

    await expect(
      service.releaseReservedBalance('101', { amount: 100 }),
    ).rejects.toBe(error);
  });
});
