import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InstrumentDetailResponseDto } from './instrument-detail-response.dto';

export class InstrumentDetailSyncStepDto {
  @ApiProperty({
    example: 'SUCCESS',
    enum: ['SUCCESS', 'PARTIAL_FAILURE', 'FAILED'],
  })
  status: 'SUCCESS' | 'PARTIAL_FAILURE' | 'FAILED';

  @ApiProperty({ example: 'alpha-vantage-compatible' })
  provider: string;

  @ApiPropertyOptional({ example: 100 })
  updatedCount?: number;

  @ApiProperty({ example: 'Synchronized current quote for AAPL' })
  message: string;
}

export class SyncInstrumentDetailResponseDto {
  @ApiProperty({
    example: 'SUCCESS',
    enum: ['SUCCESS', 'PARTIAL_FAILURE', 'FAILED'],
  })
  status: 'SUCCESS' | 'PARTIAL_FAILURE' | 'FAILED';

  @ApiProperty({ example: 'AAPL' })
  symbol: string;

  @ApiProperty({ type: InstrumentDetailSyncStepDto })
  metadata: InstrumentDetailSyncStepDto;

  @ApiProperty({ type: InstrumentDetailSyncStepDto })
  quote: InstrumentDetailSyncStepDto;

  @ApiProperty({ type: InstrumentDetailSyncStepDto })
  history: InstrumentDetailSyncStepDto;

  @ApiProperty({
    example:
      'Instrument detail synchronization completed for AAPL with fresh metadata, quote and historical prices',
  })
  message: string;

  @ApiProperty({ type: InstrumentDetailResponseDto })
  instrument: InstrumentDetailResponseDto;
}
