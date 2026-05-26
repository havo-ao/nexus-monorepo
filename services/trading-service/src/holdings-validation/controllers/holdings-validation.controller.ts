import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ValidateSellHoldingsDto } from '../dto/validate-sell-holdings.dto';
import { HoldingsValidationService } from '../services/holdings-validation.service';

@ApiTags('validations')
@Controller('validations/holdings')
export class HoldingsValidationController {
  constructor(
    private readonly holdingsValidationService: HoldingsValidationService,
  ) {}

  @Post('sell')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Validate available holdings before creating a sell order',
  })
  @ApiResponse({
    status: 200,
    description: 'Holdings validation result for the requested sell quantity.',
    schema: {
      examples: {
        approved: {
          value: {
            approved: true,
            traderId: '101',
            stockId: '1',
            symbol: 'AAPL',
            requestedQuantity: 3,
            availableQuantity: 10,
          },
        },
        rejected: {
          value: {
            approved: false,
            traderId: '101',
            stockId: '1',
            symbol: 'AAPL',
            requestedQuantity: 12,
            availableQuantity: 10,
            reason: 'Insufficient available holdings',
          },
        },
      },
    },
  })
  validateSellHoldings(@Body() dto: ValidateSellHoldingsDto) {
    return this.holdingsValidationService.validateSellHoldings(dto);
  }
}
