import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ValidateMarketStatusDto } from '../dto/validate-market-status.dto';
import { MarketValidationService } from '../services/market-validation.service';

@ApiTags('validations')
@Controller('validations/market')
export class MarketValidationController {
  constructor(
    private readonly marketValidationService: MarketValidationService,
  ) {}

  @Post('status')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Validate market status before sending an order to execution',
  })
  @ApiResponse({
    status: 200,
    description:
      'Market status validation result for the requested exchange schedule.',
    schema: {
      examples: {
        open: {
          value: {
            canOperate: true,
            exchangeId: '1',
            marketStatus: 'OPEN',
            evaluatedAt: '2026-05-12T14:30:00.000Z',
            timezone: 'America/New_York',
            openTime: '09:30:00',
            closeTime: '16:00:00',
          },
        },
        closed: {
          value: {
            canOperate: false,
            exchangeId: '1',
            marketStatus: 'CLOSED',
            evaluatedAt: '2026-05-12T22:00:00.000Z',
            timezone: 'America/New_York',
            openTime: '09:30:00',
            closeTime: '16:00:00',
            reason: 'Market is closed at this time',
          },
        },
      },
    },
  })
  validateMarketStatus(@Body() dto: ValidateMarketStatusDto) {
    return this.marketValidationService.validateMarketStatus(
      dto.exchangeId,
      dto.evaluatedAt,
    );
  }
}
