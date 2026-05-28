import { BadRequestException, Injectable } from '@nestjs/common';
import { SyncMarketDataResponseDto } from '../../quotes/dto/sync-market-data-response.dto';
import { SyncQuoteHistoryResponseDto } from '../../quotes/dto/sync-quote-history-response.dto';
import { MarketDataSyncService } from '../../quotes/services/market-data-sync.service';
import { QuoteHistoryService } from '../../quotes/services/quote-history.service';
import { QuoteHistorySyncService } from '../../quotes/services/quote-history-sync.service';
import {
  InstrumentDetailSyncStepDto,
  SyncInstrumentDetailResponseDto,
} from '../dto/sync-instrument-detail-response.dto';
import { SyncInstrumentMetadataResponseDto } from '../dto/sync-instrument-metadata-response.dto';
import { InstrumentDetailService } from './instrument-detail.service';
import { InstrumentMetadataSyncService } from './instrument-metadata-sync.service';

type SyncStepStatus = 'SUCCESS' | 'PARTIAL_FAILURE' | 'FAILED';
const DEFAULT_PROVIDER_STEP_DELAY_MS = 2000;
const MIN_USEFUL_HISTORY_POINTS = 10;

interface LocalDetailState {
  hasMetadata: boolean;
  hasQuote: boolean;
  hasUsefulHistory: boolean;
  historyPoints: number;
}

@Injectable()
export class InstrumentDetailSyncService {
  constructor(
    private readonly instrumentDetailService: InstrumentDetailService,
    private readonly instrumentMetadataSyncService: InstrumentMetadataSyncService,
    private readonly marketDataSyncService: MarketDataSyncService,
    private readonly quoteHistoryService: QuoteHistoryService,
    private readonly quoteHistorySyncService: QuoteHistorySyncService,
  ) {}

  async synchronizeInstrumentDetail(
    symbol: string,
  ): Promise<SyncInstrumentDetailResponseDto> {
    const normalizedSymbol = this.normalizeSymbol(symbol);

    const localInstrument =
      await this.instrumentDetailService.getInstrumentDetail(normalizedSymbol);
    const localState = await this.getLocalDetailState(
      normalizedSymbol,
      localInstrument,
    );

    if (this.hasCompleteLocalDetail(localState)) {
      return this.buildCachedResponse(normalizedSymbol, localInstrument);
    }

    const providerStepDelayMs = this.resolveProviderStepDelayMs();
    let metadata = this.cachedStep(
      localInstrument.metadataProvider ?? 'local-cache',
      'Instrument metadata loaded from local cache',
    );

    if (!localState.hasMetadata) {
      const metadataResult = await this.runProviderStep(() =>
        this.instrumentMetadataSyncService.synchronizeMetadata(
          normalizedSymbol,
        ),
      );
      metadata = this.fromMetadataResult(metadataResult);
    }

    if (metadata.status !== 'SUCCESS') {
      return this.buildResponse(
        normalizedSymbol,
        metadata,
        localState.hasQuote
          ? this.cachedStep(
              localInstrument.quote?.provider ?? 'local-cache',
              'Current quote loaded from local cache',
            )
          : this.skippedStep(
              'market-data-provider',
              'Current quote synchronization skipped because metadata synchronization failed',
            ),
        this.skippedStep(
          'market-history-provider',
          'Historical prices synchronization skipped because metadata synchronization failed',
        ),
      );
    }

    if (!localState.hasMetadata) {
      await this.waitForProviderStep(providerStepDelayMs);
    }

    let quote = this.cachedStep(
      localInstrument.quote?.provider ?? 'local-cache',
      'Current quote loaded from local cache',
    );

    if (!localState.hasQuote) {
      const quoteResult = await this.runProviderStep(() =>
        this.marketDataSyncService.synchronizeMarketData({
          symbols: [normalizedSymbol],
          requestedBy: 'instrument-detail-sync@nexus.local',
        }),
      );
      quote = this.fromQuoteResult(quoteResult);
    }

    if (quote.status !== 'SUCCESS') {
      return this.buildResponse(
        normalizedSymbol,
        metadata,
        quote,
        this.skippedStep(
          'market-history-provider',
          'Historical prices synchronization skipped because current quote synchronization failed',
        ),
      );
    }

    if (!localState.hasQuote) {
      await this.waitForProviderStep(providerStepDelayMs);
    }

    let history = this.cachedStep(
      'local-cache',
      `Historical prices loaded from local cache (${localState.historyPoints} points)`,
    );

    if (!localState.hasUsefulHistory) {
      const historyResult = await this.runProviderStep(() =>
        this.quoteHistorySyncService.synchronizePriceHistory(normalizedSymbol),
      );
      history = this.fromHistoryResult(historyResult);
    }

    return this.buildResponse(normalizedSymbol, metadata, quote, history);
  }

  private async buildResponse(
    symbol: string,
    metadata: InstrumentDetailSyncStepDto,
    quote: InstrumentDetailSyncStepDto,
    history: InstrumentDetailSyncStepDto,
  ): Promise<SyncInstrumentDetailResponseDto> {
    const status = this.resolveStatus([metadata, quote, history]);
    const instrument =
      await this.instrumentDetailService.getInstrumentDetail(symbol);

    return {
      status,
      symbol,
      metadata,
      quote,
      history,
      message: this.buildMessage(status, symbol),
      instrument,
    };
  }

