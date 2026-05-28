import { apiUrl, API_PATHS } from "../config/api";
import { clearAuthSession, getAccessToken, getStoredUser } from "../auth/storage";

export type ProfileResponse = Record<string, unknown>;

type ErrorResponse = {
  message?: unknown;
};

function getProfilePath(): string {
  const role = getStoredUser()?.userRol;
  if (role === "ADMIN") {
    return API_PATHS.adminMe;
  }
  if (role === "TRADER") {
    return API_PATHS.tradersMe;
  }
  return API_PATHS.authMe;
}

export async function getTraderMe(): Promise<ProfileResponse> {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("Your session is not active. Please sign in again.");

  const response = await fetch(apiUrl(getProfilePath()), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`
    }
  });

  const body = (await response.json().catch(() => ({}))) as ErrorResponse;
  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
      throw new Error("Your session expired. Please sign in again.");
    }

    const message =
      typeof body.message === "string"
        ? body.message
        : "Could not fetch profile.";
    throw new Error(message);
  }

  return body as ProfileResponse;
}

export async function updateTrader(payload: Record<string, unknown>): Promise<ProfileResponse> {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("Your session is not active. Please sign in again.");

  const response = await fetch(apiUrl(API_PATHS.tradersUpdate), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  });

  const body = (await response.json().catch(() => ({}))) as ErrorResponse;
  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
      throw new Error("Your session expired. Please sign in again.");
    }

    const message =
      typeof body.message === "string"
        ? body.message
        : "Could not update profile.";
    throw new Error(message);
  }

  return body as ProfileResponse;
}
