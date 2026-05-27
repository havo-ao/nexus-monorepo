import { DataSource, EntityManager, Repository } from 'typeorm';
import { OrderStatusEventEntity } from '../../orders/entities/order-status-event.entity';
import { TradingOrderEntity } from '../../orders/entities/trading-order.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { TypeOrmOrderCancellationRepository } from './typeorm-order-cancellation.repository';

describe('TypeOrmOrderCancellationRepository', () => {
  let dataSource: jest.Mocked<DataSource>;
  let orderRepository: jest.Mocked<Repository<TradingOrderEntity>>;
  let statusEventRepository: jest.Mocked<Repository<OrderStatusEventEntity>>;
  let walletRepository: jest.Mocked<Repository<Wallet>>;

  beforeEach(() => {
    orderRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<TradingOrderEntity>>;
    statusEventRepository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<OrderStatusEventEntity>>;
    walletRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<Wallet>>;

    const entityManager = {
      getRepository: jest.fn((entity) => {
        if (entity === TradingOrderEntity) {
          return orderRepository;
        }
        if (entity === OrderStatusEventEntity) {
          return statusEventRepository;
        }
        return walletRepository;
      }),
    } as unknown as EntityManager;

    dataSource = {
      transaction: jest.fn(<T>(callback: (manager: EntityManager) => T) =>
        callback(entityManager),
      ),
    } as unknown as jest.Mocked<DataSource>;
  });

  it('cancels a buy order and releases wallet funds', async () => {
    const repository = new TypeOrmOrderCancellationRepository(dataSource);
    const order = new TradingOrderEntity();
    order.id = '1';
    order.orderReference = 'order-reference';
    order.traderId = '101';
    order.side = 'BUY';
    order.status = 'PENDING_EXECUTION';
    order.reservedAmount = '250.00';
    const wallet = new Wallet();
    wallet.traderId = '101';
    wallet.availableBalance = '750.00';
    wallet.reservedBalance = '250.00';
    orderRepository.findOne.mockResolvedValue(order);
    orderRepository.save.mockImplementation((entity) =>
      Promise.resolve(entity),
    );
    walletRepository.findOne.mockResolvedValue(wallet);

    const result = await repository.cancelOrder({
      orderReference: 'order-reference',
      actorId: '101',
      reason: 'Trader requested cancellation before execution',
    });

    expect(result.cancelled).toBe(true);
    expect(result.cancellation).toMatchObject({
      orderReference: 'order-reference',
      previousStatus: 'PENDING_EXECUTION',
      currentStatus: 'CANCELLED',
      releasedAmount: 250,
    });
    expect(walletRepository.save.mock.calls[0][0]).toMatchObject({
      availableBalance: '1000.00',
      reservedBalance: '0.00',
    });
    expect(orderRepository.save.mock.calls[0][0]).toMatchObject({
      status: 'CANCELLED',
      reservedAmount: '0.00',
    });
    expect(statusEventRepository.save.mock.calls[0][0]).toMatchObject({
      fromStatus: 'PENDING_EXECUTION',
      toStatus: 'CANCELLED',
      actorType: 'TRADER',
      actorId: '101',
    });
  });

  it('cancels a sell order without wallet changes', async () => {
    const repository = new TypeOrmOrderCancellationRepository(dataSource);
    const order = new TradingOrderEntity();
    order.id = '2';
    order.orderReference = 'sell-order-reference';
    order.traderId = '101';
    order.side = 'SELL';
    order.status = 'PENDING_CONDITION';
    order.reservedAmount = '0.00';
    orderRepository.findOne.mockResolvedValue(order);
    orderRepository.save.mockImplementation((entity) =>
      Promise.resolve(entity),
    );

    const result = await repository.cancelOrder({
      orderReference: 'sell-order-reference',
      actorId: '101',
      reason: 'Trader requested cancellation before execution',
    });

    expect(result.cancelled).toBe(true);
    expect(result.cancellation).toMatchObject({
      previousStatus: 'PENDING_CONDITION',
      releasedAmount: 0,
    });
    expect(walletRepository.findOne.mock.calls).toHaveLength(0);
  });

  it('rejects cancellation when order is missing or final', async () => {
    const repository = new TypeOrmOrderCancellationRepository(dataSource);
    orderRepository.findOne.mockResolvedValueOnce(null);

    await expect(
      repository.cancelOrder({
        orderReference: 'missing-order',
        actorId: '101',
        reason: 'Trader requested cancellation before execution',
      }),
    ).resolves.toEqual({
      cancelled: false,
      reason: 'Order was not found',
    });

    const executedOrder = new TradingOrderEntity();
    executedOrder.orderReference = 'executed-order';
    executedOrder.status = 'EXECUTED';
    executedOrder.reservedAmount = '0.00';
    orderRepository.findOne.mockResolvedValueOnce(executedOrder);

    await expect(
      repository.cancelOrder({
        orderReference: 'executed-order',
        actorId: '101',
        reason: 'Trader requested cancellation before execution',
      }),
    ).resolves.toEqual({
      cancelled: false,
      reason: 'Order cannot be cancelled from status EXECUTED',
    });
  });
});
