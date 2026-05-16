import { ApiProperty } from '@nestjs/swagger';

export class AddWatchlistItemDto {
  @ApiProperty({ example: 'AAPL' })
  symbol: string;
}
