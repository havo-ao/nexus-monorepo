import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { OrderCancellation } from '../entities/order-cancellation.entity';
import {
  ORDER_CANCELLATION_REPOSITORY,
  type OrderCancellationRepository,
} from '../repositories/order-cancellation.repository';

export type CancelOrderInput = {
  orderReference: string;
  actorId: string;
  reason?: string;
};

@Injectable()
export class OrderCancellationService {
  constructor(
    @Inject(ORDER_CANCELLATION_REPOSITORY)
    private readonly orderCancellationRepository: OrderCancellationRepository,
  ) {}

  async cancelOrder(input: CancelOrderInput): Promise<OrderCancellation> {
    if (!input.orderReference || input.orderReference.trim().length === 0) {
      throw new BadRequestException('orderReference is required');
    }
    if (!input.actorId || input.actorId.trim().length === 0) {
      throw new BadRequestException('actorId is required');
    }

    const result = await this.orderCancellationRepository.cancelOrder({
      orderReference: input.orderReference.trim(),
      actorId: input.actorId.trim(),
      reason:
        input.reason?.trim() ||
        'Trader requested cancellation before execution',
    });

    if (!result.cancelled || !result.cancellation) {
      if (result.reason === 'Order was not found') {
        throw new NotFoundException(result.reason);
      }
      throw new ConflictException(result.reason ?? 'Order cannot be cancelled');
    }

    return result.cancellation;
  }
}
