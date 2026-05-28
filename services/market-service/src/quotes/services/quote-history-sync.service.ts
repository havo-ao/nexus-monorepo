import { Inject, Injectable } from '@nestjs/common';
import { SyncQuoteHistoryResponseDto } from '../dto/sync-quote-history-response.dto';
import { MarketQuote } from '../entities/market-quote.entity';
import { toMarketQuoteResponse } from '../mappers/market-quote-response.mapper';
import { MARKET_HISTORY_PROVIDER } from '../providers/market-history-provider';
import type { MarketHistoryProvider } from '../providers/market-history-provider';
import { QUOTES_REPOSITORY } from '../repositories/quotes.repository';
import type { QuotesRepository } from '../repositories/quotes.repository';
import { normalizeQuoteSymbol } from '../utils/quote-symbol.util';

@Injectable()
export class QuoteHistorySyncService {
  constructor(
    @Inject(QUOTES_REPOSITORY)
    private readonly quotesRepository: QuotesRepository,
    @Inject(MARKET_HISTORY_PROVIDER)
    private readonly marketHistoryProvider: MarketHistoryProvider,
  ) {}

  async synchronizePriceHistory(
    symbol: string,
  ): Promise<SyncQuoteHistoryResponseDto> {
    const normalizedSymbol = normalizeQuoteSymbol(symbol);

    try {
      const providerQuotes =
        await this.marketHistoryProvider.fetchDailyHistory(normalizedSymbol);
      const historicalQuotes = providerQuotes.map((quote) =>
        MarketQuote.fromProvider(quote),
      );

      await this.quotesRepository.saveQuoteHistory(historicalQuotes);

      return {
        status: 'SUCCESS',
        provider: this.marketHistoryProvider.name,
        symbol: normalizedSymbol,
        updatedCount: historicalQuotes.length,
        preservedLocalHistory: false,
        prices: historicalQuotes.map((quote) => toMarketQuoteResponse(quote)),
        message: `Synchronized ${historicalQuotes.length} historical price points for ${normalizedSymbol}`,
      };
    } catch {
      const localHistory =
        await this.quotesRepository.findHistoryBySymbol(normalizedSymbol);

      return {
        status: 'FAILED',
        provider: this.marketHistoryProvider.name,
        symbol: normalizedSymbol,
        updatedCount: 0,
        preservedLocalHistory: true,
        prices: localHistory.map((quote) => toMarketQuoteResponse(quote)),
        message:
          'Historical market data provider failed; preserved local history when available',
      };
    }
  }
}
