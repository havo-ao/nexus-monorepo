import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PortfolioPositionsRepository } from '../../positions/repositories/portfolio-positions.repository';
import { PortfolioService } from './portfolio.service';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let positionsRepository: jest.Mocked<PortfolioPositionsRepository>;

  beforeEach(async () => {
    const repositoryMock: jest.Mocked<PortfolioPositionsRepository> = {
      findByTraderId: jest.fn(),
      findByTraderIdAndPositionId: jest.fn(),
    };
    positionsRepository = repositoryMock;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: PortfolioPositionsRepository,
          useValue: positionsRepository,
        },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
  });

  it('returns consolidated portfolio positions for a trader', async () => {
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
          currentPrice: null,
          currentValue: null,
          lastUpdated: '2026-05-10T22:15:00.000Z',
        },
      ],
      totalInvested: 1523.5,
      currentValue: null,
    });
  });

  it('returns an empty portfolio when the trader has no positions', async () => {
    positionsRepository.findByTraderId.mockResolvedValue([]);

    await expect(service.getConsolidatedPortfolio('7')).resolves.toEqual({
      traderId: '7',
      positions: [],
      totalInvested: 0,
      currentValue: 0,
    });
  });

  it('calculates current value only when a current price exists', () => {
    expect(service.calculateCurrentValue(10, null)).toBeNull();
    expect(service.calculateCurrentValue(10, 170.25)).toBe(1702.5);
  });

  it('returns the detail of a trader position', async () => {
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
      currentPrice: null,
      currentValue: null,
      lastUpdated: '2026-05-10T22:15:00.000Z',
    });
  });

  it('throws not found when the position does not belong to the trader', async () => {
    positionsRepository.findByTraderIdAndPositionId.mockResolvedValue(null);

    await expect(service.getPositionDetail('7', '99')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
