import { API_PATHS, tradingApiUrl } from "../config/api";

export type ValidateBuyFundsRequest = {
  traderId: string;
  grossAmount: number;
};

export type FundsValidationResponse = {
  approved: boolean;
  traderId: string;
  availableAmount: number;
  requiredAmount: number;
  reservedAmount: number;
  reason?: string;
};

export type ValidateMarketStatusRequest = {
  exchangeId: string;
  evaluatedAt?: string;
};

export type MarketValidationResponse = {
  canOperate: boolean;
  exchangeId: string;
  marketStatus: "OPEN" | "CLOSED" | "RESTRICTED";
  evaluatedAt: string;
  timezone?: string;
  openTime?: string;
  closeTime?: string;
  reason?: string;
};

export type CreateMarketBuyOrderRequest = {
  traderId: string;
  symbol: string;
  exchangeId: string;
  quantity: number;
  estimatedUnitPrice: number;
  currency?: string;
};

export type TradingOrderResponse = {
  id: string;
  orderReference: string;
  traderId: string;
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT" | "STOP_LOSS" | "TAKE_PROFIT";
  status:
    | "CREATED"
    | "PENDING_EXECUTION"
    | "REJECTED"
    | "CANCELLED"
    | "EXECUTED"
    | "FAILED";
  symbol: string;
  exchangeId: string;
  quantity: number;
  estimatedUnitPrice: number;
  grossAmount: number;
  reservedAmount: number;
  currency: string;
  createdAt: string;
  rejectionReason?: string;
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

export async function validateBuyFunds(
  request: ValidateBuyFundsRequest,
): Promise<FundsValidationResponse> {
  const response = await fetch(
    tradingApiUrl(API_PATHS.tradingValidateBuyFunds),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(request),
    },
  );

  const body = await readJsonSafe(response);

  if (!response.ok) {
    throw new Error("Unable to validate operation funds.");
  }

  return body as FundsValidationResponse;
}

export async function validateMarketStatus(
  request: ValidateMarketStatusRequest,
): Promise<MarketValidationResponse> {
  const response = await fetch(
    tradingApiUrl(API_PATHS.tradingValidateMarketStatus),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(request),
    },
  );

  const body = await readJsonSafe(response);

  if (!response.ok) {
    throw new Error("Unable to validate market status.");
  }

  return body as MarketValidationResponse;
}

export async function createMarketBuyOrder(
  request: CreateMarketBuyOrderRequest,
): Promise<TradingOrderResponse> {
  const response = await fetch(
    tradingApiUrl(API_PATHS.tradingCreateMarketBuyOrder),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(request),
    },
  );

  const body = await readJsonSafe(response);

  if (!response.ok) {
    const maybeMessage =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message)
        : "Unable to create market buy order.";
    throw new Error(maybeMessage);
  }

  return body as TradingOrderResponse;
}
