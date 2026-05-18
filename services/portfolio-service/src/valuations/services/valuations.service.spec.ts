import { Test, TestingModule } from '@nestjs/testing';
import { MarketQuotesClient } from '../clients/market-quotes.client';
import { ValuationsService } from './valuations.service';

describe('ValuationsService', () => {
  let service: ValuationsService;
  let marketQuotesClient: jest.Mocked<MarketQuotesClient>;

  beforeEach(async () => {
    marketQuotesClient = {
      getLatestPrice: jest.fn(),
    } as jest.Mocked<MarketQuotesClient>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValuationsService,
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
});
