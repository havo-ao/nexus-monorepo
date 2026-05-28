import { Test, TestingModule } from '@nestjs/testing';
import { MarketInstrumentsClient } from '../clients/market-instruments.client';
import { MarketQuotesClient } from '../clients/market-quotes.client';
import { ValuationsService } from './valuations.service';

describe('ValuationsService', () => {
  let service: ValuationsService;
  let marketInstrumentsClient: jest.Mocked<MarketInstrumentsClient>;
  let marketQuotesClient: jest.Mocked<MarketQuotesClient>;

  beforeEach(async () => {
    marketInstrumentsClient = {
      getSector: jest.fn(),
    } as jest.Mocked<MarketInstrumentsClient>;
    marketQuotesClient = {
      getLatestPrice: jest.fn(),
    } as jest.Mocked<MarketQuotesClient>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValuationsService,
        {
          provide: MarketInstrumentsClient,
          useValue: marketInstrumentsClient,
        },
        {
          provide: MarketQuotesClient,
          useValue: marketQuotesClient,
        },
      ],
    }).compile();

    service = module.get<ValuationsService>(ValuationsService);
  });

  it('calculates the current value when market price is available', async () => {
    marketQuotesClient.getLatestPrice.mockResolvedValue(189.42);

    await expect(
      service.valuePosition({
        symbol: 'AAPL',
        quantity: 10,
        totalInvested: 1523.5,
      }),
    ).resolves.toEqual({
      currentPrice: 189.42,
      currentValue: 1894.2,
      profitLoss: 370.7,
      returnPercentage: 24.3321,
    });
  });

  it('keeps valuation fields null when market price is unavailable', async () => {
    marketQuotesClient.getLatestPrice.mockResolvedValue(null);

    await expect(
      service.valuePosition({
        symbol: 'AAPL',
        quantity: 10,
        totalInvested: 1523.5,
      }),
    ).resolves.toEqual({
      currentPrice: null,
      currentValue: null,
      profitLoss: null,
      returnPercentage: null,
    });
  });

  it('does not call market-service when the position has no symbol', async () => {
    await expect(
      service.valuePosition({
        symbol: null,
        quantity: 10,
        totalInvested: 1523.5,
      }),
    ).resolves.toEqual({
      currentPrice: null,
      currentValue: null,
      profitLoss: null,
      returnPercentage: null,
    });
    expect(marketQuotesClient.getLatestPrice.mock.calls).toHaveLength(0);
  });

  it('does not calculate return percentage when invested value is zero', () => {
    expect(service.calculateReturnPercentage(100, 0)).toBeNull();
  });

  it('calculates sector distribution ordered by exposure value', async () => {
    marketInstrumentsClient.getSector.mockImplementation((symbol: string) =>
      Promise.resolve(symbol === 'AAPL' ? 'Technology' : 'Financials'),
    );

    await expect(
      service.calculateSectorDistribution([
        { symbol: 'AAPL', currentValue: 200, totalInvested: 150 },
        { symbol: 'MSFT', currentValue: null, totalInvested: 100 },
      ]),
    ).resolves.toEqual({
      totalValue: 300,
      sectors: [
        {
          sector: 'Technology',
          value: 200,
          percentage: 66.6667,
          positions: 1,
        },
        {
          sector: 'Financials',
          value: 100,
          percentage: 33.3333,
          positions: 1,
        },
      ],
    });
  });

  it('uses unknown sector when instrument metadata is unavailable', async () => {
    marketInstrumentsClient.getSector.mockResolvedValue(null);

    await expect(
      service.calculateSectorDistribution([
        { symbol: 'AAPL', currentValue: null, totalInvested: 150 },
      ]),
    ).resolves.toEqual({
      totalValue: 150,
      sectors: [
        {
          sector: 'Unknown',
          value: 150,
          percentage: 100,
          positions: 1,
        },
      ],
    });
  });

  it('uses unknown sector without calling market-service when symbol is missing', async () => {
    await expect(
      service.calculateSectorDistribution([
        { symbol: null, currentValue: 200, totalInvested: 150 },
      ]),
    ).resolves.toEqual({
      totalValue: 200,
      sectors: [
        {
          sector: 'Unknown',
          value: 200,
          percentage: 100,
          positions: 1,
        },
      ],
    });
    expect(marketInstrumentsClient.getSector.mock.calls).toHaveLength(0);
  });
});
