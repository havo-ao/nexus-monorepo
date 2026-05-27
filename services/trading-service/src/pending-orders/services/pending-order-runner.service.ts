import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PendingOrderProcessingService } from './pending-order-processing.service';

@Injectable()
export class PendingOrderRunnerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PendingOrderRunnerService.name);
  private interval?: NodeJS.Timeout;

  constructor(
    private readonly pendingOrderProcessingService: PendingOrderProcessingService,
  ) {}

  onModuleInit(): void {
    if (
      process.env.NODE_ENV === 'test' ||
      process.env.PENDING_ORDER_PROCESSOR_ENABLED !== 'true'
    ) {
      return;
    }

    this.interval = setInterval(
      () => void this.runProcessorSafely(),
      this.getIntervalMs(),
    );
  }

  onModuleDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private async runProcessorSafely(): Promise<void> {
    try {
      const result =
        await this.pendingOrderProcessingService.processPendingOrders({
          limit: this.getBatchSize(),
        });
      if (result.scanned > 0) {
        this.logger.log(
          `Processed ${result.scanned} pending orders; ${result.readyForExecution} ready`,
        );
      }
    } catch (error) {
      this.logger.warn(
        error instanceof Error
          ? error.message
          : 'Pending order processor failed unexpectedly',
      );
    }
  }

  private getIntervalMs(): number {
    const configuredInterval = Number(
      process.env.PENDING_ORDER_PROCESSOR_INTERVAL_MS,
    );
    return Number.isFinite(configuredInterval) && configuredInterval >= 5000
      ? configuredInterval
      : 60000;
  }

  private getBatchSize(): number {
    const configuredBatchSize = Number(
      process.env.PENDING_ORDER_PROCESSOR_BATCH_SIZE,
    );
    return Number.isInteger(configuredBatchSize) &&
      configuredBatchSize >= 1 &&
      configuredBatchSize <= 100
      ? configuredBatchSize
      : 25;
  }
}
