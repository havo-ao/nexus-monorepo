import { API_PATHS, apiUrl } from "../config/api";
import { getAccessToken } from "../auth/storage";
import type { Genre } from "./types";

export type AdminProfileResponse = Record<string, unknown>;
export type AdminAuditResponse = Record<string, unknown>;
export type TraderAuditResponse = Record<string, unknown>;
export type ServiceStatusResponse = Record<string, unknown>;

export type AdminCreatePayload = {
  name: string;
  surname: string;
  genre: Genre;
  email: string;
  username: string;
  password: string;
  department: string;
  position: string;
};

export type AdminUpdatePayload = Partial<AdminCreatePayload>;

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

export async function getAdminCount(): Promise<number> {
  const response = await authorizedFetch(API_PATHS.adminCount);
  const body = await response.json().catch(() => null);

  if (!response.ok || typeof body !== "number") {
    throw new Error("Could not load admin count.");
  }

  return body;
}

export async function getTraderAuditCount(): Promise<number> {
  const response = await authorizedFetch(API_PATHS.adminTraderCount);
  const body = await response.json().catch(() => null);

  if (!response.ok || typeof body !== "number") {
    throw new Error("Could not load trader count.");
  }

  return body;
}

export async function getAdminsAudit(): Promise<AdminAuditResponse[]> {
  const response = await authorizedFetch(API_PATHS.adminAudit);
  const body = (await response.json().catch(() => [])) as AdminAuditResponse[];

  if (!response.ok) {
    throw new Error("Could not load admins.");
  }

  return Array.isArray(body) ? body : [];
}

export async function getAdminById(id: number): Promise<AdminAuditResponse> {
  const response = await authorizedFetch(`${API_PATHS.adminBase}/${id}`);
  const body = (await response.json().catch(() => ({}))) as AdminAuditResponse & { message?: string };

  if (!response.ok) {
    throw new Error(typeof body.message === "string" ? body.message : "Could not load that admin.");
  }

  return body;
}

export async function registerAdmin(payload: AdminCreatePayload): Promise<AdminAuditResponse> {
  const response = await authorizedFetch(API_PATHS.authRegisterAdmin, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const body = (await response.json().catch(() => ({}))) as AdminAuditResponse & { message?: string };

  if (!response.ok) {
    throw new Error(typeof body.message === "string" ? body.message : "Could not register the admin.");
  }

  return body;
}

export async function updateAdmin(id: number, payload: AdminUpdatePayload): Promise<AdminAuditResponse> {
  const response = await authorizedFetch(`${API_PATHS.adminBase}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const body = (await response.json().catch(() => ({}))) as AdminAuditResponse & { message?: string };

  if (!response.ok) {
    throw new Error(typeof body.message === "string" ? body.message : "Could not update the admin.");
  }

  return body;
}

export async function getTraderAudit(): Promise<TraderAuditResponse[]> {
  const response = await authorizedFetch(API_PATHS.adminTraderAudit);
  const body = (await response.json().catch(() => [])) as TraderAuditResponse[];

  if (!response.ok) {
    throw new Error("Could not load trader audit data.");
  }

  return Array.isArray(body) ? body : [];
}
