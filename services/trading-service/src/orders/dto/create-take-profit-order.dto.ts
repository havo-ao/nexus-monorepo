import { ApiProperty } from '@nestjs/swagger';

export class CreateTakeProfitOrderDto {
  @ApiProperty({
    example: '101',
    description:
      'Trader identifier that owns the position protected by take profit.',
  })
  traderId!: string;

  @ApiProperty({
    example: '1',
    description: 'Portfolio stock identifier used for holdings validation.',
  })
  stockId!: string;

  @ApiProperty({
    example: 'AAPL',
    description: 'Instrument symbol protected by the take profit.',
  })
  symbol!: string;

  @ApiProperty({
    example: '1',
    description: 'Market exchange identifier associated with the order.',
  })
  exchangeId!: string;

  @ApiProperty({
    example: 3,
    description: 'Number of shares to sell if the profit target is reached.',
  })
  quantity!: number;

  @ApiProperty({
    example: 290,
    description:
      'Profit target price. The order waits until market price reaches or exceeds it.',
  })
  targetPrice!: number;

  @ApiProperty({
    example: 'USD',
    required: false,
    description: 'Order currency. Defaults to USD.',
  })
  currency?: string;
}
