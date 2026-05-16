import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MarketQuoteHistoryResponseDto } from '../dto/market-quote-history-response.dto';
import { QuoteHistoryService } from '../services/quote-history.service';

@ApiTags('quotes')
@Controller({
  path: 'quotes',
  version: '1',
})
export class QuoteHistoryController {
  constructor(private readonly quoteHistoryService: QuoteHistoryService) {}

  @Get(':symbol/history')
  @ApiOperation({
    summary: 'Get historical prices by symbol',
    description:
      'Historia NEX-78: permite consultar el historico de precios de una accion para analizar su comportamiento. Trazabilidad: EC-REND-03, EC-DISP-08, ASR-19, ASR-24.',
  })
  @ApiParam({ name: 'symbol', example: 'AAPL' })
  @ApiOkResponse({ type: MarketQuoteHistoryResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid quote symbol' })
  getPriceHistory(
    @Param('symbol') symbol: string,
  ): Promise<MarketQuoteHistoryResponseDto> {
    return this.quoteHistoryService.getPriceHistory(symbol);
  }
}
