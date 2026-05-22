import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { IonButton, IonContent, IonPage, IonText } from "@ionic/react";
import NavBar from "../components/NavBar";
import "./CancelledPayment.css";

const REDIRECT_SECONDS = 10;

const CancelledPayment: React.FC = () => {
  const history = useHistory();
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    const countdownTimer = window.setInterval(() => {
      setSecondsLeft((current) => (current > 1 ? current - 1 : 0));
    }, 1000);

    const redirectTimer = window.setTimeout(() => {
      history.replace("/plan-selection");
    }, REDIRECT_SECONDS * 1000);

    return () => {
      window.clearInterval(countdownTimer);
      window.clearTimeout(redirectTimer);
    };
  }, [history]);

  return (
    <IonPage>
      <NavBar />
      <IonContent fullscreen className="ion-padding cancelled-payment-content">
        <div className="cancelled-payment-container">
          <IonText>
            <span className="cancelled-payment-kicker">PAYMENT CANCELLED</span>
            <h1>Subscription payment cancelled</h1>
            <p>
              Your subscription payment was cancelled. You will be redirected back to the available plans in{" "}
              {secondsLeft} second{secondsLeft === 1 ? "" : "s"}.
            </p>
          </IonText>

          <div className="cancelled-payment-card">
            <h2>No charges were confirmed</h2>
            <p>
              If you still want premium access, you can review the plans again and restart checkout whenever you are
              ready.
            </p>
          </div>

          <IonButton expand="block" className="cancelled-payment-button" onClick={() => history.replace("/plan-selection")}>
            Return to plans now
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CancelledPayment;
