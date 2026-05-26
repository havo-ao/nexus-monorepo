import { useEffect, useState } from "react";
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
} from "@ionic/react";
import {
  cashOutline,
  checkmarkCircleOutline,
  pulseOutline,
  ticketOutline,
} from "ionicons/icons";
import { useHistory, useLocation } from "react-router-dom";
import NavBar from "../components/NavBar";
import {
  createMarketBuyOrder,
  validateBuyFunds,
  validateMarketStatus,
  type FundsValidationResponse,
  type MarketValidationResponse,
  type TradingOrderResponse,
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
  const [orderSymbol, setOrderSymbol] = useState("AAPL");
  const [orderQuantity, setOrderQuantity] = useState("1");
  const [estimatedUnitPrice, setEstimatedUnitPrice] = useState("250");
  const [createdOrder, setCreatedOrder] = useState<TradingOrderResponse | null>(
    null,
  );
  const [orderError, setOrderError] = useState("");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const orderQuantityValue = Number(orderQuantity);
  const estimatedUnitPriceValue = Number(estimatedUnitPrice);
  const estimatedGrossAmount =
    Number.isFinite(orderQuantityValue) &&
    Number.isFinite(estimatedUnitPriceValue)
      ? orderQuantityValue * estimatedUnitPriceValue
      : 0;

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

  const handleCreateMarketBuyOrder = async () => {
    setCreatedOrder(null);
    setOrderError("");

    const quantity = Number(orderQuantity);
    const price = Number(estimatedUnitPrice);

    if (
      !traderId.trim() ||
      !exchangeId.trim() ||
      !orderSymbol.trim() ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setOrderError("Enter a valid trader, market, symbol, quantity and price.");
      return;
    }

    setIsCreatingOrder(true);
    try {
      const order = await createMarketBuyOrder({
        traderId: traderId.trim(),
        symbol: orderSymbol.trim().toUpperCase(),
        exchangeId: exchangeId.trim(),
        quantity,
        estimatedUnitPrice: price,
      });
      setCreatedOrder(order);
    } catch (error) {
      setOrderError(
        error instanceof Error
          ? error.message
          : "Unable to create market buy order.",
      );
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <IonPage>
      <NavBar />
      <IonContent fullscreen className="trader-panel-content">
        <main className="trader-panel-shell">
          <header className="trader-panel-header">
            <div>
              <span className="trader-panel-eyebrow">Trading</span>
              <h1>Order ticket</h1>
              <p>
                Create a market buy order after validating market rules and
                reserving available buying power.
              </p>
            </div>
            <button
              type="button"
              className="trader-panel-secondary-action"
              onClick={() => history.push("/markets")}
            >
              Market
            </button>
          </header>

          <section className="trader-session-strip">
            <div>
              <span>Trader</span>
              <strong>{formatUserDisplayName(user)}</strong>
            </div>
            <div>
              <span>Username</span>
              <strong>@{user.username}</strong>
            </div>
            <div>
              <span>Default currency</span>
              <strong>USD</strong>
            </div>
          </section>

          <section className="trader-panel-grid">
            <article className="trader-order-ticket">
              <div className="trader-panel-section-heading">
                <span>
                  <IonIcon icon={ticketOutline} />
                </span>
                <div>
                  <h2>Market buy</h2>
                  <p>Funds are reserved locally before broker execution.</p>
                </div>
              </div>

              <div className="trader-ticket-grid">
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
                  <IonLabel position="stacked">Market</IonLabel>
                  <IonInput
                    value={exchangeId}
                    onIonInput={(event) =>
                      setExchangeId(String(event.detail.value ?? ""))
                    }
                  />
                </IonItem>
              <IonItem>
                <IonLabel position="stacked">Symbol</IonLabel>
                <IonInput
                  value={orderSymbol}
                  onIonInput={(event) =>
                    setOrderSymbol(String(event.detail.value ?? ""))
                  }
                />
              </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Currency</IonLabel>
                  <IonInput value="USD" readonly />
                </IonItem>
              <IonItem>
                <IonLabel position="stacked">Quantity</IonLabel>
                <IonInput
                  type="number"
                  min="0"
                  value={orderQuantity}
                  onIonInput={(event) =>
                    setOrderQuantity(String(event.detail.value ?? ""))
                  }
                />
              </IonItem>
              <IonItem>
                  <IonLabel position="stacked">Estimated price</IonLabel>
                <IonInput
                  type="number"
                  min="0"
                  value={estimatedUnitPrice}
                  onIonInput={(event) =>
                    setEstimatedUnitPrice(String(event.detail.value ?? ""))
                  }
                />
              </IonItem>
            </div>

              <div className="trader-order-summary">
                <div>
                  <span>Estimated amount</span>
                  <strong>
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(Math.max(estimatedGrossAmount, 0))}
                  </strong>
                </div>
                <div>
                  <span>Order type</span>
                  <strong>Market buy</strong>
                </div>
                <div>
                  <span>Next status</span>
                  <strong>Pending execution</strong>
                </div>
              </div>

            <IonButton
              expand="block"
                className="trader-primary-button"
              onClick={handleCreateMarketBuyOrder}
              disabled={isCreatingOrder}
            >
              {isCreatingOrder ? "Creating" : "Create Market Buy Order"}
            </IonButton>
            {createdOrder && (
              <p className="funds-validation-message approved">
                Order {createdOrder.orderReference} is{" "}
                {createdOrder.status.replaceAll("_", " ").toLowerCase()}.
                Reserved {createdOrder.currency}{" "}
                {createdOrder.reservedAmount.toFixed(2)} for{" "}
                {createdOrder.quantity} {createdOrder.symbol}.
              </p>
            )}
            {orderError && (
                <p className="trader-panel-message rejected">{orderError}</p>
            )}
            </article>

            <aside className="trader-precheck-panel">
              <div className="trader-panel-section-heading">
                <span>
                  <IonIcon icon={checkmarkCircleOutline} />
                </span>
                <div>
                  <h2>Pre-checks</h2>
                  <p>Run validations independently when you need evidence.</p>
                </div>
              </div>

              <section className="trader-precheck-section">
                <div className="trader-precheck-title">
                  <IonIcon icon={cashOutline} />
                  <h3>Funds</h3>
                </div>
                <div className="trader-precheck-fields">
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
                  fill="outline"
              onClick={handleValidateFunds}
              disabled={isValidatingFunds}
            >
              {isValidatingFunds ? "Validating" : "Validate Funds"}
            </IonButton>
            {validation && (
              <p
                className={
                  validation.approved
                        ? "trader-panel-message approved"
                        : "trader-panel-message rejected"
                }
              >
                {validation.approved
                  ? `Sufficient funds. ${validation.reservedAmount.toFixed(2)} has been reserved.`
                  : `Operation blocked. Available: ${validation.availableAmount.toFixed(2)}.`}
              </p>
            )}
            {validationError && (
                  <p className="trader-panel-message rejected">
                {validationError}
              </p>
            )}
          </section>

              <section className="trader-precheck-section">
                <div className="trader-precheck-title">
                  <IonIcon icon={pulseOutline} />
                  <h3>Market</h3>
                </div>
            <IonButton
              expand="block"
                  fill="outline"
              onClick={handleValidateMarket}
              disabled={isValidatingMarket}
            >
              {isValidatingMarket ? "Validating" : "Validate Market"}
            </IonButton>
            {marketValidation && (
              <p
                className={
                  marketValidation.canOperate
                        ? "trader-panel-message approved"
                        : "trader-panel-message rejected"
                }
              >
                {marketValidation.canOperate
                  ? "Market is open. The order can continue."
                  : `Operation blocked. Status: ${marketValidation.marketStatus}.`}
              </p>
            )}
            {marketValidationError && (
                  <p className="trader-panel-message rejected">
                {marketValidationError}
              </p>
            )}
          </section>
            </aside>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default TraderPanel;
