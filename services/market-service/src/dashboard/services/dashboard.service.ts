import { Inject, Injectable } from '@nestjs/common';
import { INSTRUMENTS_REPOSITORY } from '../../instruments/repositories/instruments.repository';
import type { InstrumentsRepository } from '../../instruments/repositories/instruments.repository';
import { MARKETS_REPOSITORY } from '../../markets/repositories/markets.repository';
import type { MarketsRepository } from '../../markets/repositories/markets.repository';
import { QUOTES_REPOSITORY } from '../../quotes/repositories/quotes.repository';
import type { QuotesRepository } from '../../quotes/repositories/quotes.repository';
import { DashboardInstrumentDto } from '../dto/dashboard-instrument.dto';
import { DashboardMarketDto } from '../dto/dashboard-market.dto';
import { DashboardQuoteDto } from '../dto/dashboard-quote.dto';
import { DashboardResponseDto } from '../dto/dashboard-response.dto';

interface QuoteDashboardItem {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  currency: string;
  provider: string;
  asOf: string;
}

@Injectable()
export class DashboardService {
  private readonly maxDashboardItems = 5;

  constructor(
    @Inject(MARKETS_REPOSITORY)
    private readonly marketsRepository: MarketsRepository,
    @Inject(INSTRUMENTS_REPOSITORY)
    private readonly instrumentsRepository: InstrumentsRepository,
    @Inject(QUOTES_REPOSITORY)
    private readonly quotesRepository: QuotesRepository,
  ) {}

  async getDashboard(): Promise<DashboardResponseDto> {
    const [markets, instruments] = await Promise.all([
      this.marketsRepository.findAvailable(),
      this.instrumentsRepository.findAvailable(),
    ]);
    const instrumentItems = instruments.map((instrument) =>
      instrument.toSnapshot(),
    );
    const quoteItems = await this.resolveQuoteItems(instrumentItems);
    const latestQuotes = [...quoteItems];
    latestQuotes.sort((leftItem, rightItem) =>
      leftItem.symbol.localeCompare(rightItem.symbol),
    );

    const topGainers = quoteItems.filter((item) => item.changePercent >= 0);
    topGainers.sort(
      (leftItem, rightItem) => rightItem.changePercent - leftItem.changePercent,
    );

    const topLosers = quoteItems.filter((item) => item.changePercent < 0);
    topLosers.sort(
      (leftItem, rightItem) => leftItem.changePercent - rightItem.changePercent,
    );

    return {
      markets: {
        total: markets.length,
        active: markets.filter((market) => market.isAvailable()).length,
        items: markets
          .map((market): DashboardMarketDto => {
            const snapshot = market.toSnapshot();

            return {
              code: snapshot.code,
              name: snapshot.name,
              country: snapshot.country,
              currency: snapshot.currency,
              timezone: snapshot.timezone,
              status: snapshot.status,
            };
          })
          .slice(0, this.maxDashboardItems),
      },
      instruments: {
        total: instrumentItems.length,
        sample: instrumentItems
          .map(
            (instrument): DashboardInstrumentDto => ({
              symbol: instrument.symbol,
              name: instrument.name,
              marketCode: instrument.marketCode,
              sector: instrument.sector,
            }),
          )
          .slice(0, this.maxDashboardItems),
      },
      quotes: {
        trackedCount: quoteItems.length,
        latest: latestQuotes.slice(0, this.maxDashboardItems),
        topGainers: topGainers.slice(0, this.maxDashboardItems),
        topLosers: topLosers.slice(0, this.maxDashboardItems),
      },
      platform: {
        service: 'market-service',
        status: 'OPERATIONAL',
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private async resolveQuoteItems(
    instruments: Array<{
      symbol: string;
      name: string;
    }>,
  ): Promise<DashboardQuoteDto[]> {
    const quoteItems = await Promise.all(
      instruments.map(
        async (instrument): Promise<QuoteDashboardItem | null> => {
          const latestQuote = await this.quotesRepository.findLatestBySymbol(
            instrument.symbol,
          );

          if (!latestQuote) {
            return null;
          }

          const latestSnapshot = latestQuote.toSnapshot();
          const history = await this.quotesRepository.findHistoryBySymbol(
            instrument.symbol,
          );
          const previousSnapshot = history
            .findLast(
              (quote) =>
                quote.toSnapshot().asOf.getTime() <
                latestSnapshot.asOf.getTime(),
            )
            ?.toSnapshot();

          return {
            symbol: latestSnapshot.symbol,
            name: instrument.name,
            price: latestSnapshot.price,
            changePercent: previousSnapshot
              ? this.calculateChangePercent(
                  previousSnapshot.price,
                  latestSnapshot.price,
                )
              : 0,
            currency: latestSnapshot.currency,
            provider: latestSnapshot.provider,
            asOf: latestSnapshot.asOf.toISOString(),
          };
        },
      ),
    );

    return quoteItems.filter(
      (item): item is QuoteDashboardItem => item !== null,
    );
  }

  private calculateChangePercent(
    previousPrice: number,
    latestPrice: number,
  ): number {
    return Number(
      (((latestPrice - previousPrice) / previousPrice) * 100).toFixed(2),
    );
  }
}
