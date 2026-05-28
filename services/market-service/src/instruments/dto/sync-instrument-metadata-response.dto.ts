import { ApiProperty } from '@nestjs/swagger';
import { InstrumentDetailResponseDto } from './instrument-detail-response.dto';

export class SyncInstrumentMetadataResponseDto {
  @ApiProperty({ example: 'SUCCESS', enum: ['SUCCESS', 'FAILED'] })
  status: string;

  @ApiProperty({ example: 'alpha-vantage-overview' })
  provider: string;

  @ApiProperty({ example: 'AAPL' })
  symbol: string;

  @ApiProperty({ example: false })
  preservedLastKnownMetadata: boolean;

  @ApiProperty({ example: 'Synchronized metadata for AAPL' })
  message: string;

  @ApiProperty({ type: InstrumentDetailResponseDto })
  instrument: InstrumentDetailResponseDto;
}
