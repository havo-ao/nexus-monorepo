import { ApiProperty } from '@nestjs/swagger';

export class ValidateBuyFundsDto {
  @ApiProperty({
    example: '101',
    description:
      'Trader identifier used to resolve the available wallet balance.',
  })
  traderId!: string;

  @ApiProperty({
    example: 750,
    description: 'Gross buy amount to validate against the available balance.',
  })
  grossAmount!: number;
}
