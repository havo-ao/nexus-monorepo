import { ApiProperty } from '@nestjs/swagger';

export class CreateLimitBuyOrderDto {
  @ApiProperty({
    example: '101',
    description: 'Trader identifier that owns the wallet used for the order.',
  })
  traderId!: string;

  @ApiProperty({
    example: 'AAPL',
    description: 'Instrument symbol to buy when the limit condition is met.',
  })
  symbol!: string;

  @ApiProperty({
    example: '1',
    description: 'Market exchange identifier associated with the order.',
  })
  exchangeId!: string;

  @ApiProperty({
    example: '1',
    required: false,
    description:
      'Stock identifier used to update the portfolio when the order is executed.',
  })
  stockId?: string;

  @ApiProperty({
    example: 3,
    description: 'Number of shares requested for the limit buy order.',
  })
  quantity!: number;

  @ApiProperty({
    example: 240,
    description:
      'Maximum unit price accepted by the trader. Funds are reserved using this value.',
  })
  limitPrice!: number;

  @ApiProperty({
    example: 'USD',
    required: false,
    description: 'Order currency. Defaults to USD.',
  })
  currency?: string;
}
