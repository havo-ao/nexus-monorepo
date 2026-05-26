import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MarketValidation } from '../../market-validation/entities/market-validation.entity';
import { MarketValidationService } from '../../market-validation/services/market-validation.service';
import { TradingOrder } from '../entities/trading-order';
import { ORDER_REPOSITORY } from '../repositories/order.repository';
import type { OrderRepository } from '../repositories/order.repository';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let marketValidationService: jest.Mocked<MarketValidationService>;
  let orderRepository: jest.Mocked<OrderRepository>;

  beforeEach(async () => {
    marketValidationService = {
      validateMarketStatus: jest.fn(),
    } as unknown as jest.Mocked<MarketValidationService>;

    orderRepository = {
      createMarketBuyOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: MarketValidationService,
          useValue: marketValidationService,
        },
        {
          provide: ORDER_REPOSITORY,
          useValue: orderRepository,
        },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  it('creates a market buy order after market validation', async () => {
    const order = new TradingOrder(
      '1',
      'order-reference',
      '101',
      'BUY',
      'MARKET',
      'PENDING_EXECUTION',
      'AAPL',
      '1',
      3,
      250,
      750,
      750,
      'USD',
      '2026-05-26T14:30:00.000Z',
    );
    marketValidationService.validateMarketStatus.mockResolvedValue(
      new MarketValidation(
        true,
        '1',
        'OPEN',
        '2026-05-26T14:30:00.000Z',
        'America/New_York',
        '09:30:00',
        '16:00:00',
      ),
    );
    orderRepository.createMarketBuyOrder.mockResolvedValue({
      approved: true,
      order,
      availableAmount: 1000,
      requiredAmount: 750,
    });

    await expect(
      service.createMarketBuyOrder({
        traderId: ' 101 ',
        symbol: ' aapl ',
        exchangeId: '1',
        quantity: 3,
        estimatedUnitPrice: 250,
        marketEvaluatedAt: '2026-05-26T14:30:00.000Z',
      }),
    ).resolves.toBe(order);

    expect(marketValidationService.validateMarketStatus.mock.calls[0]).toEqual([
      '1',
      '2026-05-26T14:30:00.000Z',
    ]);
    expect(orderRepository.createMarketBuyOrder.mock.calls[0][0]).toEqual({
      traderId: '101',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 3,
      estimatedUnitPrice: 250,
      grossAmount: 750,
      currency: 'USD',
    });
  });

  it('rejects order creation when market is closed', async () => {
    marketValidationService.validateMarketStatus.mockResolvedValue(
      new MarketValidation(
        false,
        '1',
        'CLOSED',
        '2026-05-26T22:00:00.000Z',
        'America/New_York',
        '09:30:00',
        '16:00:00',
        'Market is closed at this time',
      ),
    );

    await expect(
      service.createMarketBuyOrder({
        traderId: '101',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 3,
        estimatedUnitPrice: 250,
      }),
    ).rejects.toThrow(ConflictException);

    expect(orderRepository.createMarketBuyOrder.mock.calls).toHaveLength(0);
  });

  it('rejects order creation when funds cannot be reserved', async () => {
    marketValidationService.validateMarketStatus.mockResolvedValue(
      new MarketValidation(true, '1', 'OPEN', '2026-05-26T14:30:00.000Z'),
    );
    orderRepository.createMarketBuyOrder.mockResolvedValue({
      approved: false,
      reason: 'Insufficient available funds',
      availableAmount: 100,
      requiredAmount: 750,
    });

    await expect(
      service.createMarketBuyOrder({
        traderId: '101',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 3,
        estimatedUnitPrice: 250,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('validates required input before calling dependencies', async () => {
    await expect(
      service.createMarketBuyOrder({
        traderId: '',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 3,
        estimatedUnitPrice: 250,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(
      marketValidationService.validateMarketStatus.mock.calls,
    ).toHaveLength(0);
    expect(orderRepository.createMarketBuyOrder.mock.calls).toHaveLength(0);
  });

  it('requires positive quantity and estimated price', async () => {
    await expect(
      service.createMarketBuyOrder({
        traderId: '101',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 0,
        estimatedUnitPrice: 250,
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.createMarketBuyOrder({
        traderId: '101',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 1,
        estimatedUnitPrice: -1,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('requires symbol and exchange identifiers', async () => {
    await expect(
      service.createMarketBuyOrder({
        traderId: '101',
        symbol: '',
        exchangeId: '1',
        quantity: 1,
        estimatedUnitPrice: 250,
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.createMarketBuyOrder({
        traderId: '101',
        symbol: 'AAPL',
        exchangeId: '',
        quantity: 1,
        estimatedUnitPrice: 250,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('uses explicit currency when provided', async () => {
    const order = new TradingOrder(
      '1',
      'order-reference',
      '101',
      'BUY',
      'MARKET',
      'PENDING_EXECUTION',
      'AAPL',
      '1',
      1,
      250,
      250,
      250,
      'COP',
      '2026-05-26T14:30:00.000Z',
    );
    marketValidationService.validateMarketStatus.mockResolvedValue(
      new MarketValidation(true, '1', 'OPEN', '2026-05-26T14:30:00.000Z'),
    );
    orderRepository.createMarketBuyOrder.mockResolvedValue({
      approved: true,
      order,
      availableAmount: 1000,
      requiredAmount: 250,
    });

    await service.createMarketBuyOrder({
      traderId: '101',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 1,
      estimatedUnitPrice: 250,
      currency: ' cop ',
    });

    expect(orderRepository.createMarketBuyOrder.mock.calls[0][0].currency).toBe(
      'COP',
    );
  });
});
