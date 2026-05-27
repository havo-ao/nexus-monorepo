import { DataSource, EntityManager, Repository } from 'typeorm';
import { OrderStatusEventEntity } from '../../orders/entities/order-status-event.entity';
import { TradingOrderEntity } from '../../orders/entities/trading-order.entity';
import { BrokerExecutionEvent } from '../entities/broker-execution-event.entity';
import { TypeOrmBrokerExecutionRepository } from './typeorm-broker-execution.repository';

describe('TypeOrmBrokerExecutionRepository', () => {
  let dataSource: jest.Mocked<DataSource>;
  let orderRepository: jest.Mocked<Repository<TradingOrderEntity>>;
  let eventRepository: jest.Mocked<Repository<BrokerExecutionEvent>>;
  let statusEventRepository: jest.Mocked<Repository<OrderStatusEventEntity>>;

  beforeEach(() => {
    orderRepository = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<TradingOrderEntity>>;
    eventRepository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<BrokerExecutionEvent>>;
    statusEventRepository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<OrderStatusEventEntity>>;

    const entityManager = {
      getRepository: jest.fn((entity) => {
        if (entity === TradingOrderEntity) {
          return orderRepository;
        }
        if (entity === BrokerExecutionEvent) {
          return eventRepository;
        }
        return statusEventRepository;
      }),
    } as unknown as EntityManager;

    dataSource = {
      getRepository: jest.fn().mockReturnValue(orderRepository),
      transaction: jest.fn(<T>(callback: (manager: EntityManager) => T) =>
        callback(entityManager),
      ),
    } as unknown as jest.Mocked<DataSource>;
  });

  it('loads an executable order by reference', async () => {
    const repository = new TypeOrmBrokerExecutionRepository(dataSource);
    orderRepository.findOne.mockResolvedValue(
      tradingOrderEntity('PENDING_EXECUTION'),
    );

    await expect(
      repository.findExecutableOrder('order-reference'),
    ).resolves.toMatchObject({
      id: '1',
      orderReference: 'order-reference',
      traderId: '101',
      status: 'PENDING_EXECUTION',
      symbol: 'AAPL',
      quantity: 1,
    });
  });

  it('returns null when an executable order does not exist', async () => {
    const repository = new TypeOrmBrokerExecutionRepository(dataSource);
    orderRepository.findOne.mockResolvedValue(null);

    await expect(
      repository.findExecutableOrder('missing-order'),
    ).resolves.toBeNull();
  });

  it('marks an order as sent and records broker/status events', async () => {
    const repository = new TypeOrmBrokerExecutionRepository(dataSource);
    const order = tradingOrderEntity('PENDING_EXECUTION');
    orderRepository.findOneOrFail.mockResolvedValue(order);
    orderRepository.save.mockImplementation((entity) =>
      Promise.resolve(entity),
    );
    eventRepository.save.mockImplementation((event) => {
      event.createdAt = new Date('2026-05-26T14:30:00.000Z');
      return Promise.resolve(event);
    });

    await expect(
      repository.markOrderSentToBroker({
        order: {
          id: '1',
          orderReference: 'order-reference',
          traderId: '101',
          side: 'BUY',
          orderType: 'MARKET',
          status: 'PENDING_EXECUTION',
          symbol: 'AAPL',
          quantity: 1,
          estimatedUnitPrice: 250,
          currency: 'USD',
        },
        brokerResponse: {
          brokerName: 'ALPACA',
          externalOrderId: 'alpaca-order-reference',
          brokerStatus: 'ACCEPTED',
          requestSummary: 'BUY 1 AAPL MARKET',
          responseSummary: 'Broker accepted order alpaca-order-reference',
        },
      }),
    ).resolves.toMatchObject({
      orderReference: 'order-reference',
      status: 'SENT_TO_BROKER',
      externalOrderId: 'alpaca-order-reference',
      brokerStatus: 'ACCEPTED',
    });
    expect(order.status).toBe('SENT_TO_BROKER');
    expect(eventRepository.save.mock.calls[0][0]).toMatchObject({
      orderReference: 'order-reference',
      brokerName: 'ALPACA',
      externalOrderId: 'alpaca-order-reference',
    });
    expect(statusEventRepository.save.mock.calls[0][0]).toMatchObject({
      fromStatus: 'PENDING_EXECUTION',
      toStatus: 'SENT_TO_BROKER',
      actorType: 'BROKER',
      actorId: 'ALPACA',
    });
  });

  it('marks an order as failed and records broker/status events', async () => {
    const repository = new TypeOrmBrokerExecutionRepository(dataSource);
    const order = tradingOrderEntity('PENDING_EXECUTION');
    orderRepository.findOneOrFail.mockResolvedValue(order);
    orderRepository.save.mockImplementation((entity) =>
      Promise.resolve(entity),
    );
    eventRepository.save.mockImplementation((event) => {
      event.createdAt = new Date('2026-05-26T14:30:00.000Z');
      return Promise.resolve(event);
    });

    await expect(
      repository.markOrderFailedByBroker({
        order: {
          id: '1',
          orderReference: 'order-reference',
          traderId: '101',
          side: 'BUY',
          orderType: 'MARKET',
          status: 'PENDING_EXECUTION',
          symbol: 'AAPL',
          quantity: 1,
          estimatedUnitPrice: 250,
          currency: 'USD',
        },
        brokerName: 'ALPACA',
        brokerStatus: 'FAILED',
        requestSummary: 'BUY 1 AAPL MARKET',
        failureReason: 'Broker rejected the order submission',
      }),
    ).resolves.toMatchObject({
      orderReference: 'order-reference',
      status: 'FAILED',
      externalOrderId: 'unavailable',
      brokerStatus: 'FAILED',
    });
    expect(order.status).toBe('FAILED');
    expect(order.rejectionReason).toBe('Broker rejected the order submission');
    expect(eventRepository.save.mock.calls[0][0]).toMatchObject({
      orderReference: 'order-reference',
      brokerName: 'ALPACA',
      externalOrderId: 'unavailable',
      brokerStatus: 'FAILED',
      responseSummary: 'Broker rejected the order submission',
    });
    expect(statusEventRepository.save.mock.calls[0][0]).toMatchObject({
      fromStatus: 'PENDING_EXECUTION',
      toStatus: 'FAILED',
      actorType: 'BROKER',
      actorId: 'ALPACA',
      reason: 'Broker rejected the order submission',
    });
  });
});

function tradingOrderEntity(status: TradingOrderEntity['status']) {
  const order = new TradingOrderEntity();
  order.id = '1';
  order.orderReference = 'order-reference';
  order.traderId = '101';
  order.side = 'BUY';
  order.orderType = 'MARKET';
  order.status = status;
  order.symbol = 'AAPL';
  order.exchangeId = '1';
  order.quantity = '1.000000';
  order.estimatedUnitPrice = '250.00';
  order.grossAmount = '250.00';
  order.reservedAmount = '250.00';
  order.currency = 'USD';
  order.createdAt = new Date('2026-05-26T14:30:00.000Z');
  order.updatedAt = new Date('2026-05-26T14:30:00.000Z');
  return order;
}
