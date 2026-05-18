import { Injectable } from '@nestjs/common';

interface InstrumentDetailResponse {
  sector?: string;
}

@Injectable()
export class MarketInstrumentsClient {
  private readonly baseUrl =
    process.env.MARKET_SERVICE_BASE_URL ?? 'http://localhost:8884';

  async getSector(symbol: string): Promise<string | null> {
    const normalizedSymbol = symbol.trim().toUpperCase();

    if (!normalizedSymbol) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/instruments/${encodeURIComponent(normalizedSymbol)}`,
      );

      if (!response.ok) {
        return null;
      }

      const instrument = (await response.json()) as InstrumentDetailResponse;

      return instrument.sector?.trim() || null;
    } catch {
      return null;
    }
  }
}
