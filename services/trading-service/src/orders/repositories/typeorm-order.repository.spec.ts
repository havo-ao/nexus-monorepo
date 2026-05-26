import { DataSource, EntityManager, Repository } from 'typeorm';
import { FundsValidationEvent } from '../../funds-validation/entities/funds-validation-event.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { OrderStatusEventEntity } from '../entities/order-status-event.entity';
import { TradingOrderEntity } from '../entities/trading-order.entity';
import { TypeOrmOrderRepository } from './typeorm-order.repository';

describe('TypeOrmOrderRepository', () => {
  let dataSource: jest.Mocked<DataSource>;
  let walletRepository: jest.Mocked<Repository<Wallet>>;
  let fundsEventRepository: jest.Mocked<Repository<FundsValidationEvent>>;
  let orderRepository: jest.Mocked<Repository<TradingOrderEntity>>;
  let statusEventRepository: jest.Mocked<Repository<OrderStatusEventEntity>>;

  beforeEach(() => {
    walletRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<Wallet>>;
    fundsEventRepository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<FundsValidationEvent>>;
    orderRepository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<TradingOrderEntity>>;
    statusEventRepository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<OrderStatusEventEntity>>;

    const entityManager = {
      getRepository: jest.fn((entity) => {
        if (entity === Wallet) {
          return walletRepository;
        }
        if (entity === FundsValidationEvent) {
          return fundsEventRepository;
        }
        if (entity === TradingOrderEntity) {
          return orderRepository;
        }
        return statusEventRepository;
      }),
    } as unknown as EntityManager;

    dataSource = {
      transaction: jest.fn(<T>(callback: (manager: EntityManager) => T) =>
        callback(entityManager),
      ),
    } as unknown as jest.Mocked<DataSource>;
  });

  it('reserves wallet funds and persists order with initial status event', async () => {
    const repository = new TypeOrmOrderRepository(dataSource);
    const wallet = walletEntity('101', '1000.00', '0.00');
    walletRepository.findOne.mockResolvedValue(wallet);
    orderRepository.save.mockImplementation((entity) => {
      entity.id = '77';
      entity.createdAt = new Date('2026-05-26T14:30:00.000Z');
      entity.updatedAt = new Date('2026-05-26T14:30:00.000Z');
      return Promise.resolve(entity);
    });

    const result = await repository.createMarketBuyOrder({
      traderId: '101',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 3,
      estimatedUnitPrice: 250,
      grossAmount: 750,
      currency: 'USD',
    });

    expect(result.approved).toBe(true);
    expect(result.order).toMatchObject({
      id: '77',
      traderId: '101',
      side: 'BUY',
      orderType: 'MARKET',
      status: 'PENDING_EXECUTION',
      symbol: 'AAPL',
      grossAmount: 750,
    });
    expect(wallet.availableBalance).toBe('250.00');
    expect(wallet.reservedBalance).toBe('750.00');
    expect(fundsEventRepository.save.mock.calls[0][0]).toMatchObject({
      validationType: 'BUY_ORDER_FUNDS_RESERVATION',
      approved: true,
      requiredAmount: '750.00',
    });
    expect(statusEventRepository.save.mock.calls[0][0]).toMatchObject({
      toStatus: 'PENDING_EXECUTION',
      actorType: 'TRADER',
      actorId: '101',
    });
  });

  it('records a rejected funds event without creating an order', async () => {
    const repository = new TypeOrmOrderRepository(dataSource);
    walletRepository.findOne.mockResolvedValue(
      walletEntity('101', '100.00', '0.00'),
    );

    const result = await repository.createMarketBuyOrder({
      traderId: '101',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 3,
      estimatedUnitPrice: 250,
      grossAmount: 750,
      currency: 'USD',
    });

    expect(result).toEqual({
      approved: false,
      reason: 'Insufficient available funds',
      availableAmount: 100,
      requiredAmount: 750,
    });
    expect(orderRepository.save.mock.calls).toHaveLength(0);
    expect(statusEventRepository.save.mock.calls).toHaveLength(0);
    expect(fundsEventRepository.save.mock.calls[0][0]).toMatchObject({
      approved: false,
      reason: 'Insufficient available funds',
    });
  });

  it('creates a limit buy order pending condition with limit price', async () => {
    const repository = new TypeOrmOrderRepository(dataSource);
    const wallet = walletEntity('101', '1000.00', '0.00');
    walletRepository.findOne.mockResolvedValue(wallet);
    orderRepository.save.mockImplementation((entity) => {
      entity.id = '78';
      entity.createdAt = new Date('2026-05-26T14:30:00.000Z');
      entity.updatedAt = new Date('2026-05-26T14:30:00.000Z');
      return Promise.resolve(entity);
    });

    const result = await repository.createLimitBuyOrder({
      traderId: '101',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 2,
      limitPrice: 240,
      grossAmount: 480,
      currency: 'USD',
    });

    expect(result.approved).toBe(true);
    expect(result.order).toMatchObject({
      id: '78',
      traderId: '101',
      side: 'BUY',
      orderType: 'LIMIT',
      status: 'PENDING_CONDITION',
      symbol: 'AAPL',
      estimatedUnitPrice: 240,
      limitPrice: 240,
      grossAmount: 480,
    });
    expect(wallet.availableBalance).toBe('520.00');
    expect(wallet.reservedBalance).toBe('480.00');
    expect(orderRepository.save.mock.calls[0][0]).toMatchObject({
      orderType: 'LIMIT',
      status: 'PENDING_CONDITION',
      estimatedUnitPrice: '240.00',
      limitPrice: '240.00',
      grossAmount: '480.00',
      reservedAmount: '480.00',
    });
    expect(statusEventRepository.save.mock.calls[0][0]).toMatchObject({
      toStatus: 'PENDING_CONDITION',
      actorType: 'TRADER',
      actorId: '101',
      reason: 'Limit buy order created with pending price condition',
    });
  });

  it('persists a market sell order with initial status event', async () => {
    const repository = new TypeOrmOrderRepository(dataSource);
    orderRepository.save.mockImplementation((entity) => {
      entity.id = '79';
      entity.createdAt = new Date('2026-05-26T14:30:00.000Z');
      entity.updatedAt = new Date('2026-05-26T14:30:00.000Z');
      return Promise.resolve(entity);
    });

    const result = await repository.createMarketSellOrder({
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 3,
      estimatedUnitPrice: 250,
      grossAmount: 750,
      currency: 'USD',
    });

    expect(result.approved).toBe(true);
    expect(result.order).toMatchObject({
      id: '79',
      traderId: '101',
      stockId: '1',
      side: 'SELL',
      orderType: 'MARKET',
      status: 'PENDING_EXECUTION',
      symbol: 'AAPL',
      estimatedUnitPrice: 250,
      grossAmount: 750,
      reservedAmount: 0,
    });
    expect(orderRepository.save.mock.calls[0][0]).toMatchObject({
      traderId: '101',
      stockId: '1',
      side: 'SELL',
      orderType: 'MARKET',
      status: 'PENDING_EXECUTION',
      estimatedUnitPrice: '250.00',
      grossAmount: '750.00',
      reservedAmount: '0.00',
    });
    expect(statusEventRepository.save.mock.calls[0][0]).toMatchObject({
      toStatus: 'PENDING_EXECUTION',
      actorType: 'TRADER',
      actorId: '101',
      reason: 'Market sell order created after holdings validation',
    });
  });

  it('persists a limit sell order with pending condition status event', async () => {
    const repository = new TypeOrmOrderRepository(dataSource);
    orderRepository.save.mockImplementation((entity) => {
      entity.id = '80';
      entity.createdAt = new Date('2026-05-26T14:30:00.000Z');
      entity.updatedAt = new Date('2026-05-26T14:30:00.000Z');
      return Promise.resolve(entity);
    });

    const result = await repository.createLimitSellOrder({
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 3,
      limitPrice: 260,
      grossAmount: 780,
      currency: 'USD',
    });

    expect(result.approved).toBe(true);
    expect(result.order).toMatchObject({
      id: '80',
      traderId: '101',
      stockId: '1',
      side: 'SELL',
      orderType: 'LIMIT',
      status: 'PENDING_CONDITION',
      symbol: 'AAPL',
      estimatedUnitPrice: 260,
      limitPrice: 260,
      grossAmount: 780,
      reservedAmount: 0,
    });
    expect(orderRepository.save.mock.calls[0][0]).toMatchObject({
      traderId: '101',
      stockId: '1',
      side: 'SELL',
      orderType: 'LIMIT',
      status: 'PENDING_CONDITION',
      estimatedUnitPrice: '260.00',
      limitPrice: '260.00',
      grossAmount: '780.00',
      reservedAmount: '0.00',
    });
    expect(statusEventRepository.save.mock.calls[0][0]).toMatchObject({
      toStatus: 'PENDING_CONDITION',
      actorType: 'TRADER',
      actorId: '101',
      reason: 'Limit sell order created with pending price condition',
    });
  });

  it('persists a stop loss order with pending trigger status event', async () => {
    const repository = new TypeOrmOrderRepository(dataSource);
    orderRepository.save.mockImplementation((entity) => {
      entity.id = '81';
      entity.createdAt = new Date('2026-05-26T14:30:00.000Z');
      entity.updatedAt = new Date('2026-05-26T14:30:00.000Z');
      return Promise.resolve(entity);
    });

    const result = await repository.createStopLossOrder({
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 3,
      stopPrice: 220,
      grossAmount: 660,
      currency: 'USD',
    });

    expect(result.approved).toBe(true);
    expect(result.order).toMatchObject({
      id: '81',
      traderId: '101',
      stockId: '1',
      side: 'SELL',
      orderType: 'STOP_LOSS',
      status: 'PENDING_CONDITION',
      symbol: 'AAPL',
      estimatedUnitPrice: 220,
      limitPrice: 220,
      grossAmount: 660,
      reservedAmount: 0,
    });
    expect(orderRepository.save.mock.calls[0][0]).toMatchObject({
      traderId: '101',
      stockId: '1',
      side: 'SELL',
      orderType: 'STOP_LOSS',
      status: 'PENDING_CONDITION',
      estimatedUnitPrice: '220.00',
      limitPrice: '220.00',
      grossAmount: '660.00',
      reservedAmount: '0.00',
    });
    expect(statusEventRepository.save.mock.calls[0][0]).toMatchObject({
      toStatus: 'PENDING_CONDITION',
      actorType: 'TRADER',
      actorId: '101',
      reason: 'Stop loss order created with pending trigger condition',
    });
  });

  it('persists a take profit order with pending target status event', async () => {
    const repository = new TypeOrmOrderRepository(dataSource);
    orderRepository.save.mockImplementation((entity) => {
      entity.id = '82';
      entity.createdAt = new Date('2026-05-26T14:30:00.000Z');
      entity.updatedAt = new Date('2026-05-26T14:30:00.000Z');
      return Promise.resolve(entity);
    });

    const result = await repository.createTakeProfitOrder({
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 3,
      targetPrice: 290,
      grossAmount: 870,
      currency: 'USD',
    });

    expect(result.approved).toBe(true);
    expect(result.order).toMatchObject({
      id: '82',
      traderId: '101',
      stockId: '1',
      side: 'SELL',
      orderType: 'TAKE_PROFIT',
      status: 'PENDING_CONDITION',
      symbol: 'AAPL',
      estimatedUnitPrice: 290,
      limitPrice: 290,
      grossAmount: 870,
      reservedAmount: 0,
    });
    expect(orderRepository.save.mock.calls[0][0]).toMatchObject({
      traderId: '101',
      stockId: '1',
      side: 'SELL',
      orderType: 'TAKE_PROFIT',
      status: 'PENDING_CONDITION',
      estimatedUnitPrice: '290.00',
      limitPrice: '290.00',
      grossAmount: '870.00',
      reservedAmount: '0.00',
    });
    expect(statusEventRepository.save.mock.calls[0][0]).toMatchObject({
      toStatus: 'PENDING_CONDITION',
      actorType: 'TRADER',
      actorId: '101',
      reason: 'Take profit order created with pending target condition',
    });
  });

  it('records a rejected funds event when the trader has no wallet', async () => {
    const repository = new TypeOrmOrderRepository(dataSource);
    walletRepository.findOne.mockResolvedValue(null);

    const result = await repository.createMarketBuyOrder({
      traderId: '404',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 1,
      estimatedUnitPrice: 250,
      grossAmount: 250,
      currency: 'USD',
    });

    expect(result).toEqual({
      approved: false,
      reason: 'Insufficient available funds',
      availableAmount: 0,
      requiredAmount: 250,
    });
    expect(fundsEventRepository.save.mock.calls[0][0]).toMatchObject({
      traderId: '404',
      availableAmount: '0.00',
      reservedAmount: '0.00',
    });
  });

  function walletEntity(
    traderId: string,
    availableBalance: string,
    reservedBalance: string,
  ): Wallet {
    const wallet = new Wallet();
    wallet.id = '1';
    wallet.traderId = traderId;
    wallet.availableBalance = availableBalance;
    wallet.reservedBalance = reservedBalance;
    wallet.currency = 'USD';
    wallet.createdAt = new Date('2026-05-26T14:00:00.000Z');
    wallet.updatedAt = new Date('2026-05-26T14:00:00.000Z');
    return wallet;
  }
});
