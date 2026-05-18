import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { InstrumentDetailResponseDto } from '../dto/instrument-detail-response.dto';
import { InstrumentResponseDto } from '../dto/instrument-response.dto';
import { InstrumentDetailService } from '../services/instrument-detail.service';
import { InstrumentsService } from '../services/instruments.service';

@ApiTags('instruments')
@Controller({
  path: 'instruments',
  version: '1',
})
export class InstrumentsController {
  constructor(
    private readonly instrumentsService: InstrumentsService,
    private readonly instrumentDetailService: InstrumentDetailService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List available instruments',
    description:
      'Historia NEX-75: permite consultar el listado general de acciones disponibles. Trazabilidad: EC-MOD-02, EC-REND-03, ASR-19.',
  })
  @ApiOkResponse({ type: InstrumentResponseDto, isArray: true })
  getAvailableInstruments(): Promise<InstrumentResponseDto[]> {
    return this.instrumentsService.getAvailableInstruments();
  }

  @Get(':symbol')
  @ApiOperation({
    summary: 'Get instrument detail',
    description:
      'Historia NEX-76: permite consultar informacion relevante de una accion. Trazabilidad: EC-MOD-02, EC-REND-03, ASR-19, ASR-24.',
  })
  @ApiParam({ name: 'symbol', example: 'AAPL' })
  @ApiOkResponse({ type: InstrumentDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid instrument symbol' })
  @ApiNotFoundResponse({ description: 'Instrument detail is not available' })
  getInstrumentDetail(
    @Param('symbol') symbol: string,
  ): Promise<InstrumentDetailResponseDto> {
    return this.instrumentDetailService.getInstrumentDetail(symbol);
  }
}