  private async getLocalDetailState(
    symbol: string,
    instrument: SyncInstrumentDetailResponseDto['instrument'],
  ): Promise<LocalDetailState> {
    const history = await this.quoteHistoryService.getPriceHistory(symbol);

    return {
      hasMetadata: Boolean(instrument.metadataUpdatedAt),
      hasQuote: Boolean(instrument.quote),
      hasUsefulHistory: history.prices.length >= MIN_USEFUL_HISTORY_POINTS,
      historyPoints: history.prices.length,
    };
  }

  private hasCompleteLocalDetail(localState: LocalDetailState): boolean {
    return (
      localState.hasMetadata &&
      localState.hasQuote &&
      localState.hasUsefulHistory
    );
  }

  private buildCachedResponse(
    symbol: string,
    instrument: SyncInstrumentDetailResponseDto['instrument'],
  ): SyncInstrumentDetailResponseDto {
    const metadata = this.cachedStep(
      instrument.metadataProvider ?? 'local-cache',
      'Instrument metadata loaded from local cache',
    );
    const quote = this.cachedStep(
      instrument.quote?.provider ?? 'local-cache',
      'Current quote loaded from local cache',
    );
    const history = this.cachedStep(
      'local-cache',
      'Historical prices loaded from local cache',
    );

    return {
      status: 'SUCCESS',
      symbol,
      metadata,
      quote,
      history,
      message: `Instrument detail for ${symbol} loaded from local cache; provider synchronization was not required`,
      instrument,
    };
  }

  private normalizeSymbol(symbol: string): string {
    if (typeof symbol !== 'string' || !symbol.trim()) {
      throw new BadRequestException('Symbol must be a non-empty string');
    }

    return symbol.trim().toUpperCase();
  }

  private async runProviderStep<T>(
    action: () => Promise<T>,
  ): Promise<PromiseSettledResult<T>> {
    try {
      return {
        status: 'fulfilled',
        value: await action(),
      };
    } catch (reason: unknown) {
      return {
        status: 'rejected',
        reason,
      };
    }
  }

  private async waitForProviderStep(delayMs: number): Promise<void> {
    if (delayMs <= 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  private resolveProviderStepDelayMs(): number {
    const configuredDelay =
      process.env.ALPHA_VANTAGE_DETAIL_SYNC_DELAY_MS?.trim();
    const delayMs = configuredDelay
      ? Number(configuredDelay)
      : DEFAULT_PROVIDER_STEP_DELAY_MS;

    if (!Number.isFinite(delayMs) || delayMs < 0) {
      return DEFAULT_PROVIDER_STEP_DELAY_MS;
    }

    return delayMs;
  }

  private fromMetadataResult(
    result: PromiseSettledResult<SyncInstrumentMetadataResponseDto>,
  ): InstrumentDetailSyncStepDto {
    if (result.status === 'rejected') {
      return this.failedStep(
        'instrument-metadata-provider',
        'Instrument metadata synchronization failed',
        result.reason,
      );
    }

    return {
      status: result.value.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      provider: result.value.provider,
      message: result.value.message,
    };
  }

  private fromQuoteResult(
    result: PromiseSettledResult<SyncMarketDataResponseDto>,
  ): InstrumentDetailSyncStepDto {
    if (result.status === 'rejected') {
      return this.failedStep(
        'market-data-provider',
        'Current quote synchronization failed',
        result.reason,
      );
    }

    return {
      status: result.value.status,
      provider: result.value.provider,
      updatedCount: result.value.updatedQuotes.length,
      message: result.value.message,
    };
  }

  private fromHistoryResult(
    result: PromiseSettledResult<SyncQuoteHistoryResponseDto>,
  ): InstrumentDetailSyncStepDto {
    if (result.status === 'rejected') {
      return this.failedStep(
        'market-history-provider',
        'Historical prices synchronization failed',
        result.reason,
      );
    }

    return {
      status: result.value.status,
      provider: result.value.provider,
      updatedCount: result.value.updatedCount,
      message: result.value.message,
    };
  }

  private failedStep(
    provider: string,
    message: string,
    reason: unknown,
  ): InstrumentDetailSyncStepDto {
    const reasonMessage = reason instanceof Error ? reason.message : null;

    return {
      status: 'FAILED',
      provider,
      message: reasonMessage ? `${message}: ${reasonMessage}` : message,
    };
  }

  private skippedStep(
    provider: string,
    message: string,
  ): InstrumentDetailSyncStepDto {
    return {
      status: 'FAILED',
      provider,
      message,
    };
  }

  private cachedStep(
    provider: string,
    message: string,
  ): InstrumentDetailSyncStepDto {
    return {
      status: 'SUCCESS',
      provider,
      updatedCount: 0,
      message,
    };
  }

  private resolveStatus(steps: InstrumentDetailSyncStepDto[]): SyncStepStatus {
    const successfulSteps = steps.filter((step) => step.status === 'SUCCESS');

    if (successfulSteps.length === steps.length) {
      return 'SUCCESS';
    }

    return successfulSteps.length > 0 ? 'PARTIAL_FAILURE' : 'FAILED';
  }

  private buildMessage(status: SyncStepStatus, symbol: string): string {
    if (status === 'SUCCESS') {
      return `Instrument detail synchronization completed for ${symbol} with fresh metadata, quote and historical prices`;
    }

    if (status === 'PARTIAL_FAILURE') {
      return `Instrument detail synchronization partially completed for ${symbol}; preserved last known local data where needed`;
    }

    return `Instrument detail synchronization failed for ${symbol}; preserved last known local data when available`;
  }
}
