import { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar
} from "@ionic/react";
import NavBar from "../components/NavBar";
import { verifyStripeCheckoutSession } from "../api/subscriptions";
import "./Success.css";

const Success: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [status, setStatus] = useState<"success" | "failed" | null>(null);
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const sessionId = query.get("session_id")?.trim() ?? "";

    const verify = async () => {
      setIsLoading(true);
      try {
        if (!sessionId) {
          throw new Error("No session_id provided in the redirect URL.");
        }

        const result = await verifyStripeCheckoutSession(sessionId);
        setStatus(result.status);
        setMessage(result.message);
      } catch (error) {
        setStatus("failed");
        setMessage(error instanceof Error ? error.message : "Payment verification failed.");
      } finally {
        setIsLoading(false);
      }
    };

    void verify();
  }, [location.search]);

  const renderStatus = () => {
    if (isLoading) {
      return <p>Verifying payment status...</p>;
    }

    if (status === "success") {
      return (
        <div className="success-card success-card--ok">
          <h2>Payment successful</h2>
          <p>{message || "Your payment was processed successfully."}</p>
        </div>
      );
    }

    return (
      <div className="success-card success-card--failed">
        <h2>Payment failed</h2>
        <p>{message || "The payment could not be verified or was rejected."}</p>
      </div>
    );
  };

  return (
    <IonPage>
      <NavBar />
      <IonHeader>
        <IonToolbar>
          <IonTitle>Subscription Status</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding success-page-content">
        <div className="success-container">
          <IonText>
            <h1>Checkout result</h1>
            <p>Stripe redirected back with the checkout session result. We verify the payment before confirming your subscription.</p>
          </IonText>

          {renderStatus()}

          <IonButton expand="block" className="success-button" onClick={() => history.push("/plan-selection")}>Continue</IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Success;
