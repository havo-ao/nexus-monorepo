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

export type Market = DashboardMarket & {
  representativeSymbols: string[];
};

export type Instrument = {
  symbol: string;
  name: string;
  marketCode: string;
  currency: string;
  sector: string;
  status: "ACTIVE" | "INACTIVE";
};

export type Quote = {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  spread: number;
  currency: string;
  provider: string;
  asOf: string;
};

export type InstrumentDetail = Instrument & {
  assetType?: string | null;
  industry?: string | null;
  country?: string | null;
  description?: string | null;
  metadataProvider?: string | null;
  metadataUpdatedAt?: string | null;
  quote?: Quote | null;
};

export type MarketStatus = {
  marketCode: string;
  status: "OPEN" | "CLOSED" | "RESTRICTED";
  canProcessOrder: boolean;
  evaluatedAt: string;
  timezone: string;
  reason: string;
};

export type TimeOfDay = {
  hour: number;
  minute: number;
};

export type MarketRestriction = {
  date: string;
  status: "CLOSED" | "RESTRICTED";
  reason: string;
};

export type MarketDaySchedule = {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: TimeOfDay;
  closeTime: TimeOfDay;
};

export type MarketHoursConfiguration = {
  marketCode: string;
  timezone: string;
  openTime: TimeOfDay;
  closeTime: TimeOfDay;
  operatingDays: number[];
  weeklySchedule: MarketDaySchedule[];
  restrictions: MarketRestriction[];
  currentStatus: MarketStatus;
};

export type ConfigureMarketHoursPayload = {
  timezone: string;
  openTime: TimeOfDay;
  closeTime: TimeOfDay;
  operatingDays: number[];
  weeklySchedule?: MarketDaySchedule[];
  actor: string;
};

export type ConfigureMarketRestrictionPayload = MarketRestriction & {
  actor: string;
};

export type QuoteHistoryResponse = {
  symbol: string;
  prices: Quote[];
};

export type SyncInstrumentDetailResponse = {
  status: "SUCCESS" | "PARTIAL_FAILURE" | "FAILED";
  symbol: string;
  metadata: {
    status: "SUCCESS" | "PARTIAL_FAILURE" | "FAILED";
    provider: string;
    updatedCount?: number;
    message: string;
  };
  quote: {
    status: "SUCCESS" | "PARTIAL_FAILURE" | "FAILED";
    provider: string;
    updatedCount?: number;
    message: string;
  };
  history: {
    status: "SUCCESS" | "PARTIAL_FAILURE" | "FAILED";
    provider: string;
    updatedCount?: number;
    message: string;
  };
  message: string;
  instrument: InstrumentDetail;
};

export type WatchlistResponse = {
  traderId: string;
  items: Array<{
    symbol: string;
    addedAt: string;
    quote?: Quote;
  }>;
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

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (
    value &&
    typeof value === "object" &&
    "value" in value &&
    Array.isArray((value as { value: unknown }).value)
  ) {
    return (value as { value: T[] }).value;
  }

  return [];
}

async function getJson<T>(path: string, errorMessage: string): Promise<T> {
  const response = await fetch(marketApiUrl(path), {
    headers: {
      Accept: "application/json",
    },
  });
  const body = await readJsonSafe(response);

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return body as T;
}

async function sendJson<T>(
  path: string,
  method: "POST" | "PUT" | "DELETE",
  errorMessage: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(marketApiUrl(path), {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const responseBody = await readJsonSafe(response);

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return responseBody as T;
}

export async function getMarkets(): Promise<Market[]> {
  const result = await getJson<unknown>(
    API_PATHS.marketMarkets,
    "Unable to load available markets.",
  );

  return asArray<Market>(result);
}

export async function getInstruments(): Promise<Instrument[]> {
  const result = await getJson<unknown>(
    API_PATHS.marketInstruments,
    "Unable to load available instruments.",
  );

  return asArray<Instrument>(result);
}

export async function getMarketStatus(
  marketCode: string,
): Promise<MarketStatus> {
  return getJson<MarketStatus>(
    `${API_PATHS.marketHours}/${encodeURIComponent(marketCode)}/status`,
    "Unable to load market operating status.",
  );
}

export async function getMarketHoursConfiguration(
  marketCode: string,
): Promise<MarketHoursConfiguration> {
  return getJson<MarketHoursConfiguration>(
    `${API_PATHS.marketAdminHours}/${encodeURIComponent(marketCode)}`,
    "Unable to load market hours configuration.",
  );
}

export async function configureMarketHours(
  marketCode: string,
  payload: ConfigureMarketHoursPayload,
): Promise<MarketHoursConfiguration> {
  return sendJson<MarketHoursConfiguration>(
    `${API_PATHS.marketAdminHours}/${encodeURIComponent(marketCode)}`,
    "PUT",
    "Unable to save market hours configuration.",
    payload,
  );
}

export async function configureMarketRestriction(
  marketCode: string,
  payload: ConfigureMarketRestrictionPayload,
): Promise<MarketHoursConfiguration> {
  return sendJson<MarketHoursConfiguration>(
    `${API_PATHS.marketAdminHours}/${encodeURIComponent(marketCode)}/restrictions`,
    "POST",
    "Unable to save market restriction.",
    payload,
  );
}

export async function getInstrumentDetail(
  symbol: string,
): Promise<InstrumentDetail> {
  return getJson<InstrumentDetail>(
    `${API_PATHS.marketInstruments}/${encodeURIComponent(symbol)}`,
    "Unable to load instrument detail.",
  );
}

export async function getQuote(symbol: string): Promise<Quote> {
  return getJson<Quote>(
    `${API_PATHS.marketQuotes}/${encodeURIComponent(symbol)}`,
    "Unable to load current quote.",
  );
}

export async function getQuoteHistory(
  symbol: string,
): Promise<QuoteHistoryResponse> {
  return getJson<QuoteHistoryResponse>(
    `${API_PATHS.marketQuotes}/${encodeURIComponent(symbol)}/history`,
    "Unable to load quote history.",
  );
}

export async function syncInstrumentDetail(
  symbol: string,
): Promise<SyncInstrumentDetailResponse> {
  return sendJson<SyncInstrumentDetailResponse>(
    `${API_PATHS.marketInstruments}/${encodeURIComponent(symbol)}/detail/sync`,
    "POST",
    "Unable to synchronize instrument detail.",
  );
}

export async function addWatchlistItem(
  traderId: string,
  symbol: string,
): Promise<WatchlistResponse> {
  return sendJson<WatchlistResponse>(
    `${API_PATHS.marketWatchlists}/${encodeURIComponent(traderId)}/items`,
    "POST",
    "Unable to add this instrument to the watchlist.",
    { symbol },
  );
}

export async function getWatchlist(
  traderId: string,
): Promise<WatchlistResponse> {
  return getJson<WatchlistResponse>(
    `${API_PATHS.marketWatchlists}/${encodeURIComponent(traderId)}`,
    "Unable to load your watchlist.",
  );
}

export async function removeWatchlistItem(
  traderId: string,
  symbol: string,
): Promise<WatchlistResponse | null> {
  return sendJson<WatchlistResponse | null>(
    `${API_PATHS.marketWatchlists}/${encodeURIComponent(traderId)}/items/${encodeURIComponent(symbol)}`,
    "DELETE",
    "Unable to remove this instrument from the watchlist.",
  );
}
