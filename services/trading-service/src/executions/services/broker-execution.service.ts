import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EXTERNAL_BROKER_CLIENT,
  BrokerOrderSubmissionError,
  type ExternalBrokerClient,
} from '../clients/external-broker.client';
import type { BrokerOrderExecution } from '../entities/broker-order-execution.entity';
import {
  BROKER_EXECUTION_REPOSITORY,
  type BrokerExecutionRepository,
} from '../repositories/broker-execution.repository';

@Injectable()
export class BrokerExecutionService {
  constructor(
    @Inject(BROKER_EXECUTION_REPOSITORY)
    private readonly executionRepository: BrokerExecutionRepository,
    @Inject(EXTERNAL_BROKER_CLIENT)
    private readonly brokerClient: ExternalBrokerClient,
  ) {}

  async sendOrderToBroker(
    orderReference: string,
  ): Promise<BrokerOrderExecution> {
    if (!orderReference || orderReference.trim().length === 0) {
      throw new NotFoundException('orderReference is required');
    }

    const order = await this.executionRepository.findExecutableOrder(
      orderReference.trim(),
    );
    if (!order) {
      throw new NotFoundException('Order was not found');
    }
    if (order.status !== 'PENDING_EXECUTION') {
      throw new ConflictException(
        `Order cannot be sent to broker from status ${order.status}`,
      );
    }

    try {
      const brokerResponse = await this.brokerClient.sendOrder({
        orderReference: order.orderReference,
        side: order.side,
        orderType: order.orderType,
        symbol: order.symbol,
        quantity: order.quantity,
        estimatedUnitPrice: order.estimatedUnitPrice,
        currency: order.currency,
      });

      return this.executionRepository.markOrderSentToBroker({
        order,
        brokerResponse,
      });
    } catch (error) {
      return this.executionRepository.markOrderFailedByBroker({
        order,
        brokerName:
          error instanceof BrokerOrderSubmissionError
            ? error.brokerName
            : 'UNKNOWN',
        brokerStatus:
          error instanceof BrokerOrderSubmissionError
            ? error.brokerStatus
            : 'FAILED',
        requestSummary:
          error instanceof BrokerOrderSubmissionError
            ? error.requestSummary
            : `${order.side} ${order.quantity} ${order.symbol} ${order.orderType}`,
        failureReason:
          error instanceof Error
            ? error.message
            : 'Broker execution failed unexpectedly',
      });
    }
  }
}
