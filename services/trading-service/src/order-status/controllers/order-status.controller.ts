import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrderStatusService } from '../services/order-status.service';

@ApiTags('order-status')
@Controller('orders')
export class OrderStatusController {
  constructor(private readonly orderStatusService: OrderStatusService) {}

  @Get(':orderReference/status')
  @ApiOperation({
    summary: 'Query the current status of a trading order',
  })
  @ApiParam({
    name: 'orderReference',
    example: 'order-reference',
    description: 'Public reference generated when the order was created.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current trading order status.',
    schema: {
      example: {
        orderId: '1',
        orderReference: 'order-reference',
        traderId: '101',
        side: 'BUY',
        orderType: 'MARKET',
        status: 'PENDING_EXECUTION',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 1,
        estimatedUnitPrice: 250,
        grossAmount: 250,
        reservedAmount: 250,
        currency: 'USD',
        createdAt: '2026-05-26T14:30:00.000Z',
        updatedAt: '2026-05-26T14:30:00.000Z',
      },
    },
  })
  getCurrentStatus(@Param('orderReference') orderReference: string) {
    return this.orderStatusService.getCurrentStatus(orderReference);
  }

  @Get(':orderReference/status-history')
  @ApiOperation({
    summary: 'Query the status history of a trading order',
  })
  @ApiParam({
    name: 'orderReference',
    example: 'order-reference',
    description: 'Public reference generated when the order was created.',
  })
  @ApiResponse({
    status: 200,
    description: 'Chronological trading order status history.',
    schema: {
      example: [
        {
          id: '1',
          orderId: '1',
          orderReference: 'order-reference',
          toStatus: 'PENDING_EXECUTION',
          actorType: 'TRADER',
          actorId: '101',
          reason: 'Market buy order created after funds reservation',
          createdAt: '2026-05-26T14:30:00.000Z',
        },
      ],
    },
  })
  getStatusHistory(@Param('orderReference') orderReference: string) {
    return this.orderStatusService.getStatusHistory(orderReference);
  }
}
