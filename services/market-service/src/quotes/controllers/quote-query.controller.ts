import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MarketQuoteResponseDto } from '../dto/market-quote-response.dto';
import { QuoteQueryService } from '../services/quote-query.service';

@ApiTags('quotes')
@Controller({
  path: 'quotes',
  version: '1',
})
export class QuoteQueryController {
  constructor(private readonly quoteQueryService: QuoteQueryService) {}

  @Get(':symbol')
  @ApiOperation({
    summary: 'Get latest quote by symbol',
    description:
      'Historia NEX-77: permite consultar precio actual, bid, ask y spread de una accion. Trazabilidad: EC-REND-03, EC-DISP-08, ASR-19, ASR-24.',
  })
  @ApiParam({ name: 'symbol', example: 'AAPL' })
  @ApiOkResponse({ type: MarketQuoteResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid quote symbol' })
  @ApiNotFoundResponse({ description: 'Quote is not available for symbol' })
  getLatestQuote(
    @Param('symbol') symbol: string,
  ): Promise<MarketQuoteResponseDto> {
    return this.quoteQueryService.getLatestQuote(symbol);
  }
}
