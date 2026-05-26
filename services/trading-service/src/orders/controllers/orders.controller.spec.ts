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
});
