import type { AuthResponse, UserProfile, UserRol } from "../api/types";

export const SESSION_CHANGE_EVENT = "nexus_session_change";

const SESSION_KEY = "nexus_session";
/** @deprecated Legacy keys — cleared when migrating to nexus_session */
const LEGACY_ACCESS = "nexus_access_token";
const LEGACY_REFRESH = "nexus_refresh_token";

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
};

export function persistAuthSession(auth: AuthResponse): void {
  const session: StoredSession = {
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    tokenType: auth.tokenType,
    expiresIn: auth.expiresIn,
    user: auth.user
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.removeItem(LEGACY_ACCESS);
  localStorage.removeItem(LEGACY_REFRESH);
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

export function getStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredSession;
    if (
      typeof parsed.accessToken !== "string" ||
      typeof parsed.refreshToken !== "string" ||
      !parsed.user ||
      typeof parsed.user.id !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getStoredUser(): UserProfile | null {
  return getStoredSession()?.user ?? null;
}

export function getAccessToken(): string | null {
  return getStoredSession()?.accessToken ?? null;
}

export function clearAuthSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LEGACY_ACCESS);
  localStorage.removeItem(LEGACY_REFRESH);
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

export function formatUserDisplayName(user: UserProfile): string {
  return `${user.name} ${user.surname}`.trim();
}

export function formatUserRoleLabel(role: UserRol): string {
  return role
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
