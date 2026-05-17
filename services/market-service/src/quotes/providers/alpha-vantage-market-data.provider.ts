import { Injectable } from '@nestjs/common';
import type { ProviderQuoteSnapshot } from '../entities/market-quote.entity';
import type { MarketDataProvider } from './market-data-provider';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const GLOBAL_QUOTE_KEY = 'Global Quote';
const SYMBOL_KEY = '01. symbol';
const PRICE_KEY = '05. price';
const ERROR_MESSAGE_KEY = 'Error Message';
const NOTE_KEY = 'Note';
const INFORMATION_KEY = 'Information';
const SYNTHETIC_HALF_SPREAD = 0.05;
const DEFAULT_TIMEOUT_MS = 5000;

type AlphaVantagePayload = Record<string, unknown>;
type AlphaVantageQuote = Record<string, unknown>;

@Injectable()
export class AlphaVantageMarketDataProvider implements MarketDataProvider {
  readonly name = 'alpha-vantage';

  async fetchQuote(symbol: string): Promise<ProviderQuoteSnapshot> {
    const normalizedSymbol = symbol.trim().toUpperCase();

    if (!normalizedSymbol) {
      throw new TypeError('Symbol is required to synchronize market data');
    }

    const apiKey = this.resolveApiKey();
    const url = this.buildQuoteUrl(normalizedSymbol, apiKey);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(this.resolveTimeoutMs()),
    });

    if (!response.ok) {
      throw new TypeError(
        `Alpha Vantage request failed with status ${response.status}`,
      );
    }

    const payload = this.toPayload(await response.json());
    const providerMessage = this.resolveProviderMessage(payload);

    if (providerMessage) {
      throw new TypeError(providerMessage);
    }

    const quote = this.toQuote(payload[GLOBAL_QUOTE_KEY]);
    const price = this.parsePositiveNumber(quote[PRICE_KEY], 'price');
    const bid = Number((price - SYNTHETIC_HALF_SPREAD).toFixed(2));
    const ask = Number((price + SYNTHETIC_HALF_SPREAD).toFixed(2));

    return {
      symbol: this.parseSymbol(quote[SYMBOL_KEY], normalizedSymbol),
      price,
      bid,
      ask,
      currency: 'USD',
      provider: this.name,
      asOf: new Date(),
    };
  }

  private resolveApiKey(): string {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY?.trim();

    if (!apiKey) {
      throw new TypeError('Alpha Vantage API key is required');
    }

    return apiKey;
  }

  private buildQuoteUrl(symbol: string, apiKey: string): URL {
    const baseUrl =
      process.env.ALPHA_VANTAGE_BASE_URL?.trim() ?? ALPHA_VANTAGE_BASE_URL;
    const url = new URL(baseUrl);

    url.searchParams.set('function', 'GLOBAL_QUOTE');
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('apikey', apiKey);

    return url;
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
      throw new TypeError('Alpha Vantage response must be an object');
    }

    return value;
  }

  private toQuote(value: unknown): AlphaVantageQuote {
    if (!this.isObject(value)) {
      throw new TypeError('Alpha Vantage quote payload is missing');
    }

    return value;
  }

  private resolveProviderMessage(payload: AlphaVantagePayload): string | null {
    const providerMessage =
      this.parseOptionalString(payload[ERROR_MESSAGE_KEY]) ??
      this.parseOptionalString(payload[NOTE_KEY]) ??
      this.parseOptionalString(payload[INFORMATION_KEY]);

    return providerMessage;
  }

  private parseSymbol(value: unknown, fallback: string): string {
    return this.parseOptionalString(value)?.trim().toUpperCase() ?? fallback;
  }

  private parsePositiveNumber(value: unknown, fieldName: string): number {
    const parsedValue =
      typeof value === 'string' || typeof value === 'number'
        ? Number(value)
        : Number.NaN;

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      throw new RangeError(`Alpha Vantage ${fieldName} must be positive`);
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
