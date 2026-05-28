import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateMarketStatusDto {
  @ApiProperty({
    example: '1',
    description:
      'Market exchange identifier used to resolve the local trading schedule.',
  })
  exchangeId!: string;

  @ApiPropertyOptional({
    example: '2026-05-12T14:30:00.000Z',
    description:
      'Optional ISO timestamp to evaluate. If omitted, the current server time is used.',
  })
  evaluatedAt?: string;
}
