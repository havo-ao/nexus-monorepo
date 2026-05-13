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
    throw new Error("No fue posible validar los fondos de la operación.");
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
    throw new Error("No fue posible validar el estado del mercado.");
  }

  return body as MarketValidationResponse;
}
