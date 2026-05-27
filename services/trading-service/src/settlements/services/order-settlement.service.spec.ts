import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  EXTERNAL_BROKER_CLIENT,
  BrokerOrderSubmissionError,
  type ExternalBrokerClient,
} from '../../executions/clients/external-broker.client';
import {
  TRADING_NOTIFICATION_CLIENT,
  type TradingNotificationClient,
} from '../clients/trading-notification.client';
import {
  PORTFOLIO_SETTLEMENT_CLIENT,
  type PortfolioSettlementClient,
} from '../clients/portfolio-settlement.client';
import { OrderSettlement } from '../entities/order-settlement.entity';
import {
  ORDER_SETTLEMENT_REPOSITORY,
  type OrderSettlementRepository,
  type SettlementContext,
} from '../repositories/order-settlement.repository';
import { OrderSettlementService } from './order-settlement.service';

describe('OrderSettlementService', () => {
  let service: OrderSettlementService;
  let repository: jest.Mocked<OrderSettlementRepository>;
  let brokerClient: jest.Mocked<ExternalBrokerClient>;
  let notificationClient: jest.Mocked<TradingNotificationClient>;
  let portfolioClient: jest.Mocked<PortfolioSettlementClient>;

  const context: SettlementContext = {
    order: {
      id: '1',
      orderReference: 'order-reference',
      traderId: '101',
      side: 'BUY',
      orderType: 'MARKET',
      status: 'SENT_TO_BROKER',
      symbol: 'AAPL',
      stockId: '1',
      quantity: 2,
      estimatedUnitPrice: 250,
      grossAmount: 500,
      reservedAmount: 501.75,
      currency: 'USD',
    },
    execution: {
      brokerName: 'ALPACA',
      externalOrderId: 'alpaca-id',
      brokerStatus: 'accepted',
    },
  };

  beforeEach(async () => {
    repository = {
      findSettlementContext: jest.fn(),
      settleBrokerStatus: jest.fn(),
    };
    brokerClient = {
      sendOrder: jest.fn(),
      getOrderStatus: jest.fn(),
    };
    notificationClient = {
      sendOrderExecuted: jest.fn(),
    };
    portfolioClient = {
      applyExecutedOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderSettlementService,
        { provide: ORDER_SETTLEMENT_REPOSITORY, useValue: repository },
        { provide: EXTERNAL_BROKER_CLIENT, useValue: brokerClient },
        { provide: TRADING_NOTIFICATION_CLIENT, useValue: notificationClient },
        { provide: PORTFOLIO_SETTLEMENT_CLIENT, useValue: portfolioClient },
      ],
    }).compile();

    service = module.get(OrderSettlementService);
  });

  it('settles an executed broker order and requests notification delivery', async () => {
    repository.findSettlementContext.mockResolvedValue(context);
    brokerClient.getOrderStatus.mockResolvedValue({
      brokerName: 'ALPACA',
      externalOrderId: 'alpaca-id',
      brokerStatus: 'filled',
      filledQuantity: 2,
      averageFilledPrice: 251,
      responseSummary: 'filled',
    });
    notificationClient.sendOrderExecuted.mockResolvedValue({
      delivered: true,
      recipientEmail: 'andy@nexus.local',
    });
    portfolioClient.applyExecutedOrder.mockResolvedValue({
      portfolioUpdated: true,
      fundsUpdated: true,
    });
    const settlement = new OrderSettlement(
      '1',
      'order-reference',
      '101',
      'BUY',
      'EXECUTED',
      'AAPL',
      2,
      2,
      251,
      502,
      1.76,
      503.76,
      'USD',
      'ALPACA',
      'alpaca-id',
      'filled',
      true,
      true,
      true,
      '2026-05-27T10:00:00.000Z',
    );
    repository.settleBrokerStatus.mockResolvedValue(settlement);

    await expect(
      service.syncOrderSettlement({
        orderReference: ' order-reference ',
        authorizationHeader: 'Bearer token',
        actorId: '201',
        notificationRecipient: {
          email: 'andy@nexus.local',
          name: 'Andy',
          surname: 'Trader',
          username: 'andy',
        },
      }),
    ).resolves.toBe(settlement);
    expect(repository.settleBrokerStatus.mock.calls[0][0]).toMatchObject({
      nextStatus: 'EXECUTED',
      actorId: '201',
      portfolioUpdated: true,
      fundsUpdated: true,
      notification: { delivered: true },
    });
    expect(portfolioClient.applyExecutedOrder.mock.calls[0]?.[0]).toMatchObject(
      {
        authorizationHeader: 'Bearer token',
        side: 'BUY',
        stockId: '1',
        quantity: 2,
        executionPrice: 251,
        netAmount: 503.76,
      },
    );
  });

  it('keeps the order sent to broker when Alpaca has not filled it', async () => {
    repository.findSettlementContext.mockResolvedValue(context);
    brokerClient.getOrderStatus.mockResolvedValue({
      brokerName: 'ALPACA',
      externalOrderId: 'alpaca-id',
      brokerStatus: 'accepted',
      filledQuantity: 0,
      responseSummary: 'accepted',
    });
    const settlement = new OrderSettlement(
      '1',
      'order-reference',
      '101',
      'BUY',
      'SENT_TO_BROKER',
      'AAPL',
      2,
      2,
      250,
      500,
      0,
      500,
      'USD',
      'ALPACA',
      'alpaca-id',
      'accepted',
      false,
      false,
      false,
      '2026-05-27T10:00:00.000Z',
    );
    repository.settleBrokerStatus.mockResolvedValue(settlement);

    await expect(
      service.syncOrderSettlement({ orderReference: 'order-reference' }),
    ).resolves.toBe(settlement);
    expect(notificationClient.sendOrderExecuted.mock.calls).toHaveLength(0);
    expect(portfolioClient.applyExecutedOrder.mock.calls).toHaveLength(0);
    expect(repository.settleBrokerStatus.mock.calls[0][0]).toMatchObject({
      nextStatus: 'SENT_TO_BROKER',
    });
  });

  it.each([
    ['canceled', 'CANCELLED'],
    ['rejected', 'REJECTED'],
    ['expired', 'FAILED'],
  ] as const)(
    'maps broker status %s to internal status %s',
    async (brokerStatus, nextStatus) => {
      repository.findSettlementContext.mockResolvedValue(context);
      brokerClient.getOrderStatus.mockResolvedValue({
        brokerName: 'ALPACA',
        externalOrderId: 'alpaca-id',
        brokerStatus,
        filledQuantity: 0,
        responseSummary: brokerStatus,
      });
      repository.settleBrokerStatus.mockResolvedValue(
        new OrderSettlement(
          '1',
          'order-reference',
          '101',
          'BUY',
          nextStatus,
          'AAPL',
          2,
          2,
          250,
          500,
          0,
          500,
          'USD',
          'ALPACA',
          'alpaca-id',
          brokerStatus,
          false,
          false,
          false,
          '2026-05-27T10:00:00.000Z',
        ),
      );

      await service.syncOrderSettlement({ orderReference: 'order-reference' });

      expect(repository.settleBrokerStatus.mock.calls[0][0]).toMatchObject({
        nextStatus,
      });
    },
  );

  it('converts controlled broker errors to conflicts', async () => {
    repository.findSettlementContext.mockResolvedValue(context);
    brokerClient.getOrderStatus.mockRejectedValue(
      new BrokerOrderSubmissionError({
        message: 'Broker did not answer in time',
        brokerName: 'ALPACA',
        brokerStatus: 'TIMEOUT',
        requestSummary: 'status',
      }),
    );

    await expect(
      service.syncOrderSettlement({ orderReference: 'order-reference' }),
    ).rejects.toThrow(ConflictException);
  });

  it('propagates unexpected portfolio settlement errors', async () => {
    repository.findSettlementContext.mockResolvedValue(context);
    brokerClient.getOrderStatus.mockResolvedValue({
      brokerName: 'ALPACA',
      externalOrderId: 'alpaca-id',
      brokerStatus: 'filled',
      filledQuantity: 2,
      averageFilledPrice: 251,
      responseSummary: 'filled',
    });
    const error = new Error('unexpected portfolio outage');
    portfolioClient.applyExecutedOrder.mockRejectedValue(error);

    await expect(
      service.syncOrderSettlement({
        orderReference: 'order-reference',
        authorizationHeader: 'Bearer token',
      }),
    ).rejects.toBe(error);
  });

  it('rejects unknown orders or executions', async () => {
    repository.findSettlementContext.mockResolvedValue(null);

    await expect(
      service.syncOrderSettlement({ orderReference: 'missing' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects blank order references', async () => {
    await expect(
      service.syncOrderSettlement({ orderReference: ' ' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects terminal orders to avoid duplicate settlement', async () => {
    repository.findSettlementContext.mockResolvedValue({
      ...context,
      order: { ...context.order, status: 'EXECUTED' },
    });

    await expect(
      service.syncOrderSettlement({ orderReference: 'order-reference' }),
    ).rejects.toThrow(ConflictException);
  });
});
