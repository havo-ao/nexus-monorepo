import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { MarketQuoteResponseDto } from '../dto/market-quote-response.dto';
import { SyncMarketDataDto } from '../dto/sync-market-data.dto';
import { SyncMarketDataResponseDto } from '../dto/sync-market-data-response.dto';
import { MarketQuote } from '../entities/market-quote.entity';
import { MARKET_DATA_PROVIDER } from '../providers/market-data-provider';
import type { MarketDataProvider } from '../providers/market-data-provider';
import {
  MarketDataSyncStatus,
  QUOTES_REPOSITORY,
} from '../repositories/quotes.repository';
import type { QuotesRepository } from '../repositories/quotes.repository';

@Injectable()
export class MarketDataSyncService {
  private readonly defaultSymbols = [
    'AAPL',
    'MSFT',
    'TSLA',
    'GOOGL',
    'AMZN',
    'NVDA',
    'META',
  ];

  constructor(
    @Inject(QUOTES_REPOSITORY)
    private readonly quotesRepository: QuotesRepository,
    @Inject(MARKET_DATA_PROVIDER)
    private readonly marketDataProvider: MarketDataProvider,
  ) {}

  async synchronizeMarketData(
    dto: SyncMarketDataDto,
  ): Promise<SyncMarketDataResponseDto> {
    const symbols = this.resolveSymbols(dto.symbols);
    const requestedBy = this.resolveRequestedBy(dto.requestedBy);
    const updatedQuotes: MarketQuote[] = [];
    const failedSymbols: string[] = [];

    for (const symbol of symbols) {
      try {
        const providerQuote = await this.marketDataProvider.fetchQuote(symbol);
        updatedQuotes.push(MarketQuote.fromProvider(providerQuote));
      } catch {
        failedSymbols.push(symbol);
      }
    }

    if (updatedQuotes.length > 0) {
      await this.quotesRepository.saveQuotes(updatedQuotes);
    }

    const status = this.resolveStatus(symbols.length, updatedQuotes.length);
    const preservedLastKnownData = failedSymbols.length > 0;
    const message = this.buildMessage(
      status,
      updatedQuotes.length,
      symbols.length,
    );

    await this.quotesRepository.recordSyncEvent({
      status,
      provider: this.marketDataProvider.name,
      requestedBy,
      symbolsCount: symbols.length,
      updatedCount: updatedQuotes.length,
      failedCount: failedSymbols.length,
      message,
    });

    return {
      status,
      provider: this.marketDataProvider.name,
      updatedQuotes: updatedQuotes.map((quote) => this.toResponse(quote)),
      failedSymbols,
      preservedLastKnownData,
      message,
    };
  }

  private resolveSymbols(symbols?: string[]): string[] {
    const inputSymbols =
      symbols && symbols.length > 0
        ? symbols
        : this.resolveDefaultSymbolsFromEnvironment();
    const normalizedSymbols = inputSymbols.map((symbol) => {
      if (typeof symbol !== 'string' || !symbol.trim()) {
        throw new BadRequestException('Symbols must be non-empty strings');
      }

      return symbol.trim().toUpperCase();
    });

    return [...new Set(normalizedSymbols)];
  }

  private resolveDefaultSymbolsFromEnvironment(): string[] {
    const configuredSymbols = process.env.MARKET_DATA_SYNC_SYMBOLS?.split(',')
      .map((symbol) => symbol.trim())
      .filter(Boolean);

    return configuredSymbols && configuredSymbols.length > 0
      ? configuredSymbols
      : this.defaultSymbols;
  }

  private resolveRequestedBy(requestedBy?: string): string {
    if (!requestedBy) {
      return 'system@nexus.local';
    }

    if (typeof requestedBy !== 'string' || !requestedBy.trim()) {
      throw new BadRequestException('requestedBy must be a non-empty string');
    }

    return requestedBy.trim();
  }

  private resolveStatus(
    symbolsCount: number,
    updatedCount: number,
  ): MarketDataSyncStatus {
    if (updatedCount === symbolsCount) {
      return 'SUCCESS';
    }

    return updatedCount > 0 ? 'PARTIAL_FAILURE' : 'FAILED';
  }

  private buildMessage(
    status: MarketDataSyncStatus,
    updatedCount: number,
    symbolsCount: number,
  ): string {
    if (status === 'SUCCESS') {
      return `Synchronized ${updatedCount} of ${symbolsCount} market quotes`;
    }

    if (status === 'PARTIAL_FAILURE') {
      return `Synchronized ${updatedCount} of ${symbolsCount} market quotes; preserved last known data for failed symbols`;
    }

    return 'Market data provider failed; preserved last known data when available';
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
