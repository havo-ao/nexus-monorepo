import { ApiProperty } from '@nestjs/swagger';
import { DashboardInstrumentDto } from './dashboard-instrument.dto';
import { DashboardMarketDto } from './dashboard-market.dto';
import { DashboardQuoteDto } from './dashboard-quote.dto';

class DashboardMarketsSummaryDto {
  @ApiProperty({ example: 5 })
  total: number;

  @ApiProperty({ example: 5 })
  active: number;

  @ApiProperty({ type: [DashboardMarketDto] })
  items: DashboardMarketDto[];
}

class DashboardInstrumentsSummaryDto {
  @ApiProperty({ example: 6 })
  total: number;

  @ApiProperty({ type: [DashboardInstrumentDto] })
  sample: DashboardInstrumentDto[];
}

class DashboardQuotesSummaryDto {
  @ApiProperty({ example: 3 })
  trackedCount: number;

  @ApiProperty({ type: [DashboardQuoteDto] })
  latest: DashboardQuoteDto[];

  @ApiProperty({ type: [DashboardQuoteDto] })
  topGainers: DashboardQuoteDto[];

  @ApiProperty({ type: [DashboardQuoteDto] })
  topLosers: DashboardQuoteDto[];
}

class DashboardPlatformSummaryDto {
  @ApiProperty({ example: 'market-service' })
  service: string;

  @ApiProperty({ example: 'OPERATIONAL' })
  status: string;

  @ApiProperty({ example: '2026-05-16T12:00:00.000Z' })
  generatedAt: string;
}

export class DashboardResponseDto {
  @ApiProperty({ type: DashboardMarketsSummaryDto })
  markets: DashboardMarketsSummaryDto;

  @ApiProperty({ type: DashboardInstrumentsSummaryDto })
  instruments: DashboardInstrumentsSummaryDto;

  @ApiProperty({ type: DashboardQuotesSummaryDto })
  quotes: DashboardQuotesSummaryDto;

  @ApiProperty({ type: DashboardPlatformSummaryDto })
  platform: DashboardPlatformSummaryDto;
}
