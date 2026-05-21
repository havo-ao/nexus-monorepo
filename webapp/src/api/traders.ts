import { apiUrl, API_PATHS } from "../config/api";
import { getAccessToken, getStoredUser } from "../auth/storage";

export type ProfileResponse = Record<string, unknown>;

function getProfilePath(): string {
  return getStoredUser()?.userRol === "ADMIN" ? API_PATHS.adminMe : API_PATHS.tradersMe;
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

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof (body as any).message === "string" ? (body as any).message : "Could not fetch profile.";
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

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof (body as any).message === "string" ? (body as any).message : "Could not update profile.";
    throw new Error(message);
  }

  return body as ProfileResponse;
}
