function cleanBaseUrl(raw: unknown): string {
  if (raw === undefined || raw === "") {
    return "";
  }
  return String(raw).replace(/\/$/, "");
}

/**
 * API base URL for the identity service.
 * Set `VITE_API_BASE_URL` in `.env` / `.env.production` (no trailing slash).
 * Example dev: http://localhost:8881
 */
export function getApiBaseUrl(): string {
  return cleanBaseUrl(import.meta.env.VITE_API_BASE_URL);
}

export function getTradingApiBaseUrl(): string {
  return cleanBaseUrl(
    import.meta.env.VITE_TRADING_API_BASE_URL ?? "http://localhost:8882",
  );
}

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${normalizedPath}` : normalizedPath;
}

export function tradingApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getTradingApiBaseUrl()}${normalizedPath}`;
}

export const API_PATHS = {
  authLogin: "/api/auth/login",
  authRegisterTrader: "/api/auth/register/trader",
  tradingValidateBuyFunds: "/api/v1/validations/funds/buy",
  tradingValidateMarketStatus: "/api/v1/validations/market/status",
} as const;
