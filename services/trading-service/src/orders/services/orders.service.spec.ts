import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HoldingsValidation } from '../../holdings-validation/entities/holdings-validation.entity';
import { HoldingsValidationService } from '../../holdings-validation/services/holdings-validation.service';
import { MarketValidation } from '../../market-validation/entities/market-validation.entity';
import { MarketValidationService } from '../../market-validation/services/market-validation.service';
import { TradingOrder } from '../entities/trading-order';
import { ORDER_REPOSITORY } from '../repositories/order.repository';
import type { OrderRepository } from '../repositories/order.repository';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let marketValidationService: jest.Mocked<MarketValidationService>;
  let holdingsValidationService: jest.Mocked<HoldingsValidationService>;
  let orderRepository: jest.Mocked<OrderRepository>;

  beforeEach(async () => {
    marketValidationService = {
      validateMarketStatus: jest.fn(),
    } as unknown as jest.Mocked<MarketValidationService>;
    holdingsValidationService = {
      validateSellHoldings: jest.fn(),
    } as unknown as jest.Mocked<HoldingsValidationService>;

    orderRepository = {
      createMarketBuyOrder: jest.fn(),
      createLimitBuyOrder: jest.fn(),
      createMarketSellOrder: jest.fn(),
      createLimitSellOrder: jest.fn(),
      createStopLossOrder: jest.fn(),
      createTakeProfitOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: MarketValidationService,
          useValue: marketValidationService,
        },
        {
          provide: HoldingsValidationService,
          useValue: holdingsValidationService,
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

  it('queues a market buy order when market is closed', async () => {
    const order = new TradingOrder(
      '1',
      'closed-market-order-reference',
      '101',
      'BUY',
      'MARKET',
      'PENDING_MARKET_OPEN',
      'AAPL',
      '1',
      3,
      250,
      750,
      750,
      'USD',
      '2026-05-26T22:00:00.000Z',
    );
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
    orderRepository.createMarketBuyOrder.mockResolvedValue({
      approved: true,
      order,
      availableAmount: 1000,
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
    ).resolves.toBe(order);

    expect(orderRepository.createMarketBuyOrder.mock.calls[0][0]).toMatchObject(
      {
        initialStatus: 'PENDING_MARKET_OPEN',
        statusReason: 'Market buy order queued until market opens',
      },
    );
  });

  it('rejects market buy order creation when market is closed and queue is disabled', async () => {
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
        queueWhenMarketClosed: false,
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

  it('creates a limit buy order pending price condition', async () => {
    const order = new TradingOrder(
      '2',
      'limit-order-reference',
      '101',
      'BUY',
      'LIMIT',
      'PENDING_CONDITION',
      'AAPL',
      '1',
      2,
      240,
      480,
      480,
      'USD',
      '2026-05-26T14:30:00.000Z',
      240,
    );
    orderRepository.createLimitBuyOrder.mockResolvedValue({
      approved: true,
      order,
      availableAmount: 1000,
      requiredAmount: 480,
    });

    await expect(
      service.createLimitBuyOrder({
        traderId: ' 101 ',
        symbol: ' aapl ',
        exchangeId: '1',
        quantity: 2,
        limitPrice: 240,
      }),
    ).resolves.toBe(order);

    expect(
      marketValidationService.validateMarketStatus.mock.calls,
    ).toHaveLength(0);
    expect(orderRepository.createLimitBuyOrder.mock.calls[0][0]).toEqual({
      traderId: '101',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 2,
      limitPrice: 240,
      grossAmount: 480,
      currency: 'USD',
    });
  });

  it('rejects limit buy order creation when funds cannot be reserved', async () => {
    orderRepository.createLimitBuyOrder.mockResolvedValue({
      approved: false,
      reason: 'Insufficient available funds',
      availableAmount: 100,
      requiredAmount: 480,
    });

    await expect(
      service.createLimitBuyOrder({
        traderId: '101',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 2,
        limitPrice: 240,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('creates a market sell order after market and holdings validation', async () => {
    const order = new TradingOrder(
      '3',
      'sell-order-reference',
      '101',
      'SELL',
      'MARKET',
      'PENDING_EXECUTION',
      'AAPL',
      '1',
      3,
      250,
      750,
      0,
      'USD',
      '2026-05-26T14:30:00.000Z',
      undefined,
      undefined,
      '1',
    );
    marketValidationService.validateMarketStatus.mockResolvedValue(
      new MarketValidation(true, '1', 'OPEN', '2026-05-26T14:30:00.000Z'),
    );
    holdingsValidationService.validateSellHoldings.mockResolvedValue(
      new HoldingsValidation(true, '101', '1', 3, 10, 'AAPL'),
    );
    orderRepository.createMarketSellOrder.mockResolvedValue({
      approved: true,
      order,
      requiredQuantity: 3,
    });

    await expect(
      service.createMarketSellOrder({
        traderId: ' 101 ',
        stockId: ' 1 ',
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
    expect(
      holdingsValidationService.validateSellHoldings.mock.calls[0][0],
    ).toEqual({
      traderId: ' 101 ',
      stockId: ' 1 ',
      symbol: ' aapl ',
      quantity: 3,
    });
    expect(orderRepository.createMarketSellOrder.mock.calls[0][0]).toEqual({
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 3,
      estimatedUnitPrice: 250,
      grossAmount: 750,
      currency: 'USD',
    });
  });

  it('rejects market sell order creation when holdings are insufficient', async () => {
    marketValidationService.validateMarketStatus.mockResolvedValue(
      new MarketValidation(true, '1', 'OPEN', '2026-05-26T14:30:00.000Z'),
    );
    holdingsValidationService.validateSellHoldings.mockResolvedValue(
      new HoldingsValidation(
        false,
        '101',
        '1',
        12,
        10,
        'AAPL',
        'Insufficient available holdings',
      ),
    );

    await expect(
      service.createMarketSellOrder({
        traderId: '101',
        stockId: '1',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 12,
        estimatedUnitPrice: 250,
      }),
    ).rejects.toThrow(ConflictException);

    expect(orderRepository.createMarketSellOrder.mock.calls).toHaveLength(0);
  });

  it('rejects market sell order creation when market is closed and queue is disabled', async () => {
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
      service.createMarketSellOrder({
        traderId: '101',
        stockId: '1',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 3,
        estimatedUnitPrice: 250,
        queueWhenMarketClosed: false,
      }),
    ).rejects.toThrow(ConflictException);

    expect(
      holdingsValidationService.validateSellHoldings.mock.calls,
    ).toHaveLength(0);
    expect(orderRepository.createMarketSellOrder.mock.calls).toHaveLength(0);
  });

  it('queues a market sell order when market is closed', async () => {
    const order = new TradingOrder(
      '3',
      'closed-market-sell-order-reference',
      '101',
      'SELL',
      'MARKET',
      'PENDING_MARKET_OPEN',
      'AAPL',
      '1',
      3,
      250,
      750,
      0,
      'USD',
      '2026-05-26T22:00:00.000Z',
      undefined,
      undefined,
      '1',
    );
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
    holdingsValidationService.validateSellHoldings.mockResolvedValue(
      new HoldingsValidation(true, '101', '1', 3, 10, 'AAPL'),
    );
    orderRepository.createMarketSellOrder.mockResolvedValue({
      approved: true,
      order,
      requiredQuantity: 3,
    });

    await expect(
      service.createMarketSellOrder({
        traderId: '101',
        stockId: '1',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 3,
        estimatedUnitPrice: 250,
      }),
    ).resolves.toBe(order);

    expect(
      holdingsValidationService.validateSellHoldings.mock.calls,
    ).toHaveLength(1);
    expect(
      orderRepository.createMarketSellOrder.mock.calls[0][0],
    ).toMatchObject({
      initialStatus: 'PENDING_MARKET_OPEN',
      statusReason: 'Market sell order queued until market opens',
    });
  });

  it('rejects market sell order creation when persistence fails', async () => {
    marketValidationService.validateMarketStatus.mockResolvedValue(
      new MarketValidation(true, '1', 'OPEN', '2026-05-26T14:30:00.000Z'),
    );
    holdingsValidationService.validateSellHoldings.mockResolvedValue(
      new HoldingsValidation(true, '101', '1', 3, 10, 'AAPL'),
    );
    orderRepository.createMarketSellOrder.mockResolvedValue({
      approved: false,
      reason: 'Unable to create order',
      requiredQuantity: 3,
    });

    await expect(
      service.createMarketSellOrder({
        traderId: '101',
        stockId: '1',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 3,
        estimatedUnitPrice: 250,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('creates a limit sell order pending price condition', async () => {
    const order = new TradingOrder(
      '4',
      'limit-sell-order-reference',
      '101',
      'SELL',
      'LIMIT',
      'PENDING_CONDITION',
      'AAPL',
      '1',
      3,
      260,
      780,
      0,
      'USD',
      '2026-05-26T14:30:00.000Z',
      260,
      undefined,
      '1',
    );
    holdingsValidationService.validateSellHoldings.mockResolvedValue(
      new HoldingsValidation(true, '101', '1', 3, 10, 'AAPL'),
    );
    orderRepository.createLimitSellOrder.mockResolvedValue({
      approved: true,
      order,
      requiredQuantity: 3,
    });

    await expect(
      service.createLimitSellOrder({
        traderId: ' 101 ',
        stockId: ' 1 ',
        symbol: ' aapl ',
        exchangeId: '1',
        quantity: 3,
        limitPrice: 260,
      }),
    ).resolves.toBe(order);

    expect(
      marketValidationService.validateMarketStatus.mock.calls,
    ).toHaveLength(0);
    expect(
      holdingsValidationService.validateSellHoldings.mock.calls[0][0],
    ).toEqual({
      traderId: ' 101 ',
      stockId: ' 1 ',
      symbol: ' aapl ',
      quantity: 3,
    });
    expect(orderRepository.createLimitSellOrder.mock.calls[0][0]).toEqual({
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 3,
      limitPrice: 260,
      grossAmount: 780,
      currency: 'USD',
    });
  });

  it('rejects limit sell order creation when holdings are insufficient', async () => {
    holdingsValidationService.validateSellHoldings.mockResolvedValue(
      new HoldingsValidation(
        false,
        '101',
        '1',
        12,
        10,
        'AAPL',
        'Insufficient available holdings',
      ),
    );

    await expect(
      service.createLimitSellOrder({
        traderId: '101',
        stockId: '1',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 12,
        limitPrice: 260,
      }),
    ).rejects.toThrow(ConflictException);

    expect(orderRepository.createLimitSellOrder.mock.calls).toHaveLength(0);
  });

  it('creates a stop loss order pending trigger condition', async () => {
    const order = new TradingOrder(
      '5',
      'stop-loss-order-reference',
      '101',
      'SELL',
      'STOP_LOSS',
      'PENDING_CONDITION',
      'AAPL',
      '1',
      3,
      220,
      660,
      0,
      'USD',
      '2026-05-26T14:30:00.000Z',
      220,
      undefined,
      '1',
    );
    holdingsValidationService.validateSellHoldings.mockResolvedValue(
      new HoldingsValidation(true, '101', '1', 3, 10, 'AAPL'),
    );
    orderRepository.createStopLossOrder.mockResolvedValue({
      approved: true,
      order,
      requiredQuantity: 3,
    });

    await expect(
      service.createStopLossOrder({
        traderId: ' 101 ',
        stockId: ' 1 ',
        symbol: ' aapl ',
        exchangeId: '1',
        quantity: 3,
        stopPrice: 220,
      }),
    ).resolves.toBe(order);

    expect(orderRepository.createStopLossOrder.mock.calls[0][0]).toEqual({
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 3,
      stopPrice: 220,
      grossAmount: 660,
      currency: 'USD',
    });
  });

  it('rejects stop loss order creation when holdings are insufficient', async () => {
    holdingsValidationService.validateSellHoldings.mockResolvedValue(
      new HoldingsValidation(
        false,
        '101',
        '1',
        12,
        10,
        'AAPL',
        'Insufficient available holdings',
      ),
    );

    await expect(
      service.createStopLossOrder({
        traderId: '101',
        stockId: '1',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 12,
        stopPrice: 220,
      }),
    ).rejects.toThrow(ConflictException);

    expect(orderRepository.createStopLossOrder.mock.calls).toHaveLength(0);
  });

  it('rejects stop loss order creation when persistence fails', async () => {
    holdingsValidationService.validateSellHoldings.mockResolvedValue(
      new HoldingsValidation(true, '101', '1', 3, 10, 'AAPL'),
    );
    orderRepository.createStopLossOrder.mockResolvedValue({
      approved: false,
      reason: 'Unable to create order',
      requiredQuantity: 3,
    });

    await expect(
      service.createStopLossOrder({
        traderId: '101',
        stockId: '1',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 3,
        stopPrice: 220,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('creates a take profit order pending target condition', async () => {
    const order = new TradingOrder(
      '6',
      'take-profit-order-reference',
      '101',
      'SELL',
      'TAKE_PROFIT',
      'PENDING_CONDITION',
      'AAPL',
      '1',
      3,
      290,
      870,
      0,
      'USD',
      '2026-05-26T14:30:00.000Z',
      290,
      undefined,
      '1',
    );
    holdingsValidationService.validateSellHoldings.mockResolvedValue(
      new HoldingsValidation(true, '101', '1', 3, 10, 'AAPL'),
    );
    orderRepository.createTakeProfitOrder.mockResolvedValue({
      approved: true,
      order,
      requiredQuantity: 3,
    });

    await expect(
      service.createTakeProfitOrder({
        traderId: ' 101 ',
        stockId: ' 1 ',
        symbol: ' aapl ',
        exchangeId: '1',
        quantity: 3,
        targetPrice: 290,
      }),
    ).resolves.toBe(order);

    expect(orderRepository.createTakeProfitOrder.mock.calls[0][0]).toEqual({
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 3,
      targetPrice: 290,
      grossAmount: 870,
      currency: 'USD',
    });
  });

  it('rejects take profit order creation when holdings are insufficient', async () => {
    holdingsValidationService.validateSellHoldings.mockResolvedValue(
      new HoldingsValidation(
        false,
        '101',
        '1',
        12,
        10,
        'AAPL',
        'Insufficient available holdings',
      ),
    );

    await expect(
      service.createTakeProfitOrder({
        traderId: '101',
        stockId: '1',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 12,
        targetPrice: 290,
      }),
    ).rejects.toThrow(ConflictException);

    expect(orderRepository.createTakeProfitOrder.mock.calls).toHaveLength(0);
  });

  it('rejects take profit order creation when persistence fails', async () => {
    holdingsValidationService.validateSellHoldings.mockResolvedValue(
      new HoldingsValidation(true, '101', '1', 3, 10, 'AAPL'),
    );
    orderRepository.createTakeProfitOrder.mockResolvedValue({
      approved: false,
      reason: 'Unable to create order',
      requiredQuantity: 3,
    });

    await expect(
      service.createTakeProfitOrder({
        traderId: '101',
        stockId: '1',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 3,
        targetPrice: 290,
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

  it('requires stock identifier for market sell orders', async () => {
    await expect(
      service.createMarketSellOrder({
        traderId: '101',
        stockId: '',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 1,
        estimatedUnitPrice: 250,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(orderRepository.createMarketSellOrder.mock.calls).toHaveLength(0);
  });

  it('requires positive estimated price for market sell orders', async () => {
    await expect(
      service.createMarketSellOrder({
        traderId: '101',
        stockId: '1',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 1,
        estimatedUnitPrice: 0,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(orderRepository.createMarketSellOrder.mock.calls).toHaveLength(0);
  });

  it('requires positive limit price', async () => {
    await expect(
      service.createLimitBuyOrder({
        traderId: '101',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 1,
        limitPrice: 0,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(orderRepository.createLimitBuyOrder.mock.calls).toHaveLength(0);
  });

  it('requires positive limit price for limit sell orders', async () => {
    await expect(
      service.createLimitSellOrder({
        traderId: '101',
        stockId: '1',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 1,
        limitPrice: 0,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(orderRepository.createLimitSellOrder.mock.calls).toHaveLength(0);
  });

  it('requires positive stop price for stop loss orders', async () => {
    await expect(
      service.createStopLossOrder({
        traderId: '101',
        stockId: '1',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 1,
        stopPrice: 0,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(orderRepository.createStopLossOrder.mock.calls).toHaveLength(0);
  });

  it('requires positive target price for take profit orders', async () => {
    await expect(
      service.createTakeProfitOrder({
        traderId: '101',
        stockId: '1',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 1,
        targetPrice: 0,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(orderRepository.createTakeProfitOrder.mock.calls).toHaveLength(0);
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
