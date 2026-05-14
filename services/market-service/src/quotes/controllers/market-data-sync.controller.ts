import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SyncMarketDataDto } from '../dto/sync-market-data.dto';
import { SyncMarketDataResponseDto } from '../dto/sync-market-data-response.dto';
import { MarketDataSyncService } from '../services/market-data-sync.service';

@ApiTags('quotes')
@Controller({
  path: 'quotes',
  version: '1',
})
export class MarketDataSyncController {
  constructor(private readonly marketDataSyncService: MarketDataSyncService) {}

  @Post('sync')
  @ApiOperation({
    summary: 'Synchronize market quotes from provider',
    description:
      'Historia NEX-79: sincroniza cotizaciones desde un proveedor externo y conserva el ultimo dato valido si falla. Trazabilidad: EC-DISP-08, EC-REND-03, ASR-19, ASR-24.',
  })
  @ApiOkResponse({ type: SyncMarketDataResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid synchronization request' })
  @HttpCode(HttpStatus.OK)
  synchronizeMarketData(
    @Body() dto: SyncMarketDataDto,
  ): Promise<SyncMarketDataResponseDto> {
    return this.marketDataSyncService.synchronizeMarketData(dto);
  }
}
