import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ValidateBuyFundsDto } from '../dto/validate-buy-funds.dto';
import { FundsValidationService } from '../services/funds-validation.service';

@ApiTags('validations')
@Controller('validations')
export class ValidationsController {
  constructor(
    private readonly fundsValidationService: FundsValidationService,
  ) {}

  @Post('funds/buy')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Validate and reserve available funds before creating a buy order',
  })
  @ApiResponse({
    status: 200,
    description:
      'Funds validation and reservation result for the requested buy amount.',
    schema: {
      examples: {
        approved: {
          value: {
            approved: true,
            traderId: '101',
            availableAmount: 1000,
            requiredAmount: 750,
            reservedAmount: 750,
          },
        },
        rejected: {
          value: {
            approved: false,
            traderId: '101',
            availableAmount: 100,
            requiredAmount: 750,
            reservedAmount: 0,
            reason: 'Insufficient available funds',
          },
        },
      },
    },
  })
  validateBuyFunds(@Body() dto: ValidateBuyFundsDto) {
    return this.fundsValidationService.validateBuyFunds(
      dto.traderId,
      dto.grossAmount,
    );
  }
}
