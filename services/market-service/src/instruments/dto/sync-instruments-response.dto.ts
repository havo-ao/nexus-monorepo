import { ApiProperty } from '@nestjs/swagger';
import { InstrumentResponseDto } from './instrument-response.dto';

export class SyncInstrumentsResponseDto {
  @ApiProperty({ example: 'SUCCESS', enum: ['SUCCESS', 'FAILED'] })
  status!: 'SUCCESS' | 'FAILED';

  @ApiProperty({ example: 'alpha-vantage-listing' })
  provider!: string;

  @ApiProperty({ example: 1200 })
  updatedCount!: number;

  @ApiProperty({ example: false })
  preservedLocalCatalog!: boolean;

  @ApiProperty({ type: [InstrumentResponseDto] })
  instruments!: InstrumentResponseDto[];

  @ApiProperty({
    example: 'Synchronized 1200 available instruments',
  })
  message!: string;
}
