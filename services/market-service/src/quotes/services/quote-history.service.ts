import { Inject, Injectable } from '@nestjs/common';
import { MarketQuoteHistoryResponseDto } from '../dto/market-quote-history-response.dto';
import { toMarketQuoteResponse } from '../mappers/market-quote-response.mapper';
import { QUOTES_REPOSITORY } from '../repositories/quotes.repository';
import type { QuotesRepository } from '../repositories/quotes.repository';
import { normalizeQuoteSymbol } from '../utils/quote-symbol.util';

@Injectable()
export class QuoteHistoryService {
  constructor(
    @Inject(QUOTES_REPOSITORY)
    private readonly quotesRepository: QuotesRepository,
  ) {}

  async getPriceHistory(
    symbol: string,
  ): Promise<MarketQuoteHistoryResponseDto> {
    const normalizedSymbol = normalizeQuoteSymbol(symbol);
    const prices =
      await this.quotesRepository.findHistoryBySymbol(normalizedSymbol);

    return {
      symbol: normalizedSymbol,
      prices: prices.map(toMarketQuoteResponse),
    };
  }
}
