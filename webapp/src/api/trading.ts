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

export type ValidateSellHoldingsRequest = {
  traderId: string;
  stockId: string;
  symbol?: string;
  quantity: number;
};

export type HoldingsValidationResponse = {
  approved: boolean;
  traderId: string;
  stockId: string;
  symbol?: string;
  requestedQuantity: number;
  availableQuantity: number;
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

export type CreateLimitBuyOrderRequest = {
  traderId: string;
  symbol: string;
  exchangeId: string;
  quantity: number;
  limitPrice: number;
  currency?: string;
};

export type CreateMarketSellOrderRequest = {
  traderId: string;
  stockId: string;
  symbol: string;
  exchangeId: string;
  quantity: number;
  estimatedUnitPrice: number;
  currency?: string;
};

export type CreateLimitSellOrderRequest = {
  traderId: string;
  stockId: string;
  symbol: string;
  exchangeId: string;
  quantity: number;
  limitPrice: number;
  currency?: string;
};

export type CreateStopLossOrderRequest = {
  traderId: string;
  stockId: string;
  symbol: string;
  exchangeId: string;
  quantity: number;
  stopPrice: number;
  currency?: string;
};

export type CreateTakeProfitOrderRequest = {
  traderId: string;
  stockId: string;
  symbol: string;
  exchangeId: string;
  quantity: number;
  targetPrice: number;
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
    | "PENDING_CONDITION"
    | "REJECTED"
    | "CANCELLED"
    | "EXECUTED"
    | "FAILED";
  symbol: string;
  exchangeId: string;
  stockId?: string;
  quantity: number;
  estimatedUnitPrice: number;
  limitPrice?: number;
  grossAmount: number;
  reservedAmount: number;
  currency: string;
  createdAt: string;
  rejectionReason?: string;
};

export type OrderStatusResponse = {
  orderId: string;
  orderReference: string;
  traderId: string;
  side: "BUY" | "SELL";
  orderType: TradingOrderResponse["orderType"];
  status: TradingOrderResponse["status"];
  symbol: string;
  exchangeId: string;
  stockId?: string;
  quantity: number;
  estimatedUnitPrice: number;
  limitPrice?: number;
  grossAmount: number;
  reservedAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
};

export type OrderStatusHistoryEntryResponse = {
  id: string;
  orderId: string;
  orderReference: string;
  fromStatus?: TradingOrderResponse["status"];
  toStatus: TradingOrderResponse["status"];
  actorType: "TRADER" | "SYSTEM" | "BROKER";
  actorId: string;
  reason: string;
  createdAt: string;
};

export type CalculateCommissionRequest = {
  traderId: string;
  side: "BUY" | "SELL";
  orderType: TradingOrderResponse["orderType"];
  grossAmount: number;
  currency?: string;
  orderReference?: string;
};

export type CommissionCalculationResponse = {
  traderId: string;
  side: "BUY" | "SELL";
  orderType: TradingOrderResponse["orderType"];
  grossAmount: number;
  rateBps: number;
  commissionAmount: number;
  netAmount: number;
  currency: string;
  calculatedAt: string;
  orderReference?: string;
};

export type DistributeCommissionRequest = {
  traderId: string;
  brokerId: string;
  commissionAmount: number;
  currency?: string;
  orderReference?: string;
};

export type CommissionDistributionResponse = {
  traderId: string;
  brokerId: string;
  commissionAmount: number;
  platformAmount: number;
  brokerAmount: number;
  platformShareBps: number;
  brokerShareBps: number;
  currency: string;
  distributedAt: string;
  orderReference?: string;
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

export async function validateSellHoldings(
  request: ValidateSellHoldingsRequest,
): Promise<HoldingsValidationResponse> {
  const response = await fetch(
    tradingApiUrl(API_PATHS.tradingValidateSellHoldings),
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
    throw new Error("Unable to validate available holdings.");
  }

  return body as HoldingsValidationResponse;
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

export async function createLimitBuyOrder(
  request: CreateLimitBuyOrderRequest,
): Promise<TradingOrderResponse> {
  const response = await fetch(
    tradingApiUrl(API_PATHS.tradingCreateLimitBuyOrder),
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
        : "Unable to create limit buy order.";
    throw new Error(maybeMessage);
  }

  return body as TradingOrderResponse;
}

export async function createMarketSellOrder(
  request: CreateMarketSellOrderRequest,
): Promise<TradingOrderResponse> {
  const response = await fetch(
    tradingApiUrl(API_PATHS.tradingCreateMarketSellOrder),
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
        : "Unable to create market sell order.";
    throw new Error(maybeMessage);
  }

  return body as TradingOrderResponse;
}

export async function createLimitSellOrder(
  request: CreateLimitSellOrderRequest,
): Promise<TradingOrderResponse> {
  const response = await fetch(
    tradingApiUrl(API_PATHS.tradingCreateLimitSellOrder),
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
        : "Unable to create limit sell order.";
    throw new Error(maybeMessage);
  }

  return body as TradingOrderResponse;
}

export async function createStopLossOrder(
  request: CreateStopLossOrderRequest,
): Promise<TradingOrderResponse> {
  const response = await fetch(
    tradingApiUrl(API_PATHS.tradingCreateStopLossOrder),
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
        : "Unable to create stop loss order.";
    throw new Error(maybeMessage);
  }

  return body as TradingOrderResponse;
}

export async function createTakeProfitOrder(
  request: CreateTakeProfitOrderRequest,
): Promise<TradingOrderResponse> {
  const response = await fetch(
    tradingApiUrl(API_PATHS.tradingCreateTakeProfitOrder),
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
        : "Unable to create take profit order.";
    throw new Error(maybeMessage);
  }

  return body as TradingOrderResponse;
}

export async function getOrderStatus(
  orderReference: string,
): Promise<OrderStatusResponse> {
  const response = await fetch(
    tradingApiUrl(
      `${API_PATHS.tradingOrderStatus}/${encodeURIComponent(orderReference)}/status`,
    ),
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  const body = await readJsonSafe(response);

  if (!response.ok) {
    const maybeMessage =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message)
        : "Unable to load order status.";
    throw new Error(maybeMessage);
  }

  return body as OrderStatusResponse;
}

export async function getOrderStatusHistory(
  orderReference: string,
): Promise<OrderStatusHistoryEntryResponse[]> {
  const response = await fetch(
    tradingApiUrl(
      `${API_PATHS.tradingOrderStatus}/${encodeURIComponent(orderReference)}/status-history`,
    ),
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  const body = await readJsonSafe(response);

  if (!response.ok) {
    const maybeMessage =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message)
        : "Unable to load order status history.";
    throw new Error(maybeMessage);
  }

  return body as OrderStatusHistoryEntryResponse[];
}

export async function calculateCommission(
  request: CalculateCommissionRequest,
): Promise<CommissionCalculationResponse> {
  const response = await fetch(
    tradingApiUrl(API_PATHS.tradingCalculateCommission),
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
        : "Unable to calculate operation commission.";
    throw new Error(maybeMessage);
  }

  return body as CommissionCalculationResponse;
}

export async function distributeCommission(
  request: DistributeCommissionRequest,
): Promise<CommissionDistributionResponse> {
  const response = await fetch(
    tradingApiUrl(API_PATHS.tradingDistributeCommission),
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
        : "Unable to distribute operation commission.";
    throw new Error(maybeMessage);
  }

  return body as CommissionDistributionResponse;
}
