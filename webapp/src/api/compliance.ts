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
