import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BrokerOrderSubmissionError,
  EXTERNAL_BROKER_CLIENT,
  type ExternalBrokerClient,
} from '../clients/external-broker.client';
import { BrokerOrderExecution } from '../entities/broker-order-execution.entity';
import {
  BROKER_EXECUTION_REPOSITORY,
  type BrokerExecutionRepository,
  type ExecutableOrder,
} from '../repositories/broker-execution.repository';
import { BrokerExecutionService } from './broker-execution.service';

describe('BrokerExecutionService', () => {
  let service: BrokerExecutionService;
  let repository: jest.Mocked<BrokerExecutionRepository>;
  let brokerClient: jest.Mocked<ExternalBrokerClient>;

  const executableOrder: ExecutableOrder = {
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
  };

  beforeEach(async () => {
    repository = {
      findExecutableOrder: jest.fn(),
      markOrderSentToBroker: jest.fn(),
      markOrderFailedByBroker: jest.fn(),
    };
    brokerClient = {
      sendOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrokerExecutionService,
        {
          provide: BROKER_EXECUTION_REPOSITORY,
          useValue: repository,
        },
        {
          provide: EXTERNAL_BROKER_CLIENT,
          useValue: brokerClient,
        },
      ],
    }).compile();

    service = module.get(BrokerExecutionService);
  });

  it('sends an executable order to the broker and persists the response', async () => {
    repository.findExecutableOrder.mockResolvedValue(executableOrder);
    brokerClient.sendOrder.mockResolvedValue({
      brokerName: 'ALPACA',
      externalOrderId: 'alpaca-order-reference',
      brokerStatus: 'ACCEPTED',
      requestSummary: 'BUY 1 AAPL MARKET',
      responseSummary: 'Broker accepted order alpaca-order-reference',
    });
    const execution = new BrokerOrderExecution(
      '1',
      'order-reference',
      '101',
      'BUY',
      'MARKET',
      'SENT_TO_BROKER',
      'AAPL',
      1,
      'alpaca-order-reference',
      'ACCEPTED',
      'ALPACA',
      '2026-05-26T14:30:00.000Z',
    );
    repository.markOrderSentToBroker.mockResolvedValue(execution);

    await expect(service.sendOrderToBroker(' order-reference ')).resolves.toBe(
      execution,
    );
    expect(repository.findExecutableOrder.mock.calls[0][0]).toBe(
      'order-reference',
    );
    expect(brokerClient.sendOrder.mock.calls[0][0]).toMatchObject({
      orderReference: 'order-reference',
      symbol: 'AAPL',
    });
    expect(repository.markOrderSentToBroker.mock.calls[0][0]).toMatchObject({
      order: executableOrder,
      brokerResponse: {
        brokerName: 'ALPACA',
        externalOrderId: 'alpaca-order-reference',
      },
    });
  });

  it('rejects unknown orders', async () => {
    repository.findExecutableOrder.mockResolvedValue(null);

    await expect(service.sendOrderToBroker('missing-order')).rejects.toThrow(
      NotFoundException,
    );
    expect(brokerClient.sendOrder.mock.calls).toHaveLength(0);
  });

  it('rejects blank order references', async () => {
    await expect(service.sendOrderToBroker(' ')).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.findExecutableOrder.mock.calls).toHaveLength(0);
    expect(brokerClient.sendOrder.mock.calls).toHaveLength(0);
  });

  it('rejects orders that are not pending execution', async () => {
    repository.findExecutableOrder.mockResolvedValue({
      ...executableOrder,
      status: 'PENDING_CONDITION',
    });

    await expect(service.sendOrderToBroker('order-reference')).rejects.toThrow(
      ConflictException,
    );
    expect(brokerClient.sendOrder.mock.calls).toHaveLength(0);
  });

  it('marks the order as failed when the broker rejects it', async () => {
    repository.findExecutableOrder.mockResolvedValue(executableOrder);
    brokerClient.sendOrder.mockRejectedValue(
      new BrokerOrderSubmissionError(
        'ALPACA',
        'FAILED',
        'BUY 1 AAPL MARKET',
        'Broker rejected the order submission',
      ),
    );
    const failedExecution = new BrokerOrderExecution(
      '1',
      'order-reference',
      '101',
      'BUY',
      'MARKET',
      'FAILED',
      'AAPL',
      1,
      'unavailable',
      'FAILED',
      'ALPACA',
      '2026-05-26T14:30:00.000Z',
    );
    repository.markOrderFailedByBroker.mockResolvedValue(failedExecution);

    await expect(service.sendOrderToBroker('order-reference')).resolves.toBe(
      failedExecution,
    );
    expect(repository.markOrderFailedByBroker.mock.calls[0][0]).toMatchObject({
      order: executableOrder,
      brokerName: 'ALPACA',
      brokerStatus: 'FAILED',
      requestSummary: 'BUY 1 AAPL MARKET',
      failureReason: 'Broker rejected the order submission',
    });
  });

  it('marks the order as failed when the broker throws an unexpected error', async () => {
    repository.findExecutableOrder.mockResolvedValue(executableOrder);
    brokerClient.sendOrder.mockRejectedValue(new Error('Broker timeout'));
    const failedExecution = new BrokerOrderExecution(
      '1',
      'order-reference',
      '101',
      'BUY',
      'MARKET',
      'FAILED',
      'AAPL',
      1,
      'unavailable',
      'FAILED',
      'UNKNOWN',
      '2026-05-26T14:30:00.000Z',
    );
    repository.markOrderFailedByBroker.mockResolvedValue(failedExecution);

    await expect(service.sendOrderToBroker('order-reference')).resolves.toBe(
      failedExecution,
    );
    expect(repository.markOrderFailedByBroker.mock.calls[0][0]).toMatchObject({
      order: executableOrder,
      brokerName: 'UNKNOWN',
      brokerStatus: 'FAILED',
      requestSummary: 'BUY 1 AAPL MARKET',
      failureReason: 'Broker timeout',
    });
  });
});
