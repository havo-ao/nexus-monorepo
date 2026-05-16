import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MarketQuoteResponseDto } from '../../quotes/dto/market-quote-response.dto';
import { MarketQuote } from '../../quotes/entities/market-quote.entity';
import { QUOTES_REPOSITORY } from '../../quotes/repositories/quotes.repository';
import type { QuotesRepository } from '../../quotes/repositories/quotes.repository';
import { InstrumentDetailResponseDto } from '../dto/instrument-detail-response.dto';
import { Instrument } from '../entities/instrument.entity';
import { INSTRUMENTS_REPOSITORY } from '../repositories/instruments.repository';
import type { InstrumentsRepository } from '../repositories/instruments.repository';

@Injectable()
export class InstrumentDetailService {
  constructor(
    @Inject(INSTRUMENTS_REPOSITORY)
    private readonly instrumentsRepository: InstrumentsRepository,
    @Inject(QUOTES_REPOSITORY)
    private readonly quotesRepository: QuotesRepository,
  ) {}

  async getInstrumentDetail(
    symbol: string,
  ): Promise<InstrumentDetailResponseDto> {
    const normalizedSymbol = this.normalizeSymbol(symbol);
    const instrument =
      await this.instrumentsRepository.findBySymbol(normalizedSymbol);

    if (!instrument) {
      throw new NotFoundException(
        `Instrument ${normalizedSymbol} is not available`,
      );
    }

    const quote =
      await this.quotesRepository.findLatestBySymbol(normalizedSymbol);

    return this.toResponse(instrument, quote);
  }

  private normalizeSymbol(symbol: string): string {
    if (typeof symbol !== 'string' || !symbol.trim()) {
      throw new BadRequestException('Symbol must be a non-empty string');
    }

    return symbol.trim().toUpperCase();
  }

  private toResponse(
    instrument: Instrument,
    quote: MarketQuote | null,
  ): InstrumentDetailResponseDto {
    const snapshot = instrument.toSnapshot();

    return {
      symbol: snapshot.symbol,
      name: snapshot.name,
      marketCode: snapshot.marketCode,
      currency: snapshot.currency,
      sector: snapshot.sector,
      status: snapshot.status,
      quote: quote ? this.toQuoteResponse(quote) : null,
    };
  }

  private toQuoteResponse(quote: MarketQuote): MarketQuoteResponseDto {
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
