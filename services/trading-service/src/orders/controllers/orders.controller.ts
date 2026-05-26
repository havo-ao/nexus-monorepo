import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateMarketBuyOrderDto } from '../dto/create-market-buy-order.dto';
import { OrdersService } from '../services/orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('buy/market')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Create a market buy order after validating market and funds',
  })
  @ApiResponse({
    status: 201,
    description:
      'Market buy order created and moved to pending execution state.',
    schema: {
      example: {
        id: '1',
        orderReference: '1f8f32ab-cf21-4630-ae2a-6b6ecfbc4e78',
        traderId: '101',
        side: 'BUY',
        orderType: 'MARKET',
        status: 'PENDING_EXECUTION',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 3,
        estimatedUnitPrice: 250,
        grossAmount: 750,
        reservedAmount: 750,
        currency: 'USD',
        createdAt: '2026-05-26T14:30:00.000Z',
      },
    },
  })
  createMarketBuyOrder(@Body() dto: CreateMarketBuyOrderDto) {
    return this.ordersService.createMarketBuyOrder(dto);
  }
}
