import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PriceAlertCondition } from '../entities/price-alert.entity';

export class CreatePriceAlertDto {
  @ApiProperty({ example: 'trader-123' })
  traderId: string;

  @ApiProperty({ example: 'AAPL' })
  symbol: string;

  @ApiProperty({ example: 190 })
  targetPrice: number;

  @ApiPropertyOptional({
    example: 'ABOVE_OR_EQUAL',
    enum: ['ABOVE_OR_EQUAL', 'BELOW_OR_EQUAL'],
  })
  condition?: PriceAlertCondition;
}
