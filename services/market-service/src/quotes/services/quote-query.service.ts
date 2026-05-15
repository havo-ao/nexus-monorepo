import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MarketQuoteResponseDto } from '../dto/market-quote-response.dto';
import { MarketQuote } from '../entities/market-quote.entity';
import { QUOTES_REPOSITORY } from '../repositories/quotes.repository';
import type { QuotesRepository } from '../repositories/quotes.repository';

@Injectable()
export class QuoteQueryService {
  constructor(
    @Inject(QUOTES_REPOSITORY)
    private readonly quotesRepository: QuotesRepository,
  ) {}

  async getLatestQuote(symbol: string): Promise<MarketQuoteResponseDto> {
    const normalizedSymbol = this.normalizeSymbol(symbol);
    const quote =
      await this.quotesRepository.findLatestBySymbol(normalizedSymbol);

    if (!quote) {
      throw new NotFoundException(
        `No market quote available for ${normalizedSymbol}`,
      );
    }

    return this.toResponse(quote);
  }

  private normalizeSymbol(symbol: string): string {
    if (typeof symbol !== 'string' || !symbol.trim()) {
      throw new BadRequestException('Symbol must be a non-empty string');
    }

    return symbol.trim().toUpperCase();
  }

  private toResponse(quote: MarketQuote): MarketQuoteResponseDto {
    const snapshot = quote.toSnapshot();

    return {
      symbol: snapshot.symbol,
      price: snapshot.price,
      bid: snapshot.bid,
      ask: snapshot.ask,
      spread: snapshot.spread,
      currency: snapshot.currency,
      provider: snapshot.provider,
      asOf: snapshot.asOf.toISOString(),
    };
  }
}
