import { ApiProperty } from '@nestjs/swagger';

export class CreateStopLossOrderDto {
  @ApiProperty({
    example: '101',
    description:
      'Trader identifier that owns the position protected by stop loss.',
  })
  traderId!: string;

  @ApiProperty({
    example: '1',
    description: 'Portfolio stock identifier used for holdings validation.',
  })
  stockId!: string;

  @ApiProperty({
    example: 'AAPL',
    description: 'Instrument symbol protected by the stop loss.',
  })
  symbol!: string;

  @ApiProperty({
    example: '1',
    description: 'Market exchange identifier associated with the order.',
  })
  exchangeId!: string;

  @ApiProperty({
    example: 3,
    description: 'Number of shares to sell if the stop threshold is reached.',
  })
  quantity!: number;

  @ApiProperty({
    example: 220,
    description:
      'Stop trigger price. The order waits until market price reaches or falls below it.',
  })
  stopPrice!: number;

  @ApiProperty({
    example: 'USD',
    required: false,
    description: 'Order currency. Defaults to USD.',
  })
  currency?: string;
}
