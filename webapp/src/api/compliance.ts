import { getAccessToken } from "../auth/storage";
import { API_PATHS, complianceApiUrl } from "../config/api";

export type ComplianceReportType = "operational" | "regulatory" | "executive";

export type ComplianceReport = {
  reportType: string;
  generatedAt: string;
  range?: {
    from?: string;
    to?: string;
  };
  metrics?: Record<string, number>;
  summary?: Record<string, number>;
  provenance?: Record<string, string>;
};

export type AuditEvent = {
  id: string;
  eventType: string;
  sourceService: string;
  actorId: string;
  actorRole?: string;
  entityType: string;
  entityId: string;
  correlationId?: string;
  result: "SUCCESS" | "FAILURE" | "PENDING" | "INFO";
  critical: boolean;
  occurredAt: string;
  recordedAt: string;
};

export type NotificationAttempt = {
  id: string;
  category: string;
  channel: "EMAIL";
  recipientEmail?: string;
  subject: string;
  sourceService: string;
  entityType: string;
  entityId: string;
  correlationId?: string;
  deliveryStatus: "SENT" | "FAILED" | "SKIPPED";
  occurredAt: string;
  recordedAt: string;
};

function buildHeaders(): HeadersInit {
  const accessToken = getAccessToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

export async function getComplianceReport(
  type: ComplianceReportType,
): Promise<ComplianceReport> {
  const response = await fetch(
    complianceApiUrl(`${API_PATHS.complianceReports}/${type}`),
    {
      headers: buildHeaders(),
    },
  );
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof body.message === "string"
        ? body.message
        : "Could not load the compliance report.",
    );
  }

  return body as ComplianceReport;
}

export async function getAuditEvents(): Promise<AuditEvent[]> {
  const response = await fetch(complianceApiUrl("/api/v1/audit/events"), {
    headers: buildHeaders(),
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof body.message === "string"
        ? body.message
        : "Could not load audit evidence.",
    );
  }

  return Array.isArray(body) ? (body as AuditEvent[]) : [];
}

export async function getNotificationAttempts(): Promise<NotificationAttempt[]> {
  const response = await fetch(
    complianceApiUrl("/api/v1/notifications/attempts"),
    {
      headers: buildHeaders(),
    },
  );
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof body.message === "string"
        ? body.message
        : "Could not load notification evidence.",
    );
  }

  return Array.isArray(body) ? (body as NotificationAttempt[]) : [];
}
