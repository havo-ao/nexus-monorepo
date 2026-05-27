import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CalculateCommissionDto } from '../dto/calculate-commission.dto';
import { CommissionCalculationService } from '../services/commission-calculation.service';

@ApiTags('commissions')
@Controller('commissions')
export class CommissionCalculationController {
  constructor(
    private readonly commissionCalculationService: CommissionCalculationService,
  ) {}

  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate the commission for a trading operation',
  })
  @ApiResponse({
    status: 201,
    description: 'Commission calculation result.',
    schema: {
      example: {
        traderId: '101',
        side: 'BUY',
        orderType: 'MARKET',
        grossAmount: 750,
        rateBps: 35,
        commissionAmount: 2.63,
        netAmount: 752.63,
        currency: 'USD',
        calculatedAt: '2026-05-26T14:30:00.000Z',
      },
    },
  })
  calculate(@Body() dto: CalculateCommissionDto) {
    return this.commissionCalculationService.calculate(dto);
  }
}
