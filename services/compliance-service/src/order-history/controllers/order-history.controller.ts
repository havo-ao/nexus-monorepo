import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RecordOrderHistoryEventDto } from '../dto/record-order-history-event.dto';
import { OrderHistoryService } from '../services/order-history.service';

@ApiTags('order-history')
@Controller({ path: 'order-history', version: '1' })
export class OrderHistoryController {
  constructor(private readonly orderHistoryService: OrderHistoryService) {}

  @Post('events')
  @ApiOperation({ summary: 'Record an operational order history event' })
  @ApiCreatedResponse({ description: 'Order history event recorded' })
  record(@Body() dto: RecordOrderHistoryEventDto) {
    return this.orderHistoryService.record(dto);
  }

  @Get('orders/:orderReference')
  @ApiOperation({ summary: 'Get the operational history for one order' })
  @ApiOkResponse({ description: 'Order history events' })
  findByOrder(@Param('orderReference') orderReference: string) {
    return this.orderHistoryService.findByOrder(orderReference);
  }
}
