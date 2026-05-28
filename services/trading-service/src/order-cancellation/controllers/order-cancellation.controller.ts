import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CancelOrderDto } from '../dto/cancel-order.dto';
import { OrderCancellationService } from '../services/order-cancellation.service';
import { Roles } from '../../auth/roles.decorator';

@ApiTags('order-cancellation')
@Controller('orders')
@Roles('TRADER', 'CONSULTANT', 'ADMIN')
export class OrderCancellationController {
  constructor(
    private readonly orderCancellationService: OrderCancellationService,
  ) {}

  @Post(':orderReference/cancel')
  @ApiOperation({
    summary: 'Cancel an order that has not reached a final state',
  })
  @ApiParam({
    name: 'orderReference',
    example: 'order-reference',
    description: 'Public reference generated when the order was created.',
  })
  @ApiResponse({
    status: 201,
    description: 'Order cancelled and status transition recorded.',
    schema: {
      example: {
        orderId: '1',
        orderReference: 'order-reference',
        previousStatus: 'PENDING_EXECUTION',
        currentStatus: 'CANCELLED',
        releasedAmount: 250,
        reason: 'Trader requested cancellation before execution',
      },
    },
  })
  cancelOrder(
    @Param('orderReference') orderReference: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orderCancellationService.cancelOrder({
      orderReference,
      actorId: dto.actorId,
      reason: dto.reason,
    });
  }
}
