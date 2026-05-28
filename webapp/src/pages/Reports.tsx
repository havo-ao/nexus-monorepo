import { useEffect, useMemo, useState } from "react";
import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner,
} from "@ionic/react";
import {
  barChartOutline,
  documentTextOutline,
  refreshOutline,
  shieldCheckmarkOutline,
} from "ionicons/icons";
import NavBar from "../components/NavBar";
import { getStoredUser } from "../auth/storage";
import {
  getComplianceReport,
  type ComplianceReport,
  type ComplianceReportType,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canViewReports = user?.userRol === "ADMIN" || user?.userRol === "LEGAL_USER";

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
      setReport(await getComplianceReport(type));
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
              <span>Compliance</span>
              <h1>Reports</h1>
              <p>
                Review operational, regulatory and executive evidence from the
                compliance service.
              </p>
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
            </section>
          )}
        </main>
      </IonContent>
    </IonPage>
  );
};

export default Reports;
