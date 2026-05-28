import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MarketQuoteResponseDto } from '../dto/market-quote-response.dto';
import { toMarketQuoteResponse } from '../mappers/market-quote-response.mapper';
import { QUOTES_REPOSITORY } from '../repositories/quotes.repository';
import type { QuotesRepository } from '../repositories/quotes.repository';
import { normalizeQuoteSymbol } from '../utils/quote-symbol.util';

@Injectable()
export class QuoteQueryService {
  constructor(
    @Inject(QUOTES_REPOSITORY)
    private readonly quotesRepository: QuotesRepository,
  ) {}

  async getLatestQuote(symbol: string): Promise<MarketQuoteResponseDto> {
    const normalizedSymbol = normalizeQuoteSymbol(symbol);
    const quote =
      await this.quotesRepository.findLatestBySymbol(normalizedSymbol);

    if (!quote) {
      throw new NotFoundException(
        `No market quote available for ${normalizedSymbol}`,
      );
    }

    return toMarketQuoteResponse(quote);
  }
}
