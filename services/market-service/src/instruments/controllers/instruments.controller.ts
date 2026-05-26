import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
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
import { SyncInstrumentDetailResponseDto } from '../dto/sync-instrument-detail-response.dto';
import { SyncInstrumentMetadataResponseDto } from '../dto/sync-instrument-metadata-response.dto';
import { SyncInstrumentsResponseDto } from '../dto/sync-instruments-response.dto';
import { InstrumentDetailService } from '../services/instrument-detail.service';
import { InstrumentDetailSyncService } from '../services/instrument-detail-sync.service';
import { InstrumentMetadataSyncService } from '../services/instrument-metadata-sync.service';
import { InstrumentsSyncService } from '../services/instruments-sync.service';
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
    private readonly instrumentDetailSyncService: InstrumentDetailSyncService,
    private readonly instrumentsSyncService: InstrumentsSyncService,
    private readonly instrumentMetadataSyncService: InstrumentMetadataSyncService,
  ) {}

  @Post('sync')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Synchronize available instruments catalog',
    description:
      'Subtarea NEX-104: sincroniza catalogo de acciones desde proveedor externo y conserva el ultimo catalogo valido si el proveedor falla. Trazabilidad: EC-MOD-02, EC-REND-03, ASR-19, ASR-24.',
  })
  @ApiOkResponse({ type: SyncInstrumentsResponseDto })
  synchronizeInstruments(): Promise<SyncInstrumentsResponseDto> {
    return this.instrumentsSyncService.synchronizeInstruments();
  }

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

  @Post(':symbol/detail/sync')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Synchronize full instrument detail view',
    description:
      'Orquesta NEX-76, NEX-77, NEX-78, NEX-109 y NEX-111: prepara metadata, cotizacion actual e historico para cargar la pantalla de detalle de una accion sin mezclar logica de proveedor en el frontend. Trazabilidad: EC-MOD-02, EC-REND-03, EC-DISP-08, ASR-19, ASR-24.',
  })
  @ApiParam({ name: 'symbol', example: 'AAPL' })
  @ApiOkResponse({ type: SyncInstrumentDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid instrument symbol' })
  @ApiNotFoundResponse({ description: 'Instrument detail is not available' })
  synchronizeInstrumentDetail(
    @Param('symbol') symbol: string,
  ): Promise<SyncInstrumentDetailResponseDto> {
    return this.instrumentDetailSyncService.synchronizeInstrumentDetail(symbol);
  }

  @Post(':symbol/metadata/sync')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Synchronize instrument metadata',
    description:
      'Subtarea NEX-109: enriquece el detalle de una accion con metadata desde proveedor externo y conserva el ultimo dato valido si el proveedor falla. Trazabilidad: EC-MOD-02, EC-REND-03, ASR-19, ASR-24.',
  })
  @ApiParam({ name: 'symbol', example: 'AAPL' })
  @ApiOkResponse({ type: SyncInstrumentMetadataResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid instrument symbol' })
  @ApiNotFoundResponse({ description: 'Instrument metadata is not available' })
  synchronizeInstrumentMetadata(
    @Param('symbol') symbol: string,
  ): Promise<SyncInstrumentMetadataResponseDto> {
    return this.instrumentMetadataSyncService.synchronizeMetadata(symbol);
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
