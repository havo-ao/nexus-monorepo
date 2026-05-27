import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BrokerOrderValidation } from '../entities/broker-order-validation.entity';
import type { BrokerValidationDecision } from '../entities/broker-order-validation.entity';
import {
  BROKER_ORDER_VALIDATION_REPOSITORY,
  type BrokerOrderValidationRepository,
  type BrokerValidatableOrder,
} from '../repositories/broker-order-validation.repository';
import type { OrderStatus } from '../../orders/entities/trading-order.entity';

const VALIDATABLE_STATUSES: OrderStatus[] = [
  'PENDING_EXECUTION',
  'PENDING_CONDITION',
  'PENDING_MARKET_OPEN',
];

export type ValidateOrderByBrokerInput = {
  orderReference: string;
  brokerId: string;
  decision: BrokerValidationDecision;
  reason?: string;
};

@Injectable()
export class BrokerOrderValidationService {
  constructor(
    @Inject(BROKER_ORDER_VALIDATION_REPOSITORY)
    private readonly validationRepository: BrokerOrderValidationRepository,
  ) {}

  async validateOrder(
    input: ValidateOrderByBrokerInput,
  ): Promise<BrokerOrderValidation> {
    this.assertValidInput(input);

    const order = await this.validationRepository.findOrderByReference(
      input.orderReference.trim(),
    );
    if (!order) {
      throw new NotFoundException('Order was not found');
    }
    if (!VALIDATABLE_STATUSES.includes(order.status)) {
      throw new ConflictException(
        `Order cannot be validated from status ${order.status}`,
      );
    }

    const decision = input.decision;
    const reason =
      input.reason?.trim() ||
      (decision === 'APPROVE'
        ? 'Order approved by broker'
        : 'Order rejected by broker');

    return this.validationRepository.saveValidation({
      order,
      brokerId: input.brokerId.trim(),
      decision,
      nextStatus: this.resolveNextStatus(order, decision),
      reason,
    });
  }

  private assertValidInput(input: ValidateOrderByBrokerInput): void {
    if (!input.orderReference || input.orderReference.trim().length === 0) {
      throw new BadRequestException('orderReference is required');
    }
    if (!input.brokerId || input.brokerId.trim().length === 0) {
      throw new BadRequestException('brokerId is required');
    }
    if (input.decision !== 'APPROVE' && input.decision !== 'REJECT') {
      throw new BadRequestException('decision must be APPROVE or REJECT');
    }
  }

  private resolveNextStatus(
    order: BrokerValidatableOrder,
    decision: BrokerValidationDecision,
  ) {
    if (decision === 'REJECT') {
      return 'REJECTED';
    }
    return order.status;
  }
}
