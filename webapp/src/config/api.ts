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

export function getMarketApiBaseUrl(): string {
  return cleanBaseUrl(
    import.meta.env.VITE_MARKET_API_BASE_URL ?? "/market-api",
  );
}

export function getPortfolioApiBaseUrl(): string {
  return cleanBaseUrl(
    import.meta.env.VITE_PORTFOLIO_API_BASE_URL ?? "/portfolio-api",
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

export function marketApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getMarketApiBaseUrl()}${normalizedPath}`;
}

export function portfolioApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getPortfolioApiBaseUrl()}${normalizedPath}`;
}

export const API_PATHS = {
  authLogin: "/api/auth/login",
  authRegisterTrader: "/api/auth/register/trader",
  tradingValidateBuyFunds: "/api/v1/validations/funds/buy",
  tradingValidateMarketStatus: "/api/v1/validations/market/status",
  marketDashboard: "/api/v1/dashboard",
  marketMarkets: "/api/v1/markets",
  marketInstruments: "/api/v1/instruments",
  marketQuotes: "/api/v1/quotes",
  marketHours: "/api/v1/market-hours",
  marketWatchlists: "/api/v1/watchlists",
  authRegisterAdmin: "/api/auth/register/admin",
  subscriptionCheckout: "/api/subscriptions/checkout",
  subscriptionStatus: "/api/subscriptions/status",
  tradersMe: "/api/traders/me",
  tradersUpdate: "/api/traders",
  adminBase: "/api/admin",
  adminMe: "/api/admin/me",
  adminAudit: "/api/admin/audit",
  adminCount: "/api/admin/count",
  adminTraderAudit: "/api/admin/audit/traders",
  adminTraderCount: "/api/admin/traders/count",
  adminSubscriptionPlans: "/api/admin/subscription-plans",
  subscriptionVerify: "/api/subscriptions/verify",
  portfolioBase: "/api/v1/portfolio",
} as const;
