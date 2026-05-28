import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ValidateOrderByBrokerDto } from '../dto/validate-order-by-broker.dto';
import { BrokerOrderValidationService } from '../services/broker-order-validation.service';
import { Roles } from '../../auth/roles.decorator';

@ApiTags('broker-validations')
@Controller('orders')
@Roles('CONSULTANT', 'ADMIN')
export class BrokerOrderValidationController {
  constructor(
    private readonly brokerOrderValidationService: BrokerOrderValidationService,
  ) {}

  @Post(':orderReference/broker-validation')
  @ApiOperation({
    summary: 'Approve or reject an order by broker validation',
  })
  @ApiParam({
    name: 'orderReference',
    description: 'Order reference that requires broker validation.',
    example: 'order-reference',
  })
  @ApiResponse({
    status: 201,
    description: 'Broker validation recorded and order state updated.',
    schema: {
      example: {
        orderId: '1',
        orderReference: 'order-reference',
        brokerId: '201',
        decision: 'APPROVE',
        status: 'PENDING_EXECUTION',
        reason: 'Order reviewed by assigned broker.',
        validatedAt: '2026-05-26T14:30:00.000Z',
      },
    },
  })
  validate(
    @Param('orderReference') orderReference: string,
    @Body() body: ValidateOrderByBrokerDto,
  ) {
    return this.brokerOrderValidationService.validateOrder({
      orderReference,
      brokerId: body.brokerId,
      decision: body.decision,
      reason: body.reason,
    });
  }
}
