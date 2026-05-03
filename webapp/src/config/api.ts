/**
 * API base URL for the identity service.
 * Set `VITE_API_BASE_URL` in `.env` / `.env.production` (no trailing slash).
 * Example dev: http://localhost:8881
 * Example prod: https://api.yourdomain.com
 *
 * If unset, requests use same-origin paths like `/api/...` (useful with Vite dev proxy).
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw === undefined || raw === "") {
    return "";
  }
  return String(raw).replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${normalizedPath}` : normalizedPath;
}

export const API_PATHS = {
  authLogin: "/api/auth/login",
  authRegisterTrader: "/api/auth/register/trader"
} as const;
