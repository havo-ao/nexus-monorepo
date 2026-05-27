import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ProcessPendingOrdersDto } from '../dto/process-pending-orders.dto';
import { PendingOrderProcessingResult } from '../entities/pending-order-processing-result.entity';
import { PendingOrderProcessingService } from '../services/pending-order-processing.service';

@ApiTags('pending-orders')
@Controller('orders/pending')
export class PendingOrderProcessingController {
  constructor(
    private readonly pendingOrderProcessingService: PendingOrderProcessingService,
  ) {}

  @Post('process')
  @ApiOperation({
    summary: 'Evaluate queued and conditional orders',
    description:
      'NEX-135: evaluates PENDING_MARKET_OPEN and PENDING_CONDITION orders using market-service data and moves matched orders to PENDING_EXECUTION.',
  })
  @ApiOkResponse({ type: PendingOrderProcessingResult })
  @ApiBadRequestResponse({ description: 'Invalid processing request' })
  processPendingOrders(
    @Body() body: ProcessPendingOrdersDto,
  ): Promise<PendingOrderProcessingResult> {
    return this.pendingOrderProcessingService.processPendingOrders(body);
  }
}
