import { API_PATHS, marketApiUrl } from "../config/api";

export type DashboardMarket = {
  code: string;
  name: string;
  country: string;
  currency: string;
  timezone: string;
  status: "ACTIVE" | "INACTIVE";
};

export type DashboardInstrument = {
  symbol: string;
  name: string;
  marketCode: string;
  sector?: string;
};

export type DashboardQuote = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  currency: string;
  provider: string;
  asOf: string;
};

export type MarketDashboardResponse = {
  markets: {
    total: number;
    active: number;
    items: DashboardMarket[];
  };
  instruments: {
    total: number;
    sample: DashboardInstrument[];
  };
  quotes: {
    trackedCount: number;
    latest: DashboardQuote[];
    topGainers: DashboardQuote[];
    topLosers: DashboardQuote[];
  };
  platform: {
    service: string;
    status: string;
    generatedAt: string;
  };
};

async function readJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function getMarketDashboard(): Promise<MarketDashboardResponse> {
  const response = await fetch(marketApiUrl(API_PATHS.marketDashboard), {
    headers: {
      Accept: "application/json",
    },
  });
  const body = await readJsonSafe(response);

  if (!response.ok) {
    throw new Error("Unable to load the market dashboard.");
  }

  return body as MarketDashboardResponse;
}
