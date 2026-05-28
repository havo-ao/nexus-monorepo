import { Injectable } from '@nestjs/common';
import {
  INSTRUMENT_STATUS,
  type InstrumentSnapshot,
} from '../entities/instrument.entity';
import { isSupportedEquity } from '../utils/supported-equity.util';
import { isSupportedSymbol } from '../utils/supported-symbols.util';
import type { InstrumentCatalogProvider } from './instrument-catalog.provider';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_INSTRUMENT_LIMIT = 500;
const DEFAULT_LISTING_STATE = 'active';
const UNCLASSIFIED_SECTOR = 'Unclassified';

const MARKET_CURRENCY_BY_EXCHANGE = new Map([
  ['NASDAQ', { marketCode: 'NASDAQ', currency: 'USD' }],
  ['NYSE', { marketCode: 'NYSE', currency: 'USD' }],
  ['NYSE ARCA', { marketCode: 'NYSE', currency: 'USD' }],
  ['NYSE AMERICAN', { marketCode: 'NYSE', currency: 'USD' }],
]);

interface ListingStatusRow {
  symbol: string;
  name: string;
  exchange: string;
  assetType: string;
  status: string;
}

@Injectable()
export class AlphaVantageInstrumentCatalogProvider implements InstrumentCatalogProvider {
  readonly name = 'alpha-vantage-listing';

  async fetchInstruments(): Promise<InstrumentSnapshot[]> {
    const response = await fetch(this.buildListingStatusUrl(), {
      signal: AbortSignal.timeout(this.resolveTimeoutMs()),
    });

    if (!response.ok) {
      throw new TypeError(
        `Alpha Vantage listing request failed with status ${response.status}`,
      );
    }

    const responseText = await response.text();

    if (this.isProviderMessage(responseText)) {
      throw new TypeError(responseText.trim());
    }

    const rows = this.parseCsv(responseText);
    const instruments = rows
      .map((row) => this.toListingStatusRow(row))
      .map((row) => this.toInstrumentSnapshot(row))
      .filter((instrument): instrument is InstrumentSnapshot =>
        Boolean(instrument),
      )
      .slice(0, this.resolveInstrumentLimit());

    if (instruments.length === 0) {
      throw new TypeError('Alpha Vantage listing response has no instruments');
    }

    return instruments;
  }

  private buildListingStatusUrl(): URL {
    const baseUrl =
      process.env.ALPHA_VANTAGE_BASE_URL?.trim() ?? ALPHA_VANTAGE_BASE_URL;
    const listingState =
      process.env.ALPHA_VANTAGE_LISTING_STATE?.trim() ?? DEFAULT_LISTING_STATE;
    const url = new URL(baseUrl);

    url.searchParams.set('function', 'LISTING_STATUS');
    url.searchParams.set('state', listingState);
    url.searchParams.set('apikey', this.resolveApiKey());

    return url;
  }

  private toListingStatusRow(row: Record<string, string>): ListingStatusRow {
    return {
      symbol: row.symbol ?? '',
      name: row.name ?? '',
      exchange: row.exchange ?? '',
      assetType: row.assetType ?? '',
      status: row.status ?? '',
    };
  }

  private toInstrumentSnapshot(
    row: ListingStatusRow,
  ): InstrumentSnapshot | null {
    const market = MARKET_CURRENCY_BY_EXCHANGE.get(
      row.exchange.trim().toUpperCase(),
    );

    if (
      !market ||
      !row.symbol.trim() ||
      !row.name.trim() ||
      !isSupportedEquity(row) ||
      !isSupportedSymbol(row.symbol)
    ) {
      return null;
    }

    return {
      symbol: row.symbol,
      name: row.name,
      marketCode: market.marketCode,
      currency: market.currency,
      sector: UNCLASSIFIED_SECTOR,
      status:
        row.status.trim().toLowerCase() === 'delisted'
          ? INSTRUMENT_STATUS.INACTIVE
          : INSTRUMENT_STATUS.ACTIVE,
    };
  }

  private parseCsv(csvText: string): Array<Record<string, string>> {
    const [headerLine, ...lines] = csvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!headerLine) {
      throw new TypeError('Alpha Vantage listing response is empty');
    }

    const headers = this.parseCsvLine(headerLine).map((header) =>
      header.trim(),
    );

    return lines.map((line) => {
      const values = this.parseCsvLine(line);

      return Object.fromEntries(
        headers.map((header, index) => [header, values[index]?.trim() ?? '']),
      );
    });
  }

  private parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (const character of line) {
      if (character === '"') {
        insideQuotes = !insideQuotes;
        continue;
      }

      if (character === ',' && !insideQuotes) {
        values.push(currentValue);
        currentValue = '';
        continue;
      }

      currentValue += character;
    }

    values.push(currentValue);

    return values;
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

  private resolveInstrumentLimit(): number {
    const configuredLimit = process.env.ALPHA_VANTAGE_INSTRUMENT_LIMIT?.trim();
    const instrumentLimit = configuredLimit
      ? Number(configuredLimit)
      : DEFAULT_INSTRUMENT_LIMIT;

    if (!Number.isInteger(instrumentLimit) || instrumentLimit <= 0) {
      return DEFAULT_INSTRUMENT_LIMIT;
    }

    return instrumentLimit;
  }

  private isProviderMessage(responseText: string): boolean {
    const trimmedText = responseText.trim();

    return trimmedText.startsWith('{') || trimmedText.startsWith('[');
  }
}
