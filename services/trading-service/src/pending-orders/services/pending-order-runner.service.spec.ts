/* eslint-disable @typescript-eslint/unbound-method */
import type { PendingOrderProcessingService } from './pending-order-processing.service';
import { PendingOrderRunnerService } from './pending-order-runner.service';

describe('PendingOrderRunnerService', () => {
  const originalEnv = process.env;
  let processingService: jest.Mocked<PendingOrderProcessingService>;

  beforeEach(() => {
    jest.useFakeTimers();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'development',
      PENDING_ORDER_PROCESSOR_ENABLED: 'true',
      PENDING_ORDER_PROCESSOR_INTERVAL_MS: '5000',
      PENDING_ORDER_PROCESSOR_BATCH_SIZE: '10',
    };
    processingService = {
      processPendingOrders: jest.fn().mockResolvedValue({
        scanned: 1,
        readyForExecution: 1,
      }),
    } as unknown as jest.Mocked<PendingOrderProcessingService>;
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env = originalEnv;
  });

  it('runs periodically only when enabled', () => {
    const service = new PendingOrderRunnerService(processingService);
    service.onModuleInit();
    jest.advanceTimersByTime(5000);

    expect(processingService.processPendingOrders).toHaveBeenCalledWith({
      limit: 10,
    });

    service.onModuleDestroy();
  });

  it('stays disabled during tests and tolerates processor failures', () => {
    process.env.NODE_ENV = 'test';
    const disabledService = new PendingOrderRunnerService(processingService);
    disabledService.onModuleInit();
    jest.advanceTimersByTime(5000);
    expect(processingService.processPendingOrders).not.toHaveBeenCalled();

    process.env.NODE_ENV = 'development';
    processingService.processPendingOrders.mockRejectedValueOnce(
      new Error('boom'),
    );
    const enabledService = new PendingOrderRunnerService(processingService);
    enabledService.onModuleInit();
    jest.advanceTimersByTime(5000);
    enabledService.onModuleDestroy();
  });

  it('stays disabled when the flag is not set and uses safe defaults', () => {
    process.env.NODE_ENV = 'development';
    process.env.PENDING_ORDER_PROCESSOR_ENABLED = 'false';
    const disabledService = new PendingOrderRunnerService(processingService);
    disabledService.onModuleInit();
    disabledService.onModuleDestroy();
    jest.advanceTimersByTime(60000);
    expect(processingService.processPendingOrders).not.toHaveBeenCalled();

    process.env.PENDING_ORDER_PROCESSOR_ENABLED = 'true';
    process.env.PENDING_ORDER_PROCESSOR_INTERVAL_MS = '1';
    process.env.PENDING_ORDER_PROCESSOR_BATCH_SIZE = '999';
    processingService.processPendingOrders.mockResolvedValueOnce({
      scanned: 0,
      readyForExecution: 0,
    } as never);
    const enabledService = new PendingOrderRunnerService(processingService);
    enabledService.onModuleInit();
    jest.advanceTimersByTime(60000);
    expect(processingService.processPendingOrders).toHaveBeenCalledWith({
      limit: 25,
    });
    enabledService.onModuleDestroy();
  });
});
