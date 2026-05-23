import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PortfolioPositionsRepository } from '../../positions/repositories/portfolio-positions.repository';
import { PositionsService } from '../../positions/services/positions.service';
import { ValuationsService } from '../../valuations/services/valuations.service';
import { WalletsService } from '../../wallets/services/wallets.service';
import { PortfolioService } from './portfolio.service';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let positionsRepository: jest.Mocked<PortfolioPositionsRepository>;
  let positionsService: jest.Mocked<PositionsService>;
  let valuationsService: jest.Mocked<ValuationsService>;
  let walletsService: jest.Mocked<WalletsService>;

  beforeEach(async () => {
    const repositoryMock: jest.Mocked<PortfolioPositionsRepository> = {
      findByTraderId: jest.fn(),
      findByTraderIdAndPositionId: jest.fn(),
    };
    positionsRepository = repositoryMock;
    positionsService = {
      recordExecutedBuy: jest.fn(),
      recordExecutedSell: jest.fn(),
    } as unknown as jest.Mocked<PositionsService>;
    valuationsService = {
      valuePosition: jest.fn(),
      calculateCurrentValue: jest.fn(),
      calculateProfitLoss: jest.fn(),
      calculateReturnPercentage: jest.fn(),
      calculateSectorDistribution: jest.fn(),
    } as jest.Mocked<ValuationsService>;
    valuationsService.valuePosition.mockResolvedValue({
      currentPrice: null,
      currentValue: null,
      profitLoss: null,
      returnPercentage: null,
    });
    valuationsService.calculateCurrentValue.mockImplementation(
      (quantity: number, currentPrice: number | null) =>
        currentPrice === null ? null : quantity * currentPrice,
    );
    valuationsService.calculateProfitLoss.mockImplementation(
      (currentValue: number | null, totalInvested: number) =>
        currentValue === null
          ? null
          : Number((currentValue - totalInvested).toFixed(2)),
    );
    valuationsService.calculateReturnPercentage.mockImplementation(
      (profitLoss: number | null, totalInvested: number) =>
        profitLoss === null || totalInvested === 0
          ? null
          : Number(((profitLoss / totalInvested) * 100).toFixed(4)),
    );
    valuationsService.calculateSectorDistribution.mockResolvedValue({
      totalValue: 0,
      sectors: [],
    });
    walletsService = {
      getAvailableBalance: jest.fn(),
      getFinancialHistory: jest.fn(),
      recordDeposit: jest.fn(),
      recordWithdrawal: jest.fn(),
      reserveBalance: jest.fn(),
      releaseReservedBalance: jest.fn(),
    } as unknown as jest.Mocked<WalletsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: PortfolioPositionsRepository,
          useValue: positionsRepository,
        },
        {
          provide: PositionsService,
          useValue: positionsService,
        },
        {
          provide: ValuationsService,
          useValue: valuationsService,
        },
        {
          provide: WalletsService,
          useValue: walletsService,
        },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
  });

  it('returns consolidated portfolio positions for a trader', async () => {
    valuationsService.valuePosition.mockResolvedValue({
      currentPrice: 189.42,
      currentValue: 1894.2,
      profitLoss: 370.7,
      returnPercentage: 24.3321,
    });
    positionsRepository.findByTraderId.mockResolvedValue([
      {
        id: '15',
        traderId: '7',
        stockId: '25',
        symbol: 'AAPL',
        quantity: 10,
        avgBuyPrice: '152.35',
        totalInvested: '1523.50',
        lastUpdated: new Date('2026-05-10T22:15:00.000Z'),
      },
    ]);

    await expect(service.getConsolidatedPortfolio('7')).resolves.toEqual({
      traderId: '7',
      positions: [
        {
          positionId: '15',
          stockId: '25',
          symbol: 'AAPL',
          quantity: 10,
          averageBuyPrice: 152.35,
          totalInvested: 1523.5,
          currentPrice: 189.42,
          currentValue: 1894.2,
          profitLoss: 370.7,
          returnPercentage: 24.3321,
          lastUpdated: '2026-05-10T22:15:00.000Z',
        },
      ],
      totalInvested: 1523.5,
      currentValue: 1894.2,
      profitLoss: 370.7,
      returnPercentage: 24.3321,
    });
  });

  it('returns an empty portfolio when the trader has no positions', async () => {
    positionsRepository.findByTraderId.mockResolvedValue([]);

    await expect(service.getConsolidatedPortfolio('7')).resolves.toEqual({
      traderId: '7',
      positions: [],
      totalInvested: 0,
      currentValue: 0,
      profitLoss: 0,
      returnPercentage: null,
    });
  });

  it('keeps consolidated current value null when one position cannot be valued', async () => {
    valuationsService.valuePosition
      .mockResolvedValueOnce({
        currentPrice: 189.42,
        currentValue: 1894.2,
        profitLoss: 370.7,
        returnPercentage: 24.3321,
      })
      .mockResolvedValueOnce({
        currentPrice: null,
        currentValue: null,
        profitLoss: null,
        returnPercentage: null,
      });
    valuationsService.calculateProfitLoss.mockReturnValue(null);
    valuationsService.calculateReturnPercentage.mockReturnValue(null);
    positionsRepository.findByTraderId.mockResolvedValue([
      {
        id: '15',
        traderId: '7',
        stockId: '25',
        symbol: 'AAPL',
        quantity: 10,
        avgBuyPrice: '152.35',
        totalInvested: '1523.50',
        lastUpdated: new Date('2026-05-10T22:15:00.000Z'),
      },
      {
        id: '16',
        traderId: '7',
        stockId: '26',
        symbol: null,
        quantity: 3,
        avgBuyPrice: '100.00',
        totalInvested: '300.00',
        lastUpdated: new Date('2026-05-10T22:15:00.000Z'),
      },
    ]);

    await expect(service.getConsolidatedPortfolio('7')).resolves.toMatchObject({
      traderId: '7',
      currentValue: null,
      profitLoss: null,
      returnPercentage: null,
    });
  });

  it('calculates current value only when a current price exists', () => {
    expect(service.calculateCurrentValue(10, null)).toBeNull();
    expect(service.calculateCurrentValue(10, 170.25)).toBe(1702.5);
  });

  it('returns the detail of a trader position', async () => {
    valuationsService.valuePosition.mockResolvedValue({
      currentPrice: 189.42,
      currentValue: 1894.2,
      profitLoss: 370.7,
      returnPercentage: 24.3321,
    });
    positionsRepository.findByTraderIdAndPositionId.mockResolvedValue({
      id: '15',
      traderId: '7',
      stockId: '25',
      symbol: 'AAPL',
      quantity: 10,
      avgBuyPrice: '152.35',
      totalInvested: '1523.50',
      lastUpdated: new Date('2026-05-10T22:15:00.000Z'),
    });

    await expect(service.getPositionDetail('7', '15')).resolves.toEqual({
      positionId: '15',
      stockId: '25',
      symbol: 'AAPL',
      quantity: 10,
      averageBuyPrice: 152.35,
      totalInvested: 1523.5,
      currentPrice: 189.42,
      currentValue: 1894.2,
      profitLoss: 370.7,
      returnPercentage: 24.3321,
      lastUpdated: '2026-05-10T22:15:00.000Z',
    });
  });

  it('throws not found when the position does not belong to the trader', async () => {
    positionsRepository.findByTraderIdAndPositionId.mockResolvedValue(null);

    await expect(service.getPositionDetail('7', '99')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns sector distribution for trader positions', async () => {
    valuationsService.valuePosition.mockResolvedValue({
      currentPrice: 189.42,
      currentValue: 1894.2,
      profitLoss: 370.7,
      returnPercentage: 24.3321,
    });
    valuationsService.calculateSectorDistribution.mockResolvedValue({
      totalValue: 1894.2,
      sectors: [
        {
          sector: 'Technology',
          value: 1894.2,
          percentage: 100,
          positions: 1,
        },
      ],
    });
    positionsRepository.findByTraderId.mockResolvedValue([
      {
        id: '15',
        traderId: '7',
        stockId: '25',
        symbol: 'AAPL',
        quantity: 10,
        avgBuyPrice: '152.35',
        totalInvested: '1523.50',
        lastUpdated: new Date('2026-05-10T22:15:00.000Z'),
      },
    ]);

    await expect(service.getSectorDistribution('7')).resolves.toEqual({
      traderId: '7',
      totalValue: 1894.2,
      sectors: [
        {
          sector: 'Technology',
          value: 1894.2,
          percentage: 100,
          positions: 1,
        },
      ],
    });
  });

  it('returns wallet balance for a trader', async () => {
    walletsService.getAvailableBalance.mockResolvedValue({
      traderId: '7',
      availableBalance: 750.25,
      reservedBalance: 249.75,
      totalBalance: 1000,
      currency: 'USD',
    });

    await expect(service.getAvailableBalance('7')).resolves.toEqual({
      traderId: '7',
      availableBalance: 750.25,
      reservedBalance: 249.75,
      totalBalance: 1000,
      currency: 'USD',
    });

    expect(walletsService.getAvailableBalance.mock.calls[0][0]).toBe('7');
  });

  it('records a deposit for a trader wallet', async () => {
    const response = {
      movementId: '9001',
      traderId: '7',
      amount: 250,
      availableBalance: 1000,
      reservedBalance: 0,
      totalBalance: 1000,
      currency: 'USD',
      movementType: 'DEPOSIT' as const,
      sourceTransactionId: 'pay_123456',
      createdAt: '2026-05-21T22:15:00.000Z',
    };
    const request = {
      amount: 250,
      currency: 'USD',
      sourceTransactionId: 'pay_123456',
      depositedAt: '2026-05-21T22:15:00.000Z',
    };
    walletsService.recordDeposit.mockResolvedValue(response);

    await expect(service.recordDeposit('7', request)).resolves.toEqual(
      response,
    );

    expect(walletsService.recordDeposit.mock.calls[0]).toEqual(['7', request]);
  });

  it('returns financial history for a trader wallet', async () => {
    const response = {
      traderId: '7',
      movements: [
        {
          movementId: '9001',
          traderId: '7',
          movementType: 'DEPOSIT',
          amount: 250,
          currency: 'USD',
          sourceTransactionId: 'pay_123456',
          createdAt: '2026-05-21T22:15:00.000Z',
        },
      ],
    };
    walletsService.getFinancialHistory.mockResolvedValue(response);

    await expect(service.getFinancialHistory('7')).resolves.toEqual(response);

    expect(walletsService.getFinancialHistory.mock.calls[0][0]).toBe('7');
  });

  it('records a withdrawal for a trader wallet', async () => {
    const response = {
      movementId: '9201',
      traderId: '7',
      amount: 150,
      availableBalance: 850,
      reservedBalance: 0,
      totalBalance: 850,
      currency: 'USD',
      movementType: 'WITHDRAWAL' as const,
      sourceTransactionId: 'wd_123456',
      createdAt: '2026-05-23T16:20:00.000Z',
    };
    const request = {
      amount: 150,
      currency: 'USD',
      sourceTransactionId: 'wd_123456',
      withdrawnAt: '2026-05-23T16:20:00.000Z',
    };
    walletsService.recordWithdrawal.mockResolvedValue(response);

    await expect(service.recordWithdrawal('7', request)).resolves.toEqual(
      response,
    );

    expect(walletsService.recordWithdrawal.mock.calls[0]).toEqual([
      '7',
      request,
    ]);
  });

  it('reserves balance for a trader order', async () => {
    const response = {
      movementId: '9101',
      traderId: '7',
      amount: 450,
      availableBalance: 550,
      reservedBalance: 450,
      totalBalance: 1000,
      currency: 'USD',
      movementType: 'RESERVE' as const,
      sourceOrderId: 'order_123456',
      createdAt: '2026-05-22T14:15:00.000Z',
    };
    const request = {
      amount: 450,
      sourceOrderId: 'order_123456',
      reservedAt: '2026-05-22T14:15:00.000Z',
    };
    walletsService.reserveBalance.mockResolvedValue(response);

    await expect(service.reserveBalance('7', request)).resolves.toEqual(
      response,
    );

    expect(walletsService.reserveBalance.mock.calls[0]).toEqual(['7', request]);
  });

  it('releases reserved balance for a trader order', async () => {
    const response = {
      movementId: '9102',
      traderId: '7',
      amount: 200,
      availableBalance: 750,
      reservedBalance: 250,
      totalBalance: 1000,
      currency: 'USD',
      movementType: 'RELEASE' as const,
      sourceOrderId: 'order_123456',
      createdAt: '2026-05-22T14:30:00.000Z',
    };
    const request = {
      amount: 200,
      sourceOrderId: 'order_123456',
      releasedAt: '2026-05-22T14:30:00.000Z',
    };
    walletsService.releaseReservedBalance.mockResolvedValue(response);

    await expect(service.releaseReservedBalance('7', request)).resolves.toEqual(
      response,
    );

    expect(walletsService.releaseReservedBalance.mock.calls[0]).toEqual([
      '7',
      request,
    ]);
  });

  it('returns the updated position after an executed buy is recorded', async () => {
    valuationsService.valuePosition.mockResolvedValue({
      currentPrice: 190,
      currentValue: 1900,
      profitLoss: 376.5,
      returnPercentage: 24.7135,
    });
    positionsService.recordExecutedBuy.mockResolvedValue({
      id: '15',
      traderId: '7',
      stockId: '25',
      symbol: 'AAPL',
      quantity: 10,
      avgBuyPrice: '152.35',
      totalInvested: '1523.50',
      lastUpdated: new Date('2026-05-17T22:15:00.000Z'),
    });

    await expect(
      service.recordExecutedBuy({
        traderId: '7',
        stockId: '25',
        quantity: 10,
        executionPrice: 152.35,
      }),
    ).resolves.toEqual({
      positionId: '15',
      stockId: '25',
      symbol: 'AAPL',
      quantity: 10,
      averageBuyPrice: 152.35,
      totalInvested: 1523.5,
      currentPrice: 190,
      currentValue: 1900,
      profitLoss: 376.5,
      returnPercentage: 24.7135,
      lastUpdated: '2026-05-17T22:15:00.000Z',
    });
  });

  it('returns the updated position after an executed sell is recorded', async () => {
    valuationsService.valuePosition.mockResolvedValue({
      currentPrice: 190,
      currentValue: 1140,
      profitLoss: 225.9,
      returnPercentage: 24.7135,
    });
    positionsService.recordExecutedSell.mockResolvedValue({
      id: '15',
      traderId: '7',
      stockId: '25',
      symbol: 'AAPL',
      quantity: 6,
      avgBuyPrice: '152.35',
      totalInvested: '914.10',
      lastUpdated: new Date('2026-05-18T20:45:00.000Z'),
    });

    await expect(
      service.recordExecutedSell({
        traderId: '7',
        stockId: '25',
        quantity: 4,
        executionPrice: 178.45,
      }),
    ).resolves.toEqual({
      positionId: '15',
      stockId: '25',
      symbol: 'AAPL',
      quantity: 6,
      averageBuyPrice: 152.35,
      totalInvested: 914.1,
      currentPrice: 190,
      currentValue: 1140,
      profitLoss: 225.9,
      returnPercentage: 24.7135,
      lastUpdated: '2026-05-18T20:45:00.000Z',
    });
  });
});
