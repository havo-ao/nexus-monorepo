import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { MarketStatusResponseDto } from '../dto/market-status-response.dto';
import { MarketHoursService } from '../services/market-hours.service';

@ApiTags('market-hours')
@Controller({
  path: 'market-hours',
  version: '1',
})
export class MarketHoursController {
  constructor(private readonly marketHoursService: MarketHoursService) {}

  @Get(':marketCode/status')
  @ApiOperation({
    summary: 'Validate market operating status',
    description:
      'Historia NEX-82: valida si una orden puede continuar segun el horario operativo del mercado. Trazabilidad: EC-DISP-08, ASR-10, ASR-19.',
  })
  @ApiQuery({
    name: 'at',
    required: false,
    description:
      'ISO date-time used to evaluate the market status. Defaults to current server time.',
    example: '2026-05-11T14:00:00.000Z',
  })
  @ApiOkResponse({ type: MarketStatusResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid evaluation date' })
  @ApiNotFoundResponse({ description: 'Market configuration was not found' })
  getMarketStatus(
    @Param('marketCode') marketCode: string,
    @Query('at') at?: string,
  ): Promise<MarketStatusResponseDto> {
    return this.marketHoursService.getMarketStatus(
      marketCode,
      this.parseEvaluationDate(at),
    );
  }

  private parseEvaluationDate(at?: string): Date | undefined {
    if (!at) {
      return undefined;
    }

    const parsedDate = new Date(at);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(
        'Query parameter at must be an ISO date-time',
      );
    }

    return parsedDate;
  }
}
