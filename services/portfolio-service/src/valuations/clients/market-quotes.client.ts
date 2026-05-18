import { Injectable } from '@nestjs/common';

interface MarketQuoteResponse {
  price?: number;
}

@Injectable()
export class MarketQuotesClient {
  private readonly baseUrl =
    process.env.MARKET_SERVICE_BASE_URL ?? 'http://localhost:8884';

  async getLatestPrice(symbol: string): Promise<number | null> {
    const normalizedSymbol = symbol.trim().toUpperCase();

    if (!normalizedSymbol) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/quotes/${encodeURIComponent(normalizedSymbol)}`,
      );

      if (!response.ok) {
        return null;
      }

      const quote = (await response.json()) as MarketQuoteResponse;

      return typeof quote.price === 'number' ? quote.price : null;
    } catch {
      return null;
    }
  }
}
