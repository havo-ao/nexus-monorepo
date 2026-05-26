import { ApiProperty } from '@nestjs/swagger';

export class CreateLimitSellOrderDto {
  @ApiProperty({
    example: '101',
    description: 'Trader identifier that owns the position to sell.',
  })
  traderId!: string;

  @ApiProperty({
    example: '1',
    description: 'Portfolio stock identifier used for holdings validation.',
  })
  stockId!: string;

  @ApiProperty({
    example: 'AAPL',
    description: 'Instrument symbol to sell when the limit condition is met.',
  })
  symbol!: string;

  @ApiProperty({
    example: '1',
    description: 'Market exchange identifier associated with the order.',
  })
  exchangeId!: string;

  @ApiProperty({
    example: 3,
    description: 'Number of shares requested for the limit sell order.',
  })
  quantity!: number;

  @ApiProperty({
    example: 260,
    description:
      'Minimum unit price accepted by the trader. The sell waits for this target.',
  })
  limitPrice!: number;

  @ApiProperty({
    example: 'USD',
    required: false,
    description: 'Order currency. Defaults to USD.',
  })
  currency?: string;
}
