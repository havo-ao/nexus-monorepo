/* eslint-disable @typescript-eslint/unbound-method */
import { DataSource, EntityManager, Repository } from 'typeorm';
import { OrderStatusEventEntity } from '../../orders/entities/order-status-event.entity';
import { TradingOrderEntity } from '../../orders/entities/trading-order.entity';
import { PendingOrderProcessingEvent } from '../entities/pending-order-processing-event.entity';
import { TypeOrmPendingOrderRepository } from './typeorm-pending-order.repository';

describe('TypeOrmPendingOrderRepository', () => {
  let dataSource: jest.Mocked<DataSource>;
  let manager: jest.Mocked<EntityManager>;
  let orderRepository: jest.Mocked<Repository<TradingOrderEntity>>;
  let processingEventRepository: jest.Mocked<
    Repository<PendingOrderProcessingEvent>
  >;
  let statusEventRepository: jest.Mocked<Repository<OrderStatusEventEntity>>;

  beforeEach(() => {
    orderRepository = {
      find: jest.fn(),
      findOneOrFail: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<TradingOrderEntity>>;
    processingEventRepository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<PendingOrderProcessingEvent>>;
    statusEventRepository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<OrderStatusEventEntity>>;
    manager = {
      getRepository: jest.fn((entity) => {
        if (entity === TradingOrderEntity) {
          return orderRepository;
        }
        if (entity === OrderStatusEventEntity) {
          return statusEventRepository;
        }
        return processingEventRepository;
      }),
    } as unknown as jest.Mocked<EntityManager>;
    const transaction = jest.fn(
      <T>(callback: (entityManager: EntityManager) => Promise<T> | T) =>
        Promise.resolve(callback(manager)),
    );
    dataSource = {
      getRepository: jest.fn(() => orderRepository),
      transaction,
    } as unknown as jest.Mocked<DataSource>;
  });

  it('finds processable orders ordered by creation date', async () => {
    const repository = new TypeOrmPendingOrderRepository(dataSource);
    orderRepository.find.mockResolvedValue([
      tradingOrderEntity({
        orderReference: 'pending-market',
        status: 'PENDING_MARKET_OPEN',
      }),
      tradingOrderEntity({
        orderReference: 'pending-condition',
        status: 'PENDING_CONDITION',
        orderType: 'LIMIT',
        limitPrice: '240.00',
      }),
    ]);

    await expect(repository.findProcessableOrders(10)).resolves.toEqual([
      expect.objectContaining({
        orderReference: 'pending-market',
        status: 'PENDING_MARKET_OPEN',
      }),
      expect.objectContaining({
        orderReference: 'pending-condition',
        status: 'PENDING_CONDITION',
        limitPrice: 240,
      }),
    ]);
    expect(orderRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { createdAt: 'ASC' },
        take: 10,
      }),
    );
  });

  it('records an evaluation event without changing order status', async () => {
    const repository = new TypeOrmPendingOrderRepository(dataSource);
    const order = processableOrder();

    await repository.recordEvaluation({
      order,
      matched: false,
      action: 'WAITING_CONDITION',
      reason: 'Condition has not matched',
      evaluatedAt: new Date('2026-05-12T14:30:00.000Z'),
      marketPrice: 250,
      triggerPrice: 240,
    });

    expect(processingEventRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        orderReference: 'order-reference',
        fromStatus: 'PENDING_CONDITION',
        matched: false,
        action: 'WAITING_CONDITION',
        marketPrice: '250.00',
        triggerPrice: '240.00',
      }),
    );
  });

  it('marks an order ready for execution and stores the audit trail', async () => {
    const repository = new TypeOrmPendingOrderRepository(dataSource);
    const entity = tradingOrderEntity({
      status: 'PENDING_CONDITION',
      quantity: '2.000000',
      estimatedUnitPrice: '250.00',
      grossAmount: '500.00',
    });
    orderRepository.findOneOrFail.mockResolvedValue(entity);
    orderRepository.save.mockImplementation((order) =>
      Promise.resolve(order as TradingOrderEntity),
    );

    await expect(
      repository.markReadyForExecution({
        order: processableOrder({
          quantity: 2,
          estimatedUnitPrice: 250,
          grossAmount: 500,
        }),
        matched: true,
        action: 'CONDITION_MATCHED',
        reason: 'Condition matched',
        evaluatedAt: new Date('2026-05-12T14:30:00.000Z'),
        marketPrice: 245,
        triggerPrice: 250,
        nextStatus: 'PENDING_EXECUTION',
      }),
    ).resolves.toMatchObject({
      status: 'PENDING_EXECUTION',
      estimatedUnitPrice: 245,
      grossAmount: 490,
    });

    expect(statusEventRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        fromStatus: 'PENDING_CONDITION',
        toStatus: 'PENDING_EXECUTION',
        actorType: 'SYSTEM',
        actorId: 'pending-order-processor',
      }),
    );
    expect(processingEventRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        matched: true,
        action: 'CONDITION_MATCHED',
      }),
    );
  });

  it('skips orders that changed to a final state before locking', async () => {
    const repository = new TypeOrmPendingOrderRepository(dataSource);
    const entity = tradingOrderEntity({ status: 'EXECUTED' });
    orderRepository.findOneOrFail.mockResolvedValue(entity);

    await expect(
      repository.markReadyForExecution({
        order: processableOrder(),
        matched: true,
        action: 'CONDITION_MATCHED',
        reason: 'Condition matched',
        evaluatedAt: new Date('2026-05-12T14:30:00.000Z'),
        nextStatus: 'PENDING_EXECUTION',
      }),
    ).resolves.toMatchObject({ status: 'EXECUTED' });

    expect(statusEventRepository.save).not.toHaveBeenCalled();
    expect(processingEventRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        matched: false,
        action: 'SKIPPED_FINAL_STATE',
      }),
    );
  });
});

function tradingOrderEntity(
  overrides: Partial<TradingOrderEntity> = {},
): TradingOrderEntity {
  const entity = new TradingOrderEntity();
  entity.id = '1';
  entity.orderReference = 'order-reference';
  entity.traderId = '101';
  entity.side = 'BUY';
  entity.orderType = 'LIMIT';
  entity.status = 'PENDING_CONDITION';
  entity.symbol = 'AAPL';
  entity.exchangeId = '1';
  entity.quantity = '1.000000';
  entity.estimatedUnitPrice = '250.00';
  entity.limitPrice = '250.00';
  entity.grossAmount = '250.00';
  entity.reservedAmount = '251.00';
  entity.currency = 'USD';
  entity.createdAt = new Date('2026-05-12T14:30:00.000Z');
  entity.updatedAt = new Date('2026-05-12T14:30:00.000Z');
  return Object.assign(entity, overrides);
}

function processableOrder(overrides = {}) {
  return {
    id: '1',
    orderReference: 'order-reference',
    traderId: '101',
    side: 'BUY' as const,
    orderType: 'LIMIT' as const,
    status: 'PENDING_CONDITION' as const,
    symbol: 'AAPL',
    exchangeId: '1',
    quantity: 1,
    estimatedUnitPrice: 250,
    grossAmount: 250,
    currency: 'USD',
    limitPrice: 250,
    ...overrides,
  };
}
