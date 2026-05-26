import { getStoredUser } from "./storage";

export const WATCHLIST_CHANGE_EVENT = "nexus_watchlist_change";

export function getCurrentTraderId(): string | null {
  const user = getStoredUser();

  if (user?.userRol === "TRADER") {
    return String(user.id);
  }

  return null;
}

export function notifyWatchlistChanged(): void {
  window.dispatchEvent(new Event(WATCHLIST_CHANGE_EVENT));
}
