import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InstrumentResponseDto } from '../dto/instrument-response.dto';
import { InstrumentsService } from '../services/instruments.service';

@ApiTags('instruments')
@Controller({
  path: 'instruments',
  version: '1',
})
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentsService) {}

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
}
