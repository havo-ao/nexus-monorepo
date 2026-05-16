import { ApiProperty } from '@nestjs/swagger';
import { PriceAlertEventResponseDto } from './price-alert-event-response.dto';

export class EvaluatePriceAlertsResponseDto {
  @ApiProperty({ example: 3 })
  evaluatedCount: number;

  @ApiProperty({ example: 1 })
  triggeredCount: number;

  @ApiProperty({ type: [PriceAlertEventResponseDto] })
  triggeredEvents: PriceAlertEventResponseDto[];
}
