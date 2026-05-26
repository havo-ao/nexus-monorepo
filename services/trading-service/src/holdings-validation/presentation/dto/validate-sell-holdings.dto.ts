import { ApiProperty } from '@nestjs/swagger';

export class ValidateSellHoldingsDto {
  @ApiProperty({
    example: '101',
    description: 'Trader identifier that owns the position.',
  })
  traderId!: string;

  @ApiProperty({
    example: '1',
    description: 'Portfolio stock identifier to validate before selling.',
  })
  stockId!: string;

  @ApiProperty({
    example: 'AAPL',
    required: false,
    description: 'Optional symbol used only for traceability and UI messages.',
  })
  symbol?: string;

  @ApiProperty({
    example: 3,
    description: 'Number of shares requested for the sell order.',
  })
  quantity!: number;
}
