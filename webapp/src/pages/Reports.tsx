import { useEffect, useMemo, useState } from "react";
import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner,
} from "@ionic/react";
import {
  alertCircleOutline,
  barChartOutline,
  documentTextOutline,
  mailUnreadOutline,
  refreshOutline,
  shieldCheckmarkOutline,
  timeOutline,
} from "ionicons/icons";
import NavBar from "../components/NavBar";
import { formatUserDisplayName, getStoredUser } from "../auth/storage";
import {
  getAuditEvents,
  getComplianceReport,
  getNotificationAttempts,
  type AuditEvent,
  type ComplianceReport,
  type ComplianceReportType,
  type NotificationAttempt,
} from "../api/compliance";
import "./Reports.css";

const reportOptions: Array<{
  type: ComplianceReportType;
  title: string;
  description: string;
}> = [
  {
    type: "operational",
    title: "Operational",
    description: "Order events, audit activity and notification delivery.",
  },
  {
    type: "regulatory",
    title: "Regulatory",
    description: "Critical events, restrictions and evidence references.",
  },
  {
    type: "executive",
    title: "Executive",
    description: "Board-level summary of platform risk and traceability.",
  },
];

function formatReportValue(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

const Reports: React.FC = () => {
  const user = getStoredUser();
  const [activeType, setActiveType] =
    useState<ComplianceReportType>("operational");
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [notificationAttempts, setNotificationAttempts] = useState<
    NotificationAttempt[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canViewReports = user?.userRol === "ADMIN" || user?.userRol === "LEGAL_USER";
  const workspaceLabel = user?.userRol === "ADMIN" ? "Administration" : "Legal";

  const metrics = useMemo(
    () => report?.metrics ?? report?.summary ?? {},
    [report],
  );

  const loadReport = async (type = activeType) => {
    if (!canViewReports) {
      setLoading(false);
      setError("This workspace is available only to admin and legal users.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [reportResult, auditResult, notificationResult] =
        await Promise.all([
          getComplianceReport(type),
          getAuditEvents(),
          getNotificationAttempts(),
        ]);
      setReport(reportResult);
      setAuditEvents(auditResult.slice(0, 6));
      setNotificationAttempts(notificationResult.slice(0, 6));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load the compliance report.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport(activeType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType, canViewReports]);

  return (
    <IonPage>
      <NavBar />
      <IonContent fullscreen className="reports-content">
        <main className="reports-shell">
          <header className="reports-header">
            <div>
              <span>{workspaceLabel} reports</span>
              <h1>Reports</h1>
              <p>
                Review platform evidence, notification traceability and audit
                signals from the compliance service.
              </p>
              {user && (
                <small className="reports-user-context">
                  Signed in as {formatUserDisplayName(user)} · {user.userRol}
                </small>
              )}
            </div>
            <IonButton
              className="reports-refresh"
              onClick={() => void loadReport()}
              disabled={loading || !canViewReports}
            >
              <IonIcon slot="start" icon={refreshOutline} />
              Refresh
            </IonButton>
          </header>

          <section className="reports-tabs" aria-label="Report type">
            {reportOptions.map((option) => (
              <button
                key={option.type}
                type="button"
                className={activeType === option.type ? "active" : ""}
                onClick={() => setActiveType(option.type)}
              >
                <strong>{option.title}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </section>

          {loading ? (
            <section className="reports-state">
              <IonSpinner name="crescent" />
              <span>Loading report</span>
            </section>
          ) : error ? (
            <section className="reports-state reports-state--error">
              <IonIcon icon={shieldCheckmarkOutline} />
              <span>{error}</span>
            </section>
          ) : (
            <section className="reports-panel">
              <div className="reports-panel-header">
                <div>
                  <h2>{report?.reportType ?? "Report"}</h2>
                  <p>
                    Generated{" "}
                    {report?.generatedAt
                      ? new Date(report.generatedAt).toLocaleString()
                      : "recently"}
                  </p>
                </div>
                <IonIcon icon={barChartOutline} />
              </div>

              <div className="reports-metrics">
                {Object.entries(metrics).map(([key, value]) => (
                  <article key={key}>
                    <span>{key.replace(/([A-Z])/g, " $1")}</span>
                    <strong>{formatReportValue(value)}</strong>
                  </article>
                ))}
              </div>

              {report?.provenance && (
                <div className="reports-provenance">
                  <h3>
                    <IonIcon icon={documentTextOutline} />
                    Evidence sources
                  </h3>
                  {Object.entries(report.provenance).map(([key, value]) => (
                    <p key={key}>
                      <strong>{key}</strong>
                      <span>{value}</span>
                    </p>
                  ))}
                </div>
              )}

              <div className="reports-evidence-grid">
                <article>
                  <h3>
                    <IonIcon icon={alertCircleOutline} />
                    Audit evidence
                  </h3>
                  {auditEvents.length ? (
                    <div className="reports-evidence-list">
                      {auditEvents.map((event) => (
                        <div key={event.id} className="reports-evidence-row">
                          <div>
                            <strong>{event.eventType}</strong>
                            <span>
                              {event.sourceService} · {event.entityType}{" "}
                              {event.entityId}
                            </span>
                          </div>
                          <small className={event.critical ? "critical" : ""}>
                            {event.critical ? "Critical" : event.result}
                          </small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="reports-empty-state">
                      No audit evidence has been recorded yet.
                    </p>
                  )}
                </article>

                <article>
                  <h3>
                    <IonIcon icon={mailUnreadOutline} />
                    Notification evidence
                  </h3>
                  {notificationAttempts.length ? (
                    <div className="reports-evidence-list">
                      {notificationAttempts.map((attempt) => (
                        <div key={attempt.id} className="reports-evidence-row">
                          <div>
                            <strong>{attempt.subject}</strong>
                            <span>
                              {attempt.category} ·{" "}
                              {attempt.recipientEmail ?? "No recipient"}
                            </span>
                          </div>
                          <small
                            className={
                              attempt.deliveryStatus === "FAILED"
                                ? "critical"
                                : ""
                            }
                          >
                            {attempt.deliveryStatus}
                          </small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="reports-empty-state">
                      No notification attempts have been recorded yet.
                    </p>
                  )}
                </article>
              </div>

              <footer className="reports-panel-footer">
                <IonIcon icon={timeOutline} />
                Evidence is generated on demand from compliance-service.
              </footer>
            </section>
          )}
        </main>
      </IonContent>
    </IonPage>
  );
};

export default Reports;
