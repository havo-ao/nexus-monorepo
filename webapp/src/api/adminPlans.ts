import { API_PATHS, apiUrl } from "../config/api";
import { getAccessToken } from "../auth/storage";

export type SubscriptionPlanPayload = {
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  active: boolean;
};

export type SubscriptionPlanResponse = {
  id?: number;
  name: string;
  description: string;
  priceMonthly: number | string;
  priceYearly: number | string;
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

async function authorizedFetch(path: string, init?: RequestInit): Promise<Response> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Your session is not active. Please sign in again.");
  }

  return fetch(apiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {})
    }
  });
}

async function readJsonError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(typeof body.message === "string" ? body.message : fallback);
  }
  return body;
}

export async function createSubscriptionPlan(payload: SubscriptionPlanPayload): Promise<SubscriptionPlanResponse> {
  const response = await authorizedFetch(API_PATHS.adminSubscriptionPlans, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return (await readJsonError(response, "Could not create the plan.")) as SubscriptionPlanResponse;
}

export async function getAllSubscriptionPlans(): Promise<SubscriptionPlanResponse[]> {
  const response = await authorizedFetch(API_PATHS.adminSubscriptionPlans);
  const body = await readJsonError(response, "Could not load plans.");
  return Array.isArray(body) ? (body as SubscriptionPlanResponse[]) : [];
}

export async function getSubscriptionPlanById(id: number): Promise<SubscriptionPlanResponse> {
  const response = await authorizedFetch(`${API_PATHS.adminSubscriptionPlans}/${id}`);
  return (await readJsonError(response, "Could not load that plan.")) as SubscriptionPlanResponse;
}

export async function updateSubscriptionPlan(
  id: number,
  payload: SubscriptionPlanPayload
): Promise<SubscriptionPlanResponse> {
  const response = await authorizedFetch(`${API_PATHS.adminSubscriptionPlans}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return (await readJsonError(response, "Could not update the plan.")) as SubscriptionPlanResponse;
}

export async function toggleSubscriptionPlanActive(id: number): Promise<SubscriptionPlanResponse> {
  const response = await authorizedFetch(`${API_PATHS.adminSubscriptionPlans}/${id}/toggle-active`, {
    method: "PATCH"
  });

  return (await readJsonError(response, "Could not update the plan status.")) as SubscriptionPlanResponse;
}
