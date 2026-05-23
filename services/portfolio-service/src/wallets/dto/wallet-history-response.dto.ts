import { ApiProperty } from '@nestjs/swagger';
import { WalletHistoryItemDto } from './wallet-history-item.dto';

export class WalletHistoryResponseDto {
  @ApiProperty({ example: '7' })
  traderId!: string;

  @ApiProperty({ type: [WalletHistoryItemDto] })
  movements!: WalletHistoryItemDto[];
}
