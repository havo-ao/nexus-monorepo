import { Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BrokerExecutionService } from '../services/broker-execution.service';

@ApiTags('executions')
@Controller('executions/broker')
export class BrokerExecutionController {
  constructor(
    private readonly brokerExecutionService: BrokerExecutionService,
  ) {}

  @Post('orders/:orderReference/send')
  @ApiOperation({
    summary: 'Send a pending order to the external broker',
  })
  @ApiParam({
    name: 'orderReference',
    description: 'Order reference to send to the broker.',
    example: 'order-reference',
  })
  @ApiResponse({
    status: 201,
    description:
      'Broker execution request accepted or recorded as a controlled failure.',
    schema: {
      example: {
        orderId: '1',
        orderReference: 'order-reference',
        traderId: '101',
        side: 'BUY',
        orderType: 'MARKET',
        status: 'SENT_TO_BROKER',
        symbol: 'AAPL',
        quantity: 1,
        externalOrderId: 'alpaca-order-reference',
        brokerStatus: 'ACCEPTED',
        brokerName: 'ALPACA',
        sentAt: '2026-05-26T14:30:00.000Z',
      },
    },
  })
  send(@Param('orderReference') orderReference: string) {
    return this.brokerExecutionService.sendOrderToBroker(orderReference);
  }
}
