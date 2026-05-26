import { ApiProperty } from '@nestjs/swagger';

export class CreateMarketSellOrderDto {
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
    description: 'Instrument symbol to sell at the best available price.',
  })
  symbol!: string;

  @ApiProperty({
    example: '1',
    description: 'Market exchange identifier used for market status checks.',
  })
  exchangeId!: string;

  @ApiProperty({
    example: 3,
    description: 'Number of shares requested for the market sell order.',
  })
  quantity!: number;

  @ApiProperty({
    example: 250,
    description: 'Estimated unit price used to calculate the gross amount.',
  })
  estimatedUnitPrice!: number;

  @ApiProperty({
    example: 'USD',
    required: false,
    description: 'Order currency. Defaults to USD.',
  })
  currency?: string;

  @ApiProperty({
    example: '2026-05-26T14:30:00.000Z',
    required: false,
    description:
      'Optional ISO timestamp used to evaluate market status. Defaults to now.',
  })
  marketEvaluatedAt?: string;
}
