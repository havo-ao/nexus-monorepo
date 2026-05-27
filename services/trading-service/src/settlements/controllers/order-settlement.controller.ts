import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SyncOrderSettlementDto } from '../dto/sync-order-settlement.dto';
import { OrderSettlementService } from '../services/order-settlement.service';

@ApiTags('settlements')
@Controller('orders')
export class OrderSettlementController {
  constructor(private readonly settlementService: OrderSettlementService) {}

  @Post(':orderReference/settlement/sync')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Synchronize broker status and settle an executed order',
  })
  @ApiParam({
    name: 'orderReference',
    description: 'Order reference previously sent to the broker.',
  })
  @ApiHeader({
    name: 'Authorization',
    required: true,
    description:
      'Bearer token issued by identity-service. It is forwarded to portfolio-service for trader-scoped settlement.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Broker status synchronized. If executed, trading requests portfolio settlement and notification delivery.',
  })
  syncOrderSettlement(
    @Param('orderReference') orderReference: string,
    @Headers('authorization') authorizationHeader: string | undefined,
    @Body() dto: SyncOrderSettlementDto,
  ) {
    return this.settlementService.syncOrderSettlement({
      orderReference,
      authorizationHeader,
      actorId: dto.actorId,
      notificationRecipient: dto.notificationRecipient,
    });
  }
}
