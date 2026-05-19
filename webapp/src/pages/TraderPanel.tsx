import { useEffect, useState } from "react";
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonText,
} from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import NavBar from "../components/NavBar";
import {
  validateBuyFunds,
  validateMarketStatus,
  type FundsValidationResponse,
  type MarketValidationResponse,
} from "../api/trading";
import type { UserProfile } from "../api/types";
import { formatUserDisplayName, getStoredUser } from "../auth/storage";
import "./TraderPanel.css";

const TraderPanel: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [traderId, setTraderId] = useState("101");
  const [grossAmount, setGrossAmount] = useState("750");
  const [validation, setValidation] = useState<FundsValidationResponse | null>(
    null,
  );
  const [validationError, setValidationError] = useState("");
  const [isValidatingFunds, setIsValidatingFunds] = useState(false);
  const [exchangeId, setExchangeId] = useState("1");
  const [marketValidation, setMarketValidation] =
    useState<MarketValidationResponse | null>(null);
  const [marketValidationError, setMarketValidationError] = useState("");
  const [isValidatingMarket, setIsValidatingMarket] = useState(false);

  // Ionic keeps pages in the navigation stack; the same component instance can be reused.
  // `location.key` changes on each navigation, so we always re-read session from storage.
  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      history.replace("/login");
      return;
    }
    setUser(stored);
  }, [history, location.key]);

  const handleValidateFunds = async () => {
    setValidation(null);
    setValidationError("");

    const amount = Number(grossAmount);
    if (!traderId.trim() || !Number.isFinite(amount) || amount <= 0) {
      setValidationError("Enter a valid trader and buy amount.");
      return;
    }

    setIsValidatingFunds(true);
    try {
      const result = await validateBuyFunds({
        traderId: traderId.trim(),
        grossAmount: amount,
      });
      setValidation(result);
    } catch (error) {
      setValidationError(
        error instanceof Error
          ? error.message
          : "Unable to validate operation funds.",
      );
    } finally {
      setIsValidatingFunds(false);
    }
  };

  const handleValidateMarket = async () => {
    setMarketValidation(null);
    setMarketValidationError("");

    if (!exchangeId.trim()) {
      setMarketValidationError("Enter the market to validate.");
      return;
    }

    setIsValidatingMarket(true);
    try {
      const result = await validateMarketStatus({
        exchangeId: exchangeId.trim(),
      });
      setMarketValidation(result);
    } catch (error) {
      setMarketValidationError(
        error instanceof Error
          ? error.message
          : "Unable to validate market status.",
      );
    } finally {
      setIsValidatingMarket(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <IonPage>
      <NavBar />
      <IonContent fullscreen className="ion-padding trader-panel-content">
        <div className="trader-panel-card">
          <IonText>
            <h1>Welcome</h1>
          </IonText>
          <p className="trader-panel-greeting">
            Hello, <strong>{formatUserDisplayName(user)}</strong>.
          </p>
          <dl className="trader-panel-details">
            <div>
              <dt>Username</dt>
              <dd>{user.username}</dd>
            </div>
            <div>
              <dt>First name</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>Last name</dt>
              <dd>{user.surname}</dd>
            </div>
          </dl>
          <section className="funds-validation-section">
            <IonText>
              <h2>Validate Buy Order</h2>
            </IonText>
            <div className="funds-validation-fields">
              <IonItem>
                <IonLabel position="stacked">Trader</IonLabel>
                <IonInput
                  value={traderId}
                  onIonInput={(event) =>
                    setTraderId(String(event.detail.value ?? ""))
                  }
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Amount</IonLabel>
                <IonInput
                  type="number"
                  min="0"
                  value={grossAmount}
                  onIonInput={(event) =>
                    setGrossAmount(String(event.detail.value ?? ""))
                  }
                />
              </IonItem>
            </div>
            <IonButton
              expand="block"
              onClick={handleValidateFunds}
              disabled={isValidatingFunds}
            >
              {isValidatingFunds ? "Validating" : "Validate Funds"}
            </IonButton>
            {validation && (
              <p
                className={
                  validation.approved
                    ? "funds-validation-message approved"
                    : "funds-validation-message rejected"
                }
              >
                {validation.approved
                  ? `Sufficient funds. ${validation.reservedAmount.toFixed(2)} has been reserved.`
                  : `Operation blocked. Available: ${validation.availableAmount.toFixed(2)}.`}
              </p>
            )}
            {validationError && (
              <p className="funds-validation-message rejected">
                {validationError}
              </p>
            )}
          </section>
          <section className="funds-validation-section">
            <IonText>
              <h2>Validate Market</h2>
            </IonText>
            <div className="funds-validation-fields">
              <IonItem>
                <IonLabel position="stacked">Market</IonLabel>
                <IonInput
                  value={exchangeId}
                  onIonInput={(event) =>
                    setExchangeId(String(event.detail.value ?? ""))
                  }
                />
              </IonItem>
            </div>
            <IonButton
              expand="block"
              onClick={handleValidateMarket}
              disabled={isValidatingMarket}
            >
              {isValidatingMarket ? "Validating" : "Validate Market"}
            </IonButton>
            {marketValidation && (
              <p
                className={
                  marketValidation.canOperate
                    ? "funds-validation-message approved"
                    : "funds-validation-message rejected"
                }
              >
                {marketValidation.canOperate
                  ? "Market is open. The order can continue."
                  : `Operation blocked. Status: ${marketValidation.marketStatus}.`}
              </p>
            )}
            {marketValidationError && (
              <p className="funds-validation-message rejected">
                {marketValidationError}
              </p>
            )}
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TraderPanel;
