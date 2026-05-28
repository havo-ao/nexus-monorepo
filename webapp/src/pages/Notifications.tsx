import { useEffect, useState } from "react";
import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner,
} from "@ionic/react";
import {
  mailUnreadOutline,
  refreshOutline,
  shieldCheckmarkOutline,
} from "ionicons/icons";
import NavBar from "../components/NavBar";
import {
  getNotificationAttempts,
  type NotificationAttempt,
} from "../api/compliance";
import { getStoredUser } from "../auth/storage";
import "./Notifications.css";

const Notifications: React.FC = () => {
  const user = getStoredUser();
  const canViewEvidence = user?.userRol === "ADMIN" || user?.userRol === "LEGAL_USER";
  const [attempts, setAttempts] = useState<NotificationAttempt[]>([]);
  const [loading, setLoading] = useState(canViewEvidence);
  const [error, setError] = useState("");

  const loadAttempts = async () => {
    if (!canViewEvidence) {
      setLoading(false);
      setAttempts([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      setAttempts((await getNotificationAttempts()).slice(0, 12));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load notification evidence.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAttempts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewEvidence]);

  return (
    <IonPage>
      <NavBar />
      <IonContent fullscreen className="notifications-content">
        <main className="notifications-shell">
          <header className="notifications-header">
            <div>
              <span>Notifications</span>
              <h1>{canViewEvidence ? "Delivery evidence" : "Notification center"}</h1>
              <p>
                {canViewEvidence
                  ? "Review notification attempts recorded by compliance-service."
                  : "Your trading notifications will appear here when new activity is available."}
              </p>
            </div>
            {canViewEvidence && (
              <IonButton onClick={() => void loadAttempts()} disabled={loading}>
                <IonIcon slot="start" icon={refreshOutline} />
                Refresh
              </IonButton>
            )}
          </header>

          {!canViewEvidence ? (
            <section className="notifications-state">
              <IonIcon icon={mailUnreadOutline} />
              <strong>No personal notifications yet</strong>
              <span>
                Order updates, market alerts and account notices will be shown
                here.
              </span>
            </section>
          ) : loading ? (
            <section className="notifications-state">
              <IonSpinner name="crescent" />
              <span>Loading notification evidence</span>
            </section>
          ) : error ? (
            <section className="notifications-state notifications-state--error">
              <IonIcon icon={shieldCheckmarkOutline} />
              <span>{error}</span>
            </section>
          ) : (
            <section className="notifications-grid">
              {attempts.length ? (
                attempts.map((attempt) => (
                  <article key={attempt.id}>
                    <div>
                      <strong>{attempt.subject}</strong>
                      <span>
                        {attempt.category} ·{" "}
                        {attempt.recipientEmail ?? "No recipient"}
                      </span>
                    </div>
                    <footer>
                      <small>{attempt.sourceService}</small>
                      <em className={attempt.deliveryStatus.toLowerCase()}>
                        {attempt.deliveryStatus}
                      </em>
                    </footer>
                  </article>
                ))
              ) : (
                <div className="notifications-state">
                  <IonIcon icon={mailUnreadOutline} />
                  <strong>No delivery evidence yet</strong>
                </div>
              )}
            </section>
          )}
        </main>
      </IonContent>
    </IonPage>
  );
};

export default Notifications;
