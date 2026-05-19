import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioPositionsRepository } from '../repositories/portfolio-positions.repository';
import { PositionsService } from './positions.service';

describe('PositionsService', () => {
  let service: PositionsService;
  let positionsRepository: jest.Mocked<PortfolioPositionsRepository>;

  beforeEach(async () => {
    positionsRepository = {
      applyExecutedBuy: jest.fn(),
      applyExecutedSell: jest.fn(),
      findByTraderId: jest.fn(),
      findByTraderIdAndPositionId: jest.fn(),
    } as unknown as jest.Mocked<PortfolioPositionsRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PositionsService,
        {
          provide: PortfolioPositionsRepository,
          useValue: positionsRepository,
        },
      ],
    }).compile();

    service = module.get<PositionsService>(PositionsService);
  });

  it('records an executed buy with normalized identifiers', async () => {
    const executedAt = '2026-05-17T22:15:00.000Z';
    positionsRepository.applyExecutedBuy.mockResolvedValue({
      id: '15',
      traderId: '101',
      stockId: '25',
      quantity: 10,
      avgBuyPrice: '152.35',
      totalInvested: '1523.50',
      lastUpdated: new Date(executedAt),
    });

    await expect(
      service.recordExecutedBuy({
        traderId: ' 101 ',
        stockId: ' 25 ',
        quantity: 10,
        executionPrice: 152.35,
        sourceOrderId: ' 5001 ',
        sourceTransactionId: ' 7001 ',
        executedAt,
      }),
    ).resolves.toMatchObject({
      id: '15',
      traderId: '101',
      stockId: '25',
      quantity: 10,
    });

    expect(positionsRepository.applyExecutedBuy.mock.calls[0][0]).toEqual({
      traderId: '101',
      stockId: '25',
      quantity: 10,
      executionPrice: 152.35,
      sourceOrderId: '5001',
      sourceTransactionId: '7001',
      executedAt: new Date(executedAt),
    });
  });

  it('records an executed buy with the current timestamp when executedAt is omitted', async () => {
    positionsRepository.applyExecutedBuy.mockResolvedValue({
      id: '15',
      traderId: '101',
      stockId: '25',
      quantity: 10,
      avgBuyPrice: '152.35',
      totalInvested: '1523.50',
      lastUpdated: new Date('2026-05-17T22:15:00.000Z'),
    });

    await service.recordExecutedBuy({
      traderId: '101',
      stockId: '25',
      quantity: 10,
      executionPrice: 152.35,
    });

    expect(
      positionsRepository.applyExecutedBuy.mock.calls[0][0].executedAt,
    ).toBeInstanceOf(Date);
  });

  it('rejects missing trader identifiers', async () => {
    await expect(
      service.recordExecutedBuy({
        traderId: ' ',
        stockId: '25',
        quantity: 10,
        executionPrice: 152.35,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects missing stock identifiers', async () => {
    await expect(
      service.recordExecutedBuy({
        traderId: '101',
        stockId: ' ',
        quantity: 10,
        executionPrice: 152.35,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid executed buy quantities', async () => {
    await expect(
      service.recordExecutedBuy({
        traderId: '101',
        stockId: '25',
        quantity: 0,
        executionPrice: 152.35,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid execution prices', async () => {
    await expect(
      service.recordExecutedBuy({
        traderId: '101',
        stockId: '25',
        quantity: 10,
        executionPrice: -1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid execution dates', async () => {
    await expect(
      service.recordExecutedBuy({
        traderId: '101',
        stockId: '25',
        quantity: 10,
        executionPrice: 152.35,
        executedAt: 'not-a-date',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records an executed sell with normalized identifiers', async () => {
    const executedAt = '2026-05-18T20:45:00.000Z';
    positionsRepository.applyExecutedSell.mockResolvedValue({
      id: '15',
      traderId: '101',
      stockId: '25',
      quantity: 6,
      avgBuyPrice: '152.35',
      totalInvested: '914.10',
      lastUpdated: new Date(executedAt),
    });

    await expect(
      service.recordExecutedSell({
        traderId: ' 101 ',
        stockId: ' 25 ',
        quantity: 4,
        executionPrice: 178.45,
        sourceOrderId: ' 5002 ',
        sourceTransactionId: ' 7002 ',
        executedAt,
      }),
    ).resolves.toMatchObject({
      id: '15',
      traderId: '101',
      stockId: '25',
      quantity: 6,
    });

    expect(positionsRepository.applyExecutedSell.mock.calls[0][0]).toEqual({
      traderId: '101',
      stockId: '25',
      quantity: 4,
      executionPrice: 178.45,
      sourceOrderId: '5002',
      sourceTransactionId: '7002',
      executedAt: new Date(executedAt),
    });
  });

  it('rejects invalid executed sell quantities', async () => {
    await expect(
      service.recordExecutedSell({
        traderId: '101',
        stockId: '25',
        quantity: 0,
        executionPrice: 178.45,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
