import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DistributeCommissionDto } from '../dto/distribute-commission.dto';
import { CommissionDistributionService } from '../services/commission-distribution.service';
import { Roles } from '../../auth/roles.decorator';

@ApiTags('commissions')
@Controller('commissions')
@Roles('TRADER', 'CONSULTANT', 'ADMIN')
export class CommissionDistributionController {
  constructor(
    private readonly commissionDistributionService: CommissionDistributionService,
  ) {}

  @Post('distribute')
  @ApiOperation({
    summary: 'Distribute a commission between platform and broker',
  })
  @ApiResponse({
    status: 201,
    description: 'Commission distribution result.',
    schema: {
      example: {
        traderId: '101',
        brokerId: '201',
        commissionAmount: 2.63,
        platformAmount: 1.84,
        brokerAmount: 0.79,
        platformShareBps: 7000,
        brokerShareBps: 3000,
        currency: 'USD',
        distributedAt: '2026-05-26T14:30:00.000Z',
      },
    },
  })
  distribute(@Body() dto: DistributeCommissionDto) {
    return this.commissionDistributionService.distribute(dto);
  }
}
