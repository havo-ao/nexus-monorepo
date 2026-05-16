import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { INSTRUMENTS_REPOSITORY } from '../../instruments/repositories/instruments.repository';
import type { InstrumentsRepository } from '../../instruments/repositories/instruments.repository';
import { toMarketQuoteResponse } from '../../quotes/mappers/market-quote-response.mapper';
import { QUOTES_REPOSITORY } from '../../quotes/repositories/quotes.repository';
import type { QuotesRepository } from '../../quotes/repositories/quotes.repository';
import { WatchlistResponseDto } from '../dto/watchlist-response.dto';
import { WatchlistItem } from '../entities/watchlist-item.entity';
import { WATCHLISTS_REPOSITORY } from '../repositories/watchlists.repository';
import type { WatchlistsRepository } from '../repositories/watchlists.repository';

@Injectable()
export class WatchlistsService {
  constructor(
    @Inject(WATCHLISTS_REPOSITORY)
    private readonly watchlistsRepository: WatchlistsRepository,
    @Inject(INSTRUMENTS_REPOSITORY)
    private readonly instrumentsRepository: InstrumentsRepository,
    @Inject(QUOTES_REPOSITORY)
    private readonly quotesRepository: QuotesRepository,
  ) {}

  async getWatchlist(traderId: string): Promise<WatchlistResponseDto> {
    const normalizedTraderId = this.normalizeTraderId(traderId);
    const items =
      await this.watchlistsRepository.findByTraderId(normalizedTraderId);

    return this.toResponse(normalizedTraderId, items);
  }

  async addSymbol(
    traderId: string,
    symbol: string,
  ): Promise<WatchlistResponseDto> {
    const normalizedTraderId = this.normalizeTraderId(traderId);
    const normalizedSymbol = this.normalizeSymbol(symbol);
    const instrument =
      await this.instrumentsRepository.findBySymbol(normalizedSymbol);

    if (!instrument) {
      throw new NotFoundException(
        `Instrument ${normalizedSymbol} is not available`,
      );
    }

    await this.watchlistsRepository.addItem(
      WatchlistItem.create({
        traderId: normalizedTraderId,
        symbol: normalizedSymbol,
        addedAt: new Date(),
      }),
    );

    return this.getWatchlist(normalizedTraderId);
  }

  async removeSymbol(
    traderId: string,
    symbol: string,
  ): Promise<WatchlistResponseDto> {
    const normalizedTraderId = this.normalizeTraderId(traderId);
    const normalizedSymbol = this.normalizeSymbol(symbol);

    await this.watchlistsRepository.removeItem(
      normalizedTraderId,
      normalizedSymbol,
    );

    return this.getWatchlist(normalizedTraderId);
  }

  private normalizeTraderId(traderId: string): string {
    if (typeof traderId !== 'string' || !traderId.trim()) {
      throw new BadRequestException('traderId must be a non-empty string');
    }

    return traderId.trim();
  }

  private normalizeSymbol(symbol: string): string {
    if (typeof symbol !== 'string' || !symbol.trim()) {
      throw new BadRequestException('Symbol must be a non-empty string');
    }

    return symbol.trim().toUpperCase();
  }

  private async toResponse(
    traderId: string,
    items: WatchlistItem[],
  ): Promise<WatchlistResponseDto> {
    const responseItems = await Promise.all(
      items.map(async (item) => {
        const snapshot = item.toSnapshot();
        const quote = await this.quotesRepository.findLatestBySymbol(
          snapshot.symbol,
        );

        return {
          symbol: snapshot.symbol,
          addedAt: snapshot.addedAt.toISOString(),
          quote: quote ? toMarketQuoteResponse(quote) : null,
        };
      }),
    );

    return {
      traderId,
      items: responseItems,
    };
  }
}
