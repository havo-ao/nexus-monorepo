import { API_PATHS, apiUrl } from "../config/api";
import { getAccessToken } from "../auth/storage";

export type PremiumPlanCycle = "monthly" | "yearly";

type CheckoutResponse = {
  url: string;
};

export async function createStripeCheckoutSession(plan: PremiumPlanCycle): Promise<string> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Your session is not active. Please sign in again.");
  }

  const response = await fetch(apiUrl(API_PATHS.subscriptionCheckout), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ plan })
  });

  const body = (await response.json()) as Partial<CheckoutResponse>;

  if (!response.ok || !body.url) {
    throw new Error("Could not create checkout session. Please try again.");
  }

  return body.url;
}

export type SubscriptionStatusResponse = Record<string, unknown>;

export async function verifyStripeCheckoutSession(sessionId: string): Promise<{ status: "success" | "failed"; message: string }> {
  if (!sessionId) {
    throw new Error("Missing checkout session_id.");
  }

  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Your session is not active. Please sign in again.");
  }

  const response = await fetch(apiUrl(`${API_PATHS.subscriptionVerify}?session_id=${encodeURIComponent(sessionId)}`), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`
    }
  });

  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  const success =
    payload.status === "success" ||
    payload.success === true ||
    payload.paid === true ||
    payload.verified === true ||
    payload.payment_status === "paid";

  const message =
    typeof payload.message === "string"
      ? payload.message
      : response.ok
      ? "The payment verification completed successfully."
      : "The payment verification failed.";

  if (!response.ok || !success) {
    return { status: "failed", message };
  }

  return { status: "success", message };
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Your session is not active. Please sign in again.");
  }

  const response = await fetch(apiUrl(API_PATHS.subscriptionStatus), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`
    }
  });

  const body = await response.json().catch(() => ({})) as SubscriptionStatusResponse;

  if (!response.ok) {
    const message = typeof body.message === "string" ? body.message : "Could not load subscription status.";
    throw new Error(message);
  }

  return body;
}
