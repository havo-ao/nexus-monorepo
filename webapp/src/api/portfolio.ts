import { API_PATHS, portfolioApiUrl } from "../config/api";
import { getAccessToken } from "../auth/storage";

export type PortfolioPosition = {
  positionId: string;
  stockId: string;
  symbol: string | null;
  quantity: number;
  averageBuyPrice: number;
  totalInvested: number;
  currentPrice: number | null;
  currentValue: number | null;
  profitLoss: number | null;
  returnPercentage: number | null;
  lastUpdated: string;
};

export type PortfolioSummary = {
  traderId: string;
  positions: PortfolioPosition[];
  totalInvested: number;
  currentValue: number | null;
  profitLoss: number | null;
  returnPercentage: number | null;
};

export type WalletBalance = {
  traderId: string;
  availableBalance: number;
  reservedBalance: number;
  totalBalance: number;
  currency: string;
};

export type WalletMovement = {
  movementId: string;
  traderId: string;
  movementType: string;
  amount: number;
  currency: string;
  sourceTransactionId?: string;
  sourceOrderId?: string;
  createdAt: string;
};

export type WalletHistory = {
  traderId: string;
  movements: WalletMovement[];
};

export type PortfolioSectorDistributionItem = {
  sector: string;
  value: number;
  percentage: number;
  positions: number;
};

export type PortfolioSectorDistribution = {
  traderId: string;
  totalValue: number;
  sectors: PortfolioSectorDistributionItem[];
};

export type WalletFundsRequest = {
  amount: number;
  currency?: string;
  sourceTransactionId?: string;
};

export type WalletFundsResponse = WalletBalance & {
  movementId: string;
  amount: number;
  movementType: "DEPOSIT" | "WITHDRAWAL";
  sourceTransactionId?: string;
  createdAt: string;
};

export type RecordExecutedSellRequest = {
  traderId: string;
  stockId: string;
  quantity: number;
  executionPrice: number;
  sourceOrderId?: string;
  sourceTransactionId?: string;
  executedAt?: string;
};

async function readJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function buildHeaders(includeJson = false): HeadersInit {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function parsePortfolioError(fallback: string, body: unknown): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message: unknown }).message;

    if (Array.isArray(message)) {
      return message.join(" ");
    }

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (typeof body === "string" && body.trim()) {
    return body;
  }

  return fallback;
}

function buildTraderPath(traderId: string | number, suffix = ""): string {
  return `${API_PATHS.portfolioBase}/${encodeURIComponent(String(traderId))}${suffix}`;
}

async function getJson<T>(path: string, errorMessage: string): Promise<T> {
  const response = await fetch(portfolioApiUrl(path), {
    headers: buildHeaders(),
  });
  const body = await readJsonSafe(response);

  if (!response.ok) {
    throw new Error(parsePortfolioError(errorMessage, body));
  }

  return body as T;
}

async function postJson<T>(
  path: string,
  request: unknown,
  errorMessage: string,
): Promise<T> {
  const response = await fetch(portfolioApiUrl(path), {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify(request),
  });
  const body = await readJsonSafe(response);

  if (!response.ok) {
    throw new Error(parsePortfolioError(errorMessage, body));
  }

  return body as T;
}

export function getPortfolioSummary(
  traderId: string | number,
): Promise<PortfolioSummary> {
  return getJson<PortfolioSummary>(
    buildTraderPath(traderId),
    "Unable to load your portfolio summary.",
  );
}

export function getWalletBalance(
  traderId: string | number,
): Promise<WalletBalance> {
  return getJson<WalletBalance>(
    buildTraderPath(traderId, "/balance"),
    "Unable to load your wallet balance.",
  );
}

export function getWalletHistory(
  traderId: string | number,
): Promise<WalletHistory> {
  return getJson<WalletHistory>(
    buildTraderPath(traderId, "/history"),
    "Unable to load your financial history.",
  );
}

export function getSectorDistribution(
  traderId: string | number,
): Promise<PortfolioSectorDistribution> {
  return getJson<PortfolioSectorDistribution>(
    buildTraderPath(traderId, "/distribution/sectors"),
    "Unable to load your sector distribution.",
  );
}

export function getPortfolioPosition(
  traderId: string | number,
  positionId: string | number,
): Promise<PortfolioPosition> {
  return getJson<PortfolioPosition>(
    buildTraderPath(
      traderId,
      `/positions/${encodeURIComponent(String(positionId))}`,
    ),
    "Unable to load this position detail.",
  );
}

export function recordDeposit(
  traderId: string | number,
  request: WalletFundsRequest,
): Promise<WalletFundsResponse> {
  return postJson<WalletFundsResponse>(
    buildTraderPath(traderId, "/deposits"),
    request,
    "Unable to record the deposit.",
  );
}

export function recordWithdrawal(
  traderId: string | number,
  request: WalletFundsRequest,
): Promise<WalletFundsResponse> {
  return postJson<WalletFundsResponse>(
    buildTraderPath(traderId, "/withdrawals"),
    request,
    "Unable to record the withdrawal.",
  );
}

export function recordExecutedSell(
  request: RecordExecutedSellRequest,
): Promise<PortfolioPosition> {
  return postJson<PortfolioPosition>(
    `${API_PATHS.portfolioBase}/positions/sales`,
    request,
    "Unable to record the sale.",
  );
}
