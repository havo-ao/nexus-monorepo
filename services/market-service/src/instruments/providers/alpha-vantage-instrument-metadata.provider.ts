import { Injectable } from '@nestjs/common';
import type { InstrumentSnapshot } from '../entities/instrument.entity';
import type { InstrumentMetadataProvider } from './instrument-metadata.provider';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const DEFAULT_TIMEOUT_MS = 5000;

interface CompanyOverviewResponse {
  Symbol?: string;
  Name?: string;
  Description?: string;
  AssetType?: string;
  Exchange?: string;
  Currency?: string;
  Country?: string;
  Sector?: string;
  Industry?: string;
  Note?: string;
  Information?: string;
  Error?: string;
}

@Injectable()
export class AlphaVantageInstrumentMetadataProvider implements InstrumentMetadataProvider {
  readonly name = 'alpha-vantage-overview';

  async fetchMetadata(symbol: string): Promise<Partial<InstrumentSnapshot>> {
    const response = await fetch(this.buildOverviewUrl(symbol), {
      signal: AbortSignal.timeout(this.resolveTimeoutMs()),
    });

    if (!response.ok) {
      throw new TypeError(
        `Alpha Vantage overview request failed with status ${response.status}`,
      );
    }

    const overview = (await response.json()) as CompanyOverviewResponse;

    this.assertValidOverview(overview);

    return {
      symbol: overview.Symbol,
      name: overview.Name,
      currency: overview.Currency,
      sector: overview.Sector,
      assetType: overview.AssetType,
      industry: overview.Industry,
      country: overview.Country,
      description: overview.Description,
      metadataProvider: this.name,
      metadataUpdatedAt: new Date(),
    };
  }

  private buildOverviewUrl(symbol: string): URL {
    const baseUrl =
      process.env.ALPHA_VANTAGE_BASE_URL?.trim() ?? ALPHA_VANTAGE_BASE_URL;
    const url = new URL(baseUrl);

    url.searchParams.set('function', 'OVERVIEW');
    url.searchParams.set('symbol', symbol.trim().toUpperCase());
    url.searchParams.set('apikey', this.resolveApiKey());

    return url;
  }

  private assertValidOverview(overview: CompanyOverviewResponse): void {
    const providerMessage =
      overview.Note ?? overview.Information ?? overview.Error;

    if (providerMessage) {
      throw new TypeError(providerMessage);
    }

    if (!overview.Symbol?.trim() || !overview.Name?.trim()) {
      throw new TypeError('Alpha Vantage overview response is incomplete');
    }
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
}
