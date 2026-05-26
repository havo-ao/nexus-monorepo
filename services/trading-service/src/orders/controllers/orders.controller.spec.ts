import { Test, TestingModule } from '@nestjs/testing';
import { TradingOrder } from '../entities/trading-order';
import { OrdersService } from '../services/orders.service';
import { OrdersController } from './orders.controller';

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: jest.Mocked<OrdersService>;

  beforeEach(async () => {
    ordersService = {
      createMarketBuyOrder: jest.fn(),
      createLimitBuyOrder: jest.fn(),
      createMarketSellOrder: jest.fn(),
    } as unknown as jest.Mocked<OrdersService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: ordersService,
        },
      ],
    }).compile();

    controller = module.get(OrdersController);
  });

  it('delegates market buy order creation to the service', async () => {
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
    ordersService.createMarketBuyOrder.mockResolvedValue(order);

    await expect(
      controller.createMarketBuyOrder({
        traderId: '101',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 3,
        estimatedUnitPrice: 250,
      }),
    ).resolves.toBe(order);

    expect(ordersService.createMarketBuyOrder.mock.calls[0][0]).toEqual({
      traderId: '101',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 3,
      estimatedUnitPrice: 250,
    });
  });

  it('delegates limit buy order creation to the service', async () => {
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
    ordersService.createLimitBuyOrder.mockResolvedValue(order);

    await expect(
      controller.createLimitBuyOrder({
        traderId: '101',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 2,
        limitPrice: 240,
      }),
    ).resolves.toBe(order);

    expect(ordersService.createLimitBuyOrder.mock.calls[0][0]).toEqual({
      traderId: '101',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 2,
      limitPrice: 240,
    });
  });

  it('delegates market sell order creation to the service', async () => {
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
    ordersService.createMarketSellOrder.mockResolvedValue(order);

    await expect(
      controller.createMarketSellOrder({
        traderId: '101',
        stockId: '1',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 3,
        estimatedUnitPrice: 250,
      }),
    ).resolves.toBe(order);

    expect(ordersService.createMarketSellOrder.mock.calls[0][0]).toEqual({
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 3,
      estimatedUnitPrice: 250,
    });
  });
});
