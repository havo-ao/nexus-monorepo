import { Injectable } from '@nestjs/common';
import type { ProviderQuoteSnapshot } from '../entities/market-quote.entity';
import type { MarketHistoryProvider } from './market-history-provider';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const TIME_SERIES_DAILY_KEY = 'Time Series (Daily)';
const CLOSE_PRICE_KEY = '4. close';
const ERROR_MESSAGE_KEY = 'Error Message';
const NOTE_KEY = 'Note';
const INFORMATION_KEY = 'Information';
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_OUTPUT_SIZE = 'compact';
const SYNTHETIC_HALF_SPREAD = 0.05;

type AlphaVantagePayload = Record<string, unknown>;
type AlphaVantageDailySeries = Record<string, unknown>;
type AlphaVantageDailyBar = Record<string, unknown>;

@Injectable()
export class AlphaVantageMarketHistoryProvider implements MarketHistoryProvider {
  readonly name = 'alpha-vantage';

  async fetchDailyHistory(symbol: string): Promise<ProviderQuoteSnapshot[]> {
    const normalizedSymbol = symbol.trim().toUpperCase();

    if (!normalizedSymbol) {
      throw new TypeError('Symbol is required to synchronize quote history');
    }

    const response = await fetch(
      this.buildHistoryUrl(normalizedSymbol, this.resolveApiKey()),
      {
        signal: AbortSignal.timeout(this.resolveTimeoutMs()),
      },
    );

    if (!response.ok) {
      throw new TypeError(
        `Alpha Vantage history request failed with status ${response.status}`,
      );
    }

    const payload = this.toPayload(await response.json());
    const providerMessage = this.resolveProviderMessage(payload);

    if (providerMessage) {
      throw new TypeError(providerMessage);
    }

    const series = this.toSeries(payload[TIME_SERIES_DAILY_KEY]);

    return Object.entries(series)
      .map(([dateText, value]) =>
        this.toQuoteSnapshot(normalizedSymbol, dateText, this.toBar(value)),
      )
      .sort(
        (leftQuote, rightQuote) =>
          leftQuote.asOf.getTime() - rightQuote.asOf.getTime(),
      );
  }

  private buildHistoryUrl(symbol: string, apiKey: string): URL {
    const baseUrl =
      process.env.ALPHA_VANTAGE_BASE_URL?.trim() ?? ALPHA_VANTAGE_BASE_URL;
    const outputSize =
      process.env.ALPHA_VANTAGE_HISTORY_OUTPUT_SIZE?.trim() ??
      DEFAULT_OUTPUT_SIZE;
    const url = new URL(baseUrl);

    url.searchParams.set('function', 'TIME_SERIES_DAILY');
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('outputsize', outputSize);
    url.searchParams.set('apikey', apiKey);

    return url;
  }

  private toQuoteSnapshot(
    symbol: string,
    dateText: string,
    bar: AlphaVantageDailyBar,
  ): ProviderQuoteSnapshot {
    const price = this.parsePositiveNumber(bar[CLOSE_PRICE_KEY], 'close');
    const asOf = new Date(`${dateText}T00:00:00.000Z`);

    if (Number.isNaN(asOf.getTime())) {
      throw new TypeError('Alpha Vantage history date must be valid');
    }

    return {
      symbol,
      price,
      bid: Number((price - SYNTHETIC_HALF_SPREAD).toFixed(2)),
      ask: Number((price + SYNTHETIC_HALF_SPREAD).toFixed(2)),
      currency: 'USD',
      provider: this.name,
      asOf,
    };
  }

  private resolveApiKey(): string {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY?.trim();

    if (!apiKey) {
      throw new TypeError('Alpha Vantage API key is required');
    }

    return apiKey;
  }

  private resolveTimeoutMs(): number {
    const configuredTimeout = process.env.ALPHA_VANTAGE_TIMEOUT_MS?.trim();
    const timeoutMs = configuredTimeout
      ? Number(configuredTimeout)
      : DEFAULT_TIMEOUT_MS;

    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      return DEFAULT_TIMEOUT_MS;
    }

    return timeoutMs;
  }

  private toPayload(value: unknown): AlphaVantagePayload {
    if (!this.isObject(value)) {
      throw new TypeError('Alpha Vantage history response must be an object');
    }

    return value;
  }

  private toSeries(value: unknown): AlphaVantageDailySeries {
    if (!this.isObject(value)) {
      throw new TypeError('Alpha Vantage daily history payload is missing');
    }

    return value;
  }

  private toBar(value: unknown): AlphaVantageDailyBar {
    if (!this.isObject(value)) {
      throw new TypeError('Alpha Vantage daily history bar is invalid');
    }

    return value;
  }

  private resolveProviderMessage(payload: AlphaVantagePayload): string | null {
    return (
      this.parseOptionalString(payload[ERROR_MESSAGE_KEY]) ??
      this.parseOptionalString(payload[NOTE_KEY]) ??
      this.parseOptionalString(payload[INFORMATION_KEY])
    );
  }

  private parsePositiveNumber(value: unknown, fieldName: string): number {
    const parsedValue =
      typeof value === 'string' || typeof value === 'number'
        ? Number(value)
        : Number.NaN;

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      throw new RangeError(
        `Alpha Vantage history ${fieldName} must be positive`,
      );
    }

    return Number(parsedValue.toFixed(2));
  }

  private parseOptionalString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value : null;
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
