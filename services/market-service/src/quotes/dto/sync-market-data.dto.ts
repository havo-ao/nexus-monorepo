import { ApiPropertyOptional } from '@nestjs/swagger';

export class SyncMarketDataDto {
  @ApiPropertyOptional({
    example: ['AAPL', 'MSFT', 'TSLA'],
    description: 'Symbols to synchronize. Defaults to the service watch set.',
  })
  symbols?: string[];

  @ApiPropertyOptional({ example: 'system@nexus.local' })
  requestedBy?: string;
}
