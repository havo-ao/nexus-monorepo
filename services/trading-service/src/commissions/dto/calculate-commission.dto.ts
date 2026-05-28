import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  OrderSide,
  OrderType,
} from '../../orders/entities/trading-order.entity';

export class CalculateCommissionDto {
  @ApiProperty({
    description: 'Trader identifier that owns the operation.',
    example: '101',
  })
  traderId!: string;

  @ApiPropertyOptional({
    description: 'Order reference when the commission is linked to an order.',
    example: 'order-reference',
  })
  orderReference?: string;

  @ApiProperty({
    description: 'Operation side.',
    example: 'BUY',
    enum: ['BUY', 'SELL'],
  })
  side!: OrderSide;

  @ApiProperty({
    description: 'Order type used for the operation.',
    example: 'MARKET',
    enum: ['MARKET', 'LIMIT', 'STOP_LOSS', 'TAKE_PROFIT'],
  })
  orderType!: OrderType;

  @ApiProperty({
    description: 'Gross operation amount before commission.',
    example: 750,
  })
  grossAmount!: number;

  @ApiPropertyOptional({
    description: 'Currency for the calculation. Defaults to USD.',
    example: 'USD',
  })
  currency?: string;
}
