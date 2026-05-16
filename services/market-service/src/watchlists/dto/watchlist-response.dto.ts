import { ApiProperty } from '@nestjs/swagger';
import { WatchlistItemResponseDto } from './watchlist-item-response.dto';

export class WatchlistResponseDto {
  @ApiProperty({ example: 'trader-123' })
  traderId: string;

  @ApiProperty({ type: WatchlistItemResponseDto, isArray: true })
  items: WatchlistItemResponseDto[];
}
