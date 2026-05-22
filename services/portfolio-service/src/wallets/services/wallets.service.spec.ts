import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WalletsRepository } from '../repositories/wallets.repository';
import { WalletsService } from './wallets.service';

describe('WalletsService', () => {
  let service: WalletsService;
  let walletsRepository: jest.Mocked<WalletsRepository>;

  beforeEach(async () => {
    walletsRepository = {
      findBalanceByTraderId: jest.fn(),
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
});
