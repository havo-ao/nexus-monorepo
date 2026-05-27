import { DataSource, EntityManager, Repository } from 'typeorm';
import { OrderStatusEventEntity } from '../../orders/entities/order-status-event.entity';
import { TradingOrderEntity } from '../../orders/entities/trading-order.entity';
import { BrokerOrderValidationEvent } from '../entities/broker-order-validation-event.entity';
import { TypeOrmBrokerOrderValidationRepository } from './typeorm-broker-order-validation.repository';

describe('TypeOrmBrokerOrderValidationRepository', () => {
  let dataSource: jest.Mocked<DataSource>;
  let orderRepository: jest.Mocked<Repository<TradingOrderEntity>>;
  let validationRepository: jest.Mocked<Repository<BrokerOrderValidationEvent>>;
  let statusEventRepository: jest.Mocked<Repository<OrderStatusEventEntity>>;

  beforeEach(() => {
    orderRepository = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<TradingOrderEntity>>;
    validationRepository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<BrokerOrderValidationEvent>>;
    statusEventRepository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<OrderStatusEventEntity>>;

    const entityManager = {
      getRepository: jest.fn((entity) => {
        if (entity === TradingOrderEntity) {
          return orderRepository;
        }
        if (entity === BrokerOrderValidationEvent) {
          return validationRepository;
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

  it('loads a validatable order by reference', async () => {
    const repository = new TypeOrmBrokerOrderValidationRepository(dataSource);
    orderRepository.findOne.mockResolvedValue(tradingOrderEntity());

    await expect(
      repository.findOrderByReference('order-reference'),
    ).resolves.toMatchObject({
      id: '1',
      orderReference: 'order-reference',
      traderId: '101',
      status: 'PENDING_EXECUTION',
    });
  });

  it('returns null when the order does not exist', async () => {
    const repository = new TypeOrmBrokerOrderValidationRepository(dataSource);
    orderRepository.findOne.mockResolvedValue(null);

    await expect(
      repository.findOrderByReference('missing-order'),
    ).resolves.toBeNull();
  });

  it('records approval without changing the operational status', async () => {
    const repository = new TypeOrmBrokerOrderValidationRepository(dataSource);
    const order = tradingOrderEntity();
    orderRepository.findOneOrFail.mockResolvedValue(order);
    orderRepository.save.mockImplementation((entity) =>
      Promise.resolve(entity),
    );
    validationRepository.save.mockImplementation((event) => {
      event.createdAt = new Date('2026-05-26T14:30:00.000Z');
      return Promise.resolve(event);
    });

    await expect(
      repository.saveValidation({
        order: {
          id: '1',
          orderReference: 'order-reference',
          traderId: '101',
          side: 'BUY',
          orderType: 'MARKET',
          status: 'PENDING_EXECUTION',
        },
        brokerId: '201',
        decision: 'APPROVE',
        nextStatus: 'PENDING_EXECUTION',
        reason: 'Reviewed',
      }),
    ).resolves.toMatchObject({
      orderReference: 'order-reference',
      brokerId: '201',
      decision: 'APPROVE',
      status: 'PENDING_EXECUTION',
    });
    expect(validationRepository.save.mock.calls[0][0]).toMatchObject({
      orderReference: 'order-reference',
      brokerId: '201',
      decision: 'APPROVE',
      fromStatus: 'PENDING_EXECUTION',
      toStatus: 'PENDING_EXECUTION',
    });
    expect(statusEventRepository.save.mock.calls[0][0]).toMatchObject({
      actorType: 'BROKER',
      actorId: '201',
      reason: 'Reviewed',
    });
  });

  it('rejects the order and records audit events', async () => {
    const repository = new TypeOrmBrokerOrderValidationRepository(dataSource);
    const order = tradingOrderEntity();
    orderRepository.findOneOrFail.mockResolvedValue(order);
    orderRepository.save.mockImplementation((entity) =>
      Promise.resolve(entity),
    );
    validationRepository.save.mockImplementation((event) => {
      event.createdAt = new Date('2026-05-26T14:30:00.000Z');
      return Promise.resolve(event);
    });

    await repository.saveValidation({
      order: {
        id: '1',
        orderReference: 'order-reference',
        traderId: '101',
        side: 'BUY',
        orderType: 'MARKET',
        status: 'PENDING_EXECUTION',
      },
      brokerId: '201',
      decision: 'REJECT',
      nextStatus: 'REJECTED',
      reason: 'Risk policy',
    });

    expect(order.status).toBe('REJECTED');
    expect(order.rejectionReason).toBe('Risk policy');
    expect(statusEventRepository.save.mock.calls[0][0]).toMatchObject({
      fromStatus: 'PENDING_EXECUTION',
      toStatus: 'REJECTED',
      actorType: 'BROKER',
      actorId: '201',
      reason: 'Risk policy',
    });
  });
});

function tradingOrderEntity() {
  const order = new TradingOrderEntity();
  order.id = '1';
  order.orderReference = 'order-reference';
  order.traderId = '101';
  order.side = 'BUY';
  order.orderType = 'MARKET';
  order.status = 'PENDING_EXECUTION';
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
