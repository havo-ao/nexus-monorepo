import type { DataSource, EntityManager, Repository } from 'typeorm';
import { BrokerExecutionEvent } from '../../executions/entities/broker-execution-event.entity';
import { OrderStatusEventEntity } from '../../orders/entities/order-status-event.entity';
import { TradingOrderEntity } from '../../orders/entities/trading-order.entity';
import { OrderSettlementEvent } from '../entities/order-settlement-event.entity';
import { TradingNotificationEvent } from '../entities/trading-notification-event.entity';
import { TypeOrmOrderSettlementRepository } from './typeorm-order-settlement.repository';

describe('TypeOrmOrderSettlementRepository', () => {
  let dataSource: {
    getRepository: jest.Mock;
    transaction: jest.Mock;
  };
  let orderRepository: jest.Mocked<
    Pick<Repository<TradingOrderEntity>, 'findOne' | 'findOneOrFail' | 'save'>
  >;
  let executionRepository: jest.Mocked<
    Pick<Repository<BrokerExecutionEvent>, 'findOne'>
  >;
  let settlementRepository: jest.Mocked<
    Pick<Repository<OrderSettlementEvent>, 'save'>
  >;
  let statusEventRepository: jest.Mocked<
    Pick<Repository<OrderStatusEventEntity>, 'save'>
  >;
  let notificationRepository: jest.Mocked<
    Pick<Repository<TradingNotificationEvent>, 'save'>
  >;

  beforeEach(() => {
    orderRepository = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      save: jest.fn(),
    };
    executionRepository = { findOne: jest.fn() };
    settlementRepository = { save: jest.fn() };
    statusEventRepository = { save: jest.fn() };
    notificationRepository = { save: jest.fn() };

    const manager = {
      getRepository: jest.fn((entity: unknown): unknown => {
        if (entity === TradingOrderEntity) {
          return orderRepository;
        }
        if (entity === OrderSettlementEvent) {
          return settlementRepository;
        }
        if (entity === OrderStatusEventEntity) {
          return statusEventRepository;
        }
        if (entity === TradingNotificationEvent) {
          return notificationRepository;
        }
        return undefined;
      }),
    } as unknown as EntityManager;

    dataSource = {
      getRepository: jest.fn((entity: unknown): unknown => {
        if (entity === TradingOrderEntity) {
          return orderRepository;
        }
        if (entity === BrokerExecutionEvent) {
          return executionRepository;
        }
        return undefined;
      }),
      transaction: jest.fn(
        (callback: (entityManager: EntityManager) => Promise<unknown>) =>
          callback(manager),
      ),
    };
  });

  it('finds the order and latest broker execution context', async () => {
    orderRepository.findOne.mockResolvedValue(orderEntity());
    executionRepository.findOne.mockResolvedValue(executionEntity());
    const repository = new TypeOrmOrderSettlementRepository(
      dataSource as DataSource,
    );

    await expect(
      repository.findSettlementContext('order-reference'),
    ).resolves.toMatchObject({
      order: {
        orderReference: 'order-reference',
        traderId: '101',
        stockId: '1',
        quantity: 2,
      },
      execution: {
        brokerName: 'ALPACA',
        externalOrderId: 'alpaca-id',
      },
    });
  });

  it('returns null when the order or broker execution evidence is missing', async () => {
    const repository = new TypeOrmOrderSettlementRepository(
      dataSource as unknown as DataSource,
    );

    orderRepository.findOne.mockResolvedValueOnce(null);
    await expect(
      repository.findSettlementContext('missing-order'),
    ).resolves.toBeNull();

    orderRepository.findOne.mockResolvedValueOnce(orderEntity());
    executionRepository.findOne.mockResolvedValueOnce(null);
    await expect(
      repository.findSettlementContext('missing-execution'),
    ).resolves.toBeNull();
  });

  it('settles the order and stores trading audit events without touching portfolio tables', async () => {
    const order = orderEntity();
    orderRepository.findOneOrFail.mockResolvedValue(order);
    orderRepository.save.mockImplementation((entity) =>
      Promise.resolve(entity),
    );
    const repository = new TypeOrmOrderSettlementRepository(
      dataSource as DataSource,
    );

    const settlement = await repository.settleBrokerStatus({
      context: {
        order: {
          id: order.id,
          orderReference: order.orderReference,
          traderId: order.traderId,
          side: order.side,
          orderType: order.orderType,
          status: order.status,
          symbol: order.symbol,
          stockId: order.stockId,
          quantity: Number(order.quantity),
          estimatedUnitPrice: Number(order.estimatedUnitPrice),
          grossAmount: Number(order.grossAmount),
          reservedAmount: Number(order.reservedAmount),
          currency: order.currency,
        },
        execution: {
          brokerName: 'ALPACA',
          externalOrderId: 'alpaca-id',
          brokerStatus: 'accepted',
        },
      },
      brokerStatus: {
        brokerName: 'ALPACA',
        externalOrderId: 'alpaca-id',
        brokerStatus: 'filled',
        filledQuantity: 2,
        averageFilledPrice: 251,
        responseSummary: 'filled',
      },
      nextStatus: 'EXECUTED',
      actorId: 'ALPACA',
      reason: 'Broker ALPACA returned filled',
      commissionAmount: 1.76,
      portfolioUpdated: true,
      fundsUpdated: true,
      notification: {
        delivered: true,
        recipientEmail: 'andy@nexus.local',
      },
    });

    expect(settlement).toMatchObject({
      status: 'EXECUTED',
      settledAmount: 502,
      commissionAmount: 1.76,
      netAmount: 503.76,
      portfolioUpdated: true,
      fundsUpdated: true,
    });
    expect(settlementRepository.save.mock.calls[0]?.[0]).toMatchObject({
      orderReference: 'order-reference',
      brokerStatus: 'filled',
      internalStatus: 'EXECUTED',
      settledAmount: '502.00',
    });
    expect(statusEventRepository.save.mock.calls).toHaveLength(1);
    expect(notificationRepository.save.mock.calls[0]?.[0]).toMatchObject({
      notificationType: 'ORDER_EXECUTED',
      recipientEmail: 'andy@nexus.local',
      delivered: true,
    });
  });

  it('stores rejection reasons and skips status events when the status is unchanged', async () => {
    const order = orderEntity();
    order.status = 'SENT_TO_BROKER';
    orderRepository.findOneOrFail.mockResolvedValue(order);
    orderRepository.save.mockImplementation((entity) =>
      Promise.resolve(entity),
    );
    const repository = new TypeOrmOrderSettlementRepository(
      dataSource as unknown as DataSource,
    );

    await repository.settleBrokerStatus({
      context: {
        order: {
          id: order.id,
          orderReference: order.orderReference,
          traderId: order.traderId,
          side: order.side,
          orderType: order.orderType,
          status: order.status,
          symbol: order.symbol,
          stockId: order.stockId,
          quantity: Number(order.quantity),
          estimatedUnitPrice: Number(order.estimatedUnitPrice),
          grossAmount: Number(order.grossAmount),
          reservedAmount: Number(order.reservedAmount),
          currency: order.currency,
        },
        execution: {
          brokerName: 'ALPACA',
          externalOrderId: 'alpaca-id',
          brokerStatus: 'accepted',
        },
      },
      brokerStatus: {
        brokerName: 'ALPACA',
        externalOrderId: 'alpaca-id',
        brokerStatus: 'accepted',
        filledQuantity: 0,
        responseSummary: 'accepted',
      },
      nextStatus: 'SENT_TO_BROKER',
      actorId: 'ALPACA',
      reason: 'Broker ALPACA returned accepted',
      commissionAmount: 0,
      portfolioUpdated: false,
      fundsUpdated: false,
      notification: {
        delivered: false,
        reason: 'Order is not executed yet',
      },
    });

    expect(order.rejectionReason).toBeUndefined();
    expect(statusEventRepository.save.mock.calls).toHaveLength(0);
  });

  it('stores rejection reasons when broker status moves the order to a non-executed terminal state', async () => {
    const order = orderEntity();
    orderRepository.findOneOrFail.mockResolvedValue(order);
    orderRepository.save.mockImplementation((entity) =>
      Promise.resolve(entity),
    );
    const repository = new TypeOrmOrderSettlementRepository(
      dataSource as unknown as DataSource,
    );

    await repository.settleBrokerStatus({
      context: {
        order: {
          id: order.id,
          orderReference: order.orderReference,
          traderId: order.traderId,
          side: order.side,
          orderType: order.orderType,
          status: order.status,
          symbol: order.symbol,
          stockId: order.stockId,
          quantity: Number(order.quantity),
          estimatedUnitPrice: Number(order.estimatedUnitPrice),
          grossAmount: Number(order.grossAmount),
          reservedAmount: Number(order.reservedAmount),
          currency: order.currency,
        },
        execution: {
          brokerName: 'ALPACA',
          externalOrderId: 'alpaca-id',
          brokerStatus: 'accepted',
        },
      },
      brokerStatus: {
        brokerName: 'ALPACA',
        externalOrderId: 'alpaca-id',
        brokerStatus: 'rejected',
        filledQuantity: 0,
        responseSummary: 'rejected',
      },
      nextStatus: 'REJECTED',
      actorId: 'ALPACA',
      reason: 'Broker ALPACA returned rejected',
      commissionAmount: 0,
      portfolioUpdated: false,
      fundsUpdated: false,
      notification: {
        delivered: false,
        reason: 'Order is not executed yet',
      },
    });

    expect(order.rejectionReason).toBe('Broker ALPACA returned rejected');
  });

  function orderEntity(): TradingOrderEntity {
    const order = new TradingOrderEntity();
    order.id = '1';
    order.orderReference = 'order-reference';
    order.traderId = '101';
    order.side = 'BUY';
    order.orderType = 'MARKET';
    order.status = 'SENT_TO_BROKER';
    order.symbol = 'AAPL';
    order.exchangeId = '1';
    order.stockId = '1';
    order.quantity = 2;
    order.estimatedUnitPrice = '250.00';
    order.grossAmount = '500.00';
    order.reservedAmount = '501.75';
    order.currency = 'USD';
    order.createdAt = new Date('2026-05-27T10:00:00.000Z');
    order.updatedAt = new Date('2026-05-27T10:00:00.000Z');
    return order;
  }

  function executionEntity(): BrokerExecutionEvent {
    const execution = new BrokerExecutionEvent();
    execution.id = '1';
    execution.orderId = '1';
    execution.orderReference = 'order-reference';
    execution.brokerName = 'ALPACA';
    execution.externalOrderId = 'alpaca-id';
    execution.brokerStatus = 'accepted';
    execution.requestSummary = 'BUY 2 AAPL MARKET';
    execution.responseSummary = 'accepted';
    execution.createdAt = new Date('2026-05-27T10:00:00.000Z');
    return execution;
  }
});
