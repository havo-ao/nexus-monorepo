import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateLimitBuyOrderDto } from '../dto/create-limit-buy-order.dto';
import { CreateLimitSellOrderDto } from '../dto/create-limit-sell-order.dto';
import { CreateMarketBuyOrderDto } from '../dto/create-market-buy-order.dto';
import { CreateMarketSellOrderDto } from '../dto/create-market-sell-order.dto';
import { CreateStopLossOrderDto } from '../dto/create-stop-loss-order.dto';
import { CreateTakeProfitOrderDto } from '../dto/create-take-profit-order.dto';
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

  @Post('buy/limit')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Create a limit buy order with a target price condition',
  })
  @ApiResponse({
    status: 201,
    description:
      'Limit buy order created and moved to pending condition state.',
    schema: {
      example: {
        id: '2',
        orderReference: '87bc2f9f-0889-44b1-b790-2dff6f8c3526',
        traderId: '101',
        side: 'BUY',
        orderType: 'LIMIT',
        status: 'PENDING_CONDITION',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 3,
        estimatedUnitPrice: 240,
        limitPrice: 240,
        grossAmount: 720,
        reservedAmount: 720,
        currency: 'USD',
        createdAt: '2026-05-26T14:30:00.000Z',
      },
    },
  })
  createLimitBuyOrder(@Body() dto: CreateLimitBuyOrderDto) {
    return this.ordersService.createLimitBuyOrder(dto);
  }

  @Post('sell/market')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Create a market sell order after validating market and holdings',
  })
  @ApiResponse({
    status: 201,
    description:
      'Market sell order created and moved to pending execution state.',
    schema: {
      example: {
        id: '3',
        orderReference: '3606a8e4-3cbb-4e0b-9f29-2f5aa94e3d40',
        traderId: '101',
        stockId: '1',
        side: 'SELL',
        orderType: 'MARKET',
        status: 'PENDING_EXECUTION',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 3,
        estimatedUnitPrice: 250,
        grossAmount: 750,
        reservedAmount: 0,
        currency: 'USD',
        createdAt: '2026-05-26T14:30:00.000Z',
      },
    },
  })
  createMarketSellOrder(@Body() dto: CreateMarketSellOrderDto) {
    return this.ordersService.createMarketSellOrder(dto);
  }

  @Post('sell/limit')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Create a limit sell order with a target price condition',
  })
  @ApiResponse({
    status: 201,
    description:
      'Limit sell order created and moved to pending condition state.',
    schema: {
      example: {
        id: '4',
        orderReference: '9258a579-7a4e-44a6-a913-0c9f38d90988',
        traderId: '101',
        stockId: '1',
        side: 'SELL',
        orderType: 'LIMIT',
        status: 'PENDING_CONDITION',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 3,
        estimatedUnitPrice: 260,
        limitPrice: 260,
        grossAmount: 780,
        reservedAmount: 0,
        currency: 'USD',
        createdAt: '2026-05-26T14:30:00.000Z',
      },
    },
  })
  createLimitSellOrder(@Body() dto: CreateLimitSellOrderDto) {
    return this.ordersService.createLimitSellOrder(dto);
  }

  @Post('sell/stop-loss')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Create a stop loss order with a downside trigger condition',
  })
  @ApiResponse({
    status: 201,
    description:
      'Stop loss order created and moved to pending condition state.',
    schema: {
      example: {
        id: '5',
        orderReference: 'eec72794-3242-4fb7-b8de-4199f9ae44f0',
        traderId: '101',
        stockId: '1',
        side: 'SELL',
        orderType: 'STOP_LOSS',
        status: 'PENDING_CONDITION',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 3,
        estimatedUnitPrice: 220,
        limitPrice: 220,
        grossAmount: 660,
        reservedAmount: 0,
        currency: 'USD',
        createdAt: '2026-05-26T14:30:00.000Z',
      },
    },
  })
  createStopLossOrder(@Body() dto: CreateStopLossOrderDto) {
    return this.ordersService.createStopLossOrder(dto);
  }

  @Post('sell/take-profit')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Create a take profit order with an upside target condition',
  })
  @ApiResponse({
    status: 201,
    description:
      'Take profit order created and moved to pending condition state.',
    schema: {
      example: {
        id: '6',
        orderReference: 'fac909bf-65a5-4070-8d81-9fc984189be5',
        traderId: '101',
        stockId: '1',
        side: 'SELL',
        orderType: 'TAKE_PROFIT',
        status: 'PENDING_CONDITION',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 3,
        estimatedUnitPrice: 290,
        limitPrice: 290,
        grossAmount: 870,
        reservedAmount: 0,
        currency: 'USD',
        createdAt: '2026-05-26T14:30:00.000Z',
      },
    },
  })
  createTakeProfitOrder(@Body() dto: CreateTakeProfitOrderDto) {
    return this.ordersService.createTakeProfitOrder(dto);
  }
}
