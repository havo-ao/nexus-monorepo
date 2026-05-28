import { apiUrl, API_PATHS } from "../config/api";
import type { AuthResponse, LoginRequest, TraderCreateRequest, TraderResponse } from "./types";
import { parseApiErrorMessage } from "./errors";

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

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(apiUrl(API_PATHS.authLogin), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(request)
  });

  const body = await readJsonSafe(response);

  if (!response.ok) {
    throw new Error(parseApiErrorMessage(response.status, body));
  }

  return body as AuthResponse;
}

export async function registerTrader(request: TraderCreateRequest): Promise<TraderResponse> {
  const response = await fetch(apiUrl(API_PATHS.authRegisterTrader), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(request)
  });

  const body = await readJsonSafe(response);

  if (!response.ok) {
    throw new Error(parseApiErrorMessage(response.status, body));
  }

  return body as TraderResponse;
}
