/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException } from '@nestjs/common';
import type { MarketValidationService } from '../../market-validation/services/market-validation.service';
import type { MarketPriceClient } from '../clients/market-price.client';
import type {
  PendingOrderRepository,
  ProcessableOrder,
} from '../repositories/pending-order.repository';
import { PendingOrderProcessingService } from './pending-order-processing.service';

describe('PendingOrderProcessingService', () => {
  let repository: jest.Mocked<PendingOrderRepository>;
  let marketPriceClient: jest.Mocked<MarketPriceClient>;
  let marketValidationService: jest.Mocked<MarketValidationService>;
  let service: PendingOrderProcessingService;

  beforeEach(() => {
    repository = {
      findProcessableOrders: jest.fn(),
      recordEvaluation: jest.fn(),
      markReadyForExecution: jest.fn(),
    };
    marketPriceClient = {
      getLatestPrice: jest.fn(),
    };
    marketValidationService = {
      validateMarketStatus: jest.fn(),
    } as unknown as jest.Mocked<MarketValidationService>;
    service = new PendingOrderProcessingService(
      repository,
      marketPriceClient,
      marketValidationService,
    );
  });

  it('moves queued market orders to pending execution when market opens', async () => {
    const order = processableOrder({
      status: 'PENDING_MARKET_OPEN',
      orderType: 'MARKET',
    });
    repository.findProcessableOrders.mockResolvedValue([order]);
    marketValidationService.validateMarketStatus.mockResolvedValue({
      canOperate: true,
      exchangeId: '1',
      marketStatus: 'OPEN',
      evaluatedAt: new Date('2026-05-12T14:30:00.000Z'),
    });
    repository.markReadyForExecution.mockResolvedValue({
      ...order,
      status: 'PENDING_EXECUTION',
    });

    const result = await service.processPendingOrders({
      evaluatedAt: '2026-05-12T14:30:00.000Z',
    });

    expect(result).toMatchObject({
      scanned: 1,
      readyForExecution: 1,
      waiting: 0,
      failed: 0,
    });
    expect(repository.markReadyForExecution).toHaveBeenCalledWith(
      expect.objectContaining({
        order,
        action: 'MARKET_OPEN_MATCHED',
        marketStatus: 'OPEN',
        nextStatus: 'PENDING_EXECUTION',
      }),
    );
  });

  it('records queued market orders while market remains closed', async () => {
    const order = processableOrder({ status: 'PENDING_MARKET_OPEN' });
    repository.findProcessableOrders.mockResolvedValue([order]);
    marketValidationService.validateMarketStatus.mockResolvedValue({
      canOperate: false,
      exchangeId: '1',
      marketStatus: 'CLOSED',
      evaluatedAt: new Date('2026-05-12T22:00:00.000Z'),
      reason: 'Market is closed at this time',
    });

    const result = await service.processPendingOrders({
      evaluatedAt: '2026-05-12T22:00:00.000Z',
    });

    expect(result.evaluations[0]).toMatchObject({
      status: 'WAITING_MARKET_OPEN',
      marketStatus: 'CLOSED',
      reason: 'Market is closed at this time',
    });
    expect(repository.recordEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'WAITING_MARKET_OPEN',
        matched: false,
        marketStatus: 'CLOSED',
      }),
    );
  });

  it('moves conditional orders to pending execution when price condition matches', async () => {
    const order = processableOrder({
      side: 'SELL',
      orderType: 'TAKE_PROFIT',
      status: 'PENDING_CONDITION',
      limitPrice: 280,
    });
    repository.findProcessableOrders.mockResolvedValue([order]);
    marketPriceClient.getLatestPrice.mockResolvedValue({
      symbol: 'AAPL',
      price: 290,
    });
    repository.markReadyForExecution.mockResolvedValue({
      ...order,
      status: 'PENDING_EXECUTION',
      estimatedUnitPrice: 290,
      grossAmount: 290,
    });

    const result = await service.processPendingOrders();

    expect(result.readyForExecution).toBe(1);
    expect(repository.markReadyForExecution).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CONDITION_MATCHED',
        marketPrice: 290,
        triggerPrice: 280,
      }),
    );
  });

  it('matches sell limit and stop loss conditions without changing unmatched order types', async () => {
    const sellLimit = processableOrder({
      orderReference: 'sell-limit',
      side: 'SELL',
      orderType: 'LIMIT',
      limitPrice: 260,
    });
    const stopLoss = processableOrder({
      orderReference: 'stop-loss',
      side: 'SELL',
      orderType: 'STOP_LOSS',
      limitPrice: 240,
    });
    const unsupported = processableOrder({
      orderReference: 'unsupported',
      side: 'BUY',
      orderType: 'MARKET',
      limitPrice: 250,
    });
    repository.findProcessableOrders.mockResolvedValue([
      sellLimit,
      stopLoss,
      unsupported,
    ]);
    marketPriceClient.getLatestPrice
      .mockResolvedValueOnce({ symbol: 'AAPL', price: 265 })
      .mockResolvedValueOnce({ symbol: 'AAPL', price: 235 })
      .mockResolvedValueOnce({ symbol: 'AAPL', price: 250 });
    repository.markReadyForExecution.mockImplementation((command) =>
      Promise.resolve({ ...command.order, status: command.nextStatus }),
    );

    const result = await service.processPendingOrders({ limit: 3 });

    expect(result).toMatchObject({
      scanned: 3,
      readyForExecution: 2,
      waiting: 1,
    });
    expect(repository.markReadyForExecution).toHaveBeenCalledTimes(2);
    expect(repository.recordEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({
        order: unsupported,
        action: 'WAITING_CONDITION',
      }),
    );
  });

  it('keeps conditional orders pending when price condition does not match', async () => {
    const order = processableOrder({
      side: 'BUY',
      orderType: 'LIMIT',
      status: 'PENDING_CONDITION',
      limitPrice: 240,
    });
    repository.findProcessableOrders.mockResolvedValue([order]);
    marketPriceClient.getLatestPrice.mockResolvedValue({
      symbol: 'AAPL',
      price: 250,
    });

    const result = await service.processPendingOrders();

    expect(result.evaluations[0]).toMatchObject({
      status: 'WAITING_CONDITION',
      marketPrice: 250,
      triggerPrice: 240,
    });
    expect(repository.recordEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'WAITING_CONDITION',
        matched: false,
      }),
    );
  });

  it('records controlled failures for missing trigger prices and quote errors', async () => {
    const missingTrigger = processableOrder({
      status: 'PENDING_CONDITION',
      limitPrice: undefined,
    });
    const quoteFailure = processableOrder({
      orderReference: 'quote-failure',
      status: 'PENDING_CONDITION',
      limitPrice: 250,
    });
    repository.findProcessableOrders.mockResolvedValue([
      missingTrigger,
      quoteFailure,
    ]);
    marketPriceClient.getLatestPrice.mockRejectedValue(
      new Error('Market quote service is unavailable'),
    );

    const result = await service.processPendingOrders();

    expect(result.failed).toBe(2);
    expect(repository.recordEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({
        order: missingTrigger,
        action: 'MISSING_TRIGGER_PRICE',
      }),
    );
    expect(repository.recordEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({
        order: quoteFailure,
        action: 'PROCESSING_FAILED',
        reason: 'Market quote service is unavailable',
      }),
    );
  });

  it('validates processing input', async () => {
    await expect(
      service.processPendingOrders({ evaluatedAt: 'not-a-date' }),
    ).rejects.toThrow(BadRequestException);
    await expect(service.processPendingOrders({ limit: 0 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('records skipped statuses and non-error failures', async () => {
    const skipped = processableOrder({ status: 'EXECUTED' });
    const failing = processableOrder({
      orderReference: 'failing-order',
      side: 'SELL',
      orderType: 'LIMIT',
      limitPrice: 260,
    });
    repository.findProcessableOrders.mockResolvedValue([skipped, failing]);
    marketPriceClient.getLatestPrice.mockResolvedValue({
      symbol: 'AAPL',
      price: 270,
    });
    repository.markReadyForExecution.mockRejectedValue('boom');

    const result = await service.processPendingOrders({ limit: 2 });

    expect(result).toMatchObject({ scanned: 2, failed: 1, waiting: 1 });
    expect(repository.recordEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({
        order: skipped,
        action: 'SKIPPED_STATUS',
      }),
    );
    expect(repository.recordEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({
        order: failing,
        action: 'PROCESSING_FAILED',
        reason: 'Pending order evaluation failed unexpectedly',
      }),
    );
  });
});

function processableOrder(
  overrides: Partial<ProcessableOrder> = {},
): ProcessableOrder {
  return {
    id: '1',
    orderReference: 'order-reference',
    traderId: '101',
    side: 'BUY',
    orderType: 'LIMIT',
    status: 'PENDING_CONDITION',
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
