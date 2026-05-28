import { ApiProperty } from '@nestjs/swagger';

export class CreateMarketBuyOrderDto {
  @ApiProperty({
    example: '101',
    description: 'Trader identifier that owns the wallet used for the order.',
  })
  traderId!: string;

  @ApiProperty({
    example: 'AAPL',
    description: 'Instrument symbol to buy at market price.',
  })
  symbol!: string;

  @ApiProperty({
    example: '1',
    description: 'Market exchange identifier used for market status checks.',
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
    description: 'Number of shares requested for the market buy order.',
  })
  quantity!: number;

  @ApiProperty({
    example: 250,
    description:
      'Estimated unit price used to reserve funds before broker execution.',
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

  @ApiProperty({
    example: true,
    required: false,
    description:
      'When true, a market order created while the market is closed is queued until market opens. Defaults to true.',
  })
  queueWhenMarketClosed?: boolean;
}
