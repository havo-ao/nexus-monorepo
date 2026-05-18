import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MarketResponseDto } from '../dto/market-response.dto';
import { MarketsService } from '../services/markets.service';

@ApiTags('markets')
@Controller({
  path: 'markets',
  version: '1',
})
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Get()
  @ApiOperation({
    summary: 'List available markets',
    description:
      'Historia NEX-74: permite consultar los mercados disponibles para operar. Trazabilidad: EC-MOD-02, EC-REND-03, ASR-19.',
  })
  @ApiOkResponse({ type: MarketResponseDto, isArray: true })
  getAvailableMarkets(): Promise<MarketResponseDto[]> {
    return this.marketsService.getAvailableMarkets();
  }
}
