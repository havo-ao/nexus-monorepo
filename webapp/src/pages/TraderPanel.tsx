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
  informationCircleOutline,
  layersOutline,
  pulseOutline,
  ticketOutline,
} from "ionicons/icons";
import { useHistory, useLocation } from "react-router-dom";
import NavBar from "../components/NavBar";
import {
  calculateCommission,
  createLimitBuyOrder,
  createLimitSellOrder,
  createMarketBuyOrder,
  createMarketSellOrder,
  createStopLossOrder,
  createTakeProfitOrder,
  distributeCommission,
  getOrderStatus,
  getOrderStatusHistory,
  validateBuyFunds,
  validateSellHoldings,
  validateMarketStatus,
  type CommissionCalculationResponse,
  type CommissionDistributionResponse,
  type FundsValidationResponse,
  type HoldingsValidationResponse,
  type MarketValidationResponse,
  type OrderStatusHistoryEntryResponse,
  type OrderStatusResponse,
  type TradingOrderResponse,
} from "../api/trading";
import type { UserProfile } from "../api/types";
import { formatUserDisplayName, getStoredUser } from "../auth/storage";
import "./TraderPanel.css";

type BuyOrderMode = "MARKET" | "LIMIT" | "STOP_LOSS" | "TAKE_PROFIT";
type OrderSide = "BUY" | "SELL";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const TraderPanel: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [traderId, setTraderId] = useState("101");
  const [brokerId, setBrokerId] = useState("201");
  const [exchangeId, setExchangeId] = useState("1");
  const [orderSide, setOrderSide] = useState<OrderSide>("BUY");
  const [orderMode, setOrderMode] = useState<BuyOrderMode>("MARKET");
  const [orderSymbol, setOrderSymbol] = useState("AAPL");
  const [stockId, setStockId] = useState("1");
  const [orderQuantity, setOrderQuantity] = useState("1");
  const [estimatedUnitPrice, setEstimatedUnitPrice] = useState("250");
  const [limitPrice, setLimitPrice] = useState("240");
  const [marketEvaluatedAt, setMarketEvaluatedAt] = useState("");
  const [grossAmount, setGrossAmount] = useState("750");
  const [createdOrder, setCreatedOrder] = useState<TradingOrderResponse | null>(
    null,
  );
  const [orderError, setOrderError] = useState("");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [validation, setValidation] = useState<FundsValidationResponse | null>(
    null,
  );
  const [validationError, setValidationError] = useState("");
  const [isValidatingFunds, setIsValidatingFunds] = useState(false);
  const [holdingsValidation, setHoldingsValidation] =
    useState<HoldingsValidationResponse | null>(null);
  const [holdingsValidationError, setHoldingsValidationError] = useState("");
  const [isValidatingHoldings, setIsValidatingHoldings] = useState(false);
  const [marketValidation, setMarketValidation] =
    useState<MarketValidationResponse | null>(null);
  const [marketValidationError, setMarketValidationError] = useState("");
  const [isValidatingMarket, setIsValidatingMarket] = useState(false);
  const [commissionCalculation, setCommissionCalculation] =
    useState<CommissionCalculationResponse | null>(null);
  const [commissionError, setCommissionError] = useState("");
  const [isCalculatingCommission, setIsCalculatingCommission] = useState(false);
  const [commissionDistribution, setCommissionDistribution] =
    useState<CommissionDistributionResponse | null>(null);
  const [commissionDistributionError, setCommissionDistributionError] =
    useState("");
  const [isDistributingCommission, setIsDistributingCommission] =
    useState(false);
  const [orderReference, setOrderReference] = useState("order-reference");
  const [orderStatus, setOrderStatus] = useState<OrderStatusResponse | null>(
    null,
  );
  const [orderStatusHistory, setOrderStatusHistory] = useState<
    OrderStatusHistoryEntryResponse[]
  >([]);
  const [orderStatusError, setOrderStatusError] = useState("");
  const [isLoadingOrderStatus, setIsLoadingOrderStatus] = useState(false);

  const quantity = Number(orderQuantity);
  const activePrice =
    orderMode === "MARKET" ? Number(estimatedUnitPrice) : Number(limitPrice);
  const estimatedGrossAmount =
    Number.isFinite(quantity) && Number.isFinite(activePrice)
      ? quantity * activePrice
      : 0;
  const nextStatus =
    orderSide === "SELL" && orderMode === "MARKET"
      ? "Pending execution"
      : "Pending condition";

  const handleOrderSideChange = (nextSide: OrderSide) => {
    setOrderSide(nextSide);
    if (
      nextSide === "BUY" &&
      (orderMode === "STOP_LOSS" || orderMode === "TAKE_PROFIT")
    ) {
      setOrderMode("MARKET");
    }
  };

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

  const handleValidateHoldings = async () => {
    setHoldingsValidation(null);
    setHoldingsValidationError("");

    if (
      !traderId.trim() ||
      !stockId.trim() ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      setHoldingsValidationError(
        "Enter a valid trader, stock and sell quantity.",
      );
      return;
    }

    setIsValidatingHoldings(true);
    try {
      const result = await validateSellHoldings({
        traderId: traderId.trim(),
        stockId: stockId.trim(),
        symbol: orderSymbol.trim().toUpperCase() || undefined,
        quantity,
      });
      setHoldingsValidation(result);
    } catch (error) {
      setHoldingsValidationError(
        error instanceof Error
          ? error.message
          : "Unable to validate available holdings.",
      );
    } finally {
      setIsValidatingHoldings(false);
    }
  };

  const handleCalculateCommission = async () => {
    setCommissionCalculation(null);
    setCommissionError("");
    setCommissionDistribution(null);
    setCommissionDistributionError("");

    if (
      !traderId.trim() ||
      !Number.isFinite(estimatedGrossAmount) ||
      estimatedGrossAmount <= 0
    ) {
      setCommissionError("Enter a valid trader, quantity and price.");
      return;
    }

    setIsCalculatingCommission(true);
    try {
      const result = await calculateCommission({
        traderId: traderId.trim(),
        side: orderSide,
        orderType: orderMode,
        grossAmount: estimatedGrossAmount,
      });
      setCommissionCalculation(result);
    } catch (error) {
      setCommissionError(
        error instanceof Error
          ? error.message
          : "Unable to calculate operation commission.",
      );
    } finally {
      setIsCalculatingCommission(false);
    }
  };

  const handleDistributeCommission = async () => {
    setCommissionDistribution(null);
    setCommissionDistributionError("");

    if (!traderId.trim() || !brokerId.trim()) {
      setCommissionDistributionError("Enter a valid trader and broker.");
      return;
    }
    if (!commissionCalculation) {
      setCommissionDistributionError("Calculate the commission first.");
      return;
    }

    setIsDistributingCommission(true);
    try {
      const result = await distributeCommission({
        traderId: traderId.trim(),
        brokerId: brokerId.trim(),
        commissionAmount: commissionCalculation.commissionAmount,
      });
      setCommissionDistribution(result);
    } catch (error) {
      setCommissionDistributionError(
        error instanceof Error
          ? error.message
          : "Unable to distribute operation commission.",
      );
    } finally {
      setIsDistributingCommission(false);
    }
  };

  const handleLoadOrderStatus = async () => {
    setOrderStatus(null);
    setOrderStatusHistory([]);
    setOrderStatusError("");

    if (!orderReference.trim()) {
      setOrderStatusError("Enter an order reference.");
      return;
    }

    setIsLoadingOrderStatus(true);
    try {
      const normalizedReference = orderReference.trim();
      const [status, history] = await Promise.all([
        getOrderStatus(normalizedReference),
        getOrderStatusHistory(normalizedReference),
      ]);
      setOrderStatus(status);
      setOrderStatusHistory(history);
    } catch (error) {
      setOrderStatusError(
        error instanceof Error ? error.message : "Unable to load order status.",
      );
    } finally {
      setIsLoadingOrderStatus(false);
    }
  };

  const handleCreateBuyOrder = async () => {
    setCreatedOrder(null);
    setOrderError("");

    if (
      !traderId.trim() ||
      !exchangeId.trim() ||
      (orderSide === "SELL" && !stockId.trim()) ||
      !orderSymbol.trim() ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(activePrice) ||
      activePrice <= 0
    ) {
      setOrderError("Enter a valid trader, market, symbol, quantity and price.");
      return;
    }

    setIsCreatingOrder(true);
    try {
      const commonPayload = {
        traderId: traderId.trim(),
        symbol: orderSymbol.trim().toUpperCase(),
        exchangeId: exchangeId.trim(),
        quantity,
      };
      const order =
        orderSide === "SELL" && orderMode === "MARKET"
          ? await createMarketSellOrder({
              ...commonPayload,
              stockId: stockId.trim(),
              estimatedUnitPrice: activePrice,
              marketEvaluatedAt: marketEvaluatedAt.trim() || undefined,
            })
          : orderSide === "SELL" && orderMode === "LIMIT"
            ? await createLimitSellOrder({
                ...commonPayload,
                stockId: stockId.trim(),
                limitPrice: activePrice,
              })
          : orderSide === "SELL"
            ? orderMode === "STOP_LOSS"
              ? await createStopLossOrder({
                  ...commonPayload,
                  stockId: stockId.trim(),
                  stopPrice: activePrice,
                })
              : await createTakeProfitOrder({
                  ...commonPayload,
                  stockId: stockId.trim(),
                  targetPrice: activePrice,
                })
          : orderMode === "MARKET"
          ? await createMarketBuyOrder({
              ...commonPayload,
              estimatedUnitPrice: activePrice,
              marketEvaluatedAt: marketEvaluatedAt.trim() || undefined,
            })
          : await createLimitBuyOrder({
              ...commonPayload,
              limitPrice: activePrice,
            });
      setCreatedOrder(order);
      setOrderReference(order.orderReference);
    } catch (error) {
      setOrderError(
        error instanceof Error
          ? error.message
          : "Unable to create buy order.",
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
                Create buy and sell orders with the validations required before
                execution.
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
                  <h2>{orderSide === "BUY" ? "Buy order" : "Sell order"}</h2>
                  <p>Market orders wait for execution; limits wait for price.</p>
                </div>
              </div>

              <div className="trader-order-mode" aria-label="Order side">
                <button
                  type="button"
                  className={orderSide === "BUY" ? "active" : ""}
                  onClick={() => handleOrderSideChange("BUY")}
                >
                  Buy
                </button>
                <button
                  type="button"
                  className={orderSide === "SELL" ? "active" : ""}
                  onClick={() => handleOrderSideChange("SELL")}
                >
                  Sell
                </button>
              </div>

              <div className="trader-order-mode" aria-label="Order type">
                <button
                  type="button"
                  className={orderMode === "MARKET" ? "active" : ""}
                  onClick={() => setOrderMode("MARKET")}
                >
                  Market
                </button>
                <button
                  type="button"
                  className={orderMode === "LIMIT" ? "active" : ""}
                  onClick={() => setOrderMode("LIMIT")}
                >
                  Limit
                </button>
                {orderSide === "SELL" && (
                  <>
                    <button
                      type="button"
                      className={orderMode === "STOP_LOSS" ? "active" : ""}
                      onClick={() => setOrderMode("STOP_LOSS")}
                    >
                      Stop loss
                    </button>
                    <button
                      type="button"
                      className={orderMode === "TAKE_PROFIT" ? "active" : ""}
                      onClick={() => setOrderMode("TAKE_PROFIT")}
                    >
                      Take profit
                    </button>
                  </>
                )}
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
                {orderMode === "MARKET" && (
                  <IonItem>
                    <IonLabel position="stacked">Market evaluation time</IonLabel>
                    <IonInput
                      placeholder="Optional ISO timestamp"
                      value={marketEvaluatedAt}
                      onIonInput={(event) =>
                        setMarketEvaluatedAt(String(event.detail.value ?? ""))
                      }
                    />
                  </IonItem>
                )}
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
                  <IonLabel position="stacked">Stock</IonLabel>
                  <IonInput
                    value={stockId}
                    onIonInput={(event) =>
                      setStockId(String(event.detail.value ?? ""))
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
                  <IonLabel position="stacked">
                    {orderMode === "MARKET"
                      ? "Estimated price"
                      : orderMode === "STOP_LOSS"
                        ? "Stop price"
                        : orderMode === "TAKE_PROFIT"
                          ? "Target price"
                        : "Limit price"}
                  </IonLabel>
                  <IonInput
                    type="number"
                    min="0"
                    value={
                      orderMode === "MARKET" ? estimatedUnitPrice : limitPrice
                    }
                    onIonInput={(event) =>
                      orderMode === "MARKET"
                        ? setEstimatedUnitPrice(String(event.detail.value ?? ""))
                        : setLimitPrice(String(event.detail.value ?? ""))
                    }
                  />
                </IonItem>
              </div>

              <div className="trader-order-summary">
                <div>
                  <span>Estimated amount</span>
                  <strong>
                    {moneyFormatter.format(Math.max(estimatedGrossAmount, 0))}
                  </strong>
                </div>
                <div>
                  <span>Order type</span>
                  <strong>
                    {orderSide === "SELL"
                      ? orderMode === "MARKET"
                        ? "Market sell"
                        : orderMode === "STOP_LOSS"
                          ? "Stop loss"
                          : orderMode === "TAKE_PROFIT"
                            ? "Take profit"
                          : "Limit sell"
                      : orderMode === "MARKET"
                        ? "Market buy"
                        : "Limit buy"}
                  </strong>
                </div>
                <div>
                  <span>Next status</span>
                  <strong>{nextStatus}</strong>
                </div>
              </div>

              <IonButton
                expand="block"
                className="trader-primary-button"
                onClick={handleCreateBuyOrder}
                disabled={isCreatingOrder}
              >
                {isCreatingOrder
                  ? "Creating"
                  : `Create ${orderMode.toLowerCase()} ${orderSide.toLowerCase()} order`}
              </IonButton>

              {createdOrder && (
                <p className="trader-panel-message approved">
                  Order {createdOrder.orderReference} is{" "}
                  {createdOrder.status.replaceAll("_", " ").toLowerCase()}.
                  {createdOrder.side === "BUY"
                    ? `Reserved ${createdOrder.currency} ${createdOrder.reservedAmount.toFixed(2)} for`
                    : `Prepared ${createdOrder.quantity} shares of`}{" "}
                  {createdOrder.side === "BUY"
                    ? `${createdOrder.quantity} ${createdOrder.symbol}.`
                    : `${createdOrder.symbol}.`}
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

              <section className="trader-precheck-section">
                <div className="trader-precheck-title">
                  <IonIcon icon={layersOutline} />
                  <h3>Holdings</h3>
                </div>
                <div className="trader-precheck-fields compact">
                  <IonItem>
                    <IonLabel position="stacked">Stock</IonLabel>
                    <IonInput
                      value={stockId}
                      onIonInput={(event) =>
                        setStockId(String(event.detail.value ?? ""))
                      }
                    />
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
                </div>
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={handleValidateHoldings}
                  disabled={isValidatingHoldings}
                >
                  {isValidatingHoldings
                    ? "Validating"
                    : "Validate Holdings"}
                </IonButton>
                {holdingsValidation && (
                  <p
                    className={
                      holdingsValidation.approved
                        ? "trader-panel-message approved"
                        : "trader-panel-message rejected"
                    }
                  >
                    {holdingsValidation.approved
                      ? `Sufficient holdings. ${holdingsValidation.availableQuantity} shares available.`
                      : `Operation blocked. Available: ${holdingsValidation.availableQuantity} shares.`}
                  </p>
                )}
                {holdingsValidationError && (
                  <p className="trader-panel-message rejected">
                    {holdingsValidationError}
                  </p>
                )}
              </section>

              <section className="trader-precheck-section">
                <div className="trader-precheck-title">
                  <IonIcon icon={cashOutline} />
                  <h3>Commission</h3>
                </div>
                <div className="trader-precheck-fields">
                  <IonItem>
                    <IonLabel position="stacked">Broker</IonLabel>
                    <IonInput
                      value={brokerId}
                      onIonInput={(event) =>
                        setBrokerId(String(event.detail.value ?? ""))
                      }
                    />
                  </IonItem>
                </div>
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={handleCalculateCommission}
                  disabled={isCalculatingCommission}
                >
                  {isCalculatingCommission
                    ? "Calculating"
                    : "Calculate Commission"}
                </IonButton>
                {commissionCalculation && (
                  <p className="trader-panel-message approved">
                    Commission{" "}
                    {moneyFormatter.format(
                      commissionCalculation.commissionAmount,
                    )}{" "}
                    at {commissionCalculation.rateBps} bps. Net{" "}
                    {moneyFormatter.format(commissionCalculation.netAmount)}.
                  </p>
                )}
                {commissionError && (
                  <p className="trader-panel-message rejected">
                    {commissionError}
                  </p>
                )}
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={handleDistributeCommission}
                  disabled={
                    isDistributingCommission || commissionCalculation === null
                  }
                >
                  {isDistributingCommission
                    ? "Distributing"
                    : "Distribute Commission"}
                </IonButton>
                {commissionDistribution && (
                  <p className="trader-panel-message approved">
                    Platform{" "}
                    {moneyFormatter.format(
                      commissionDistribution.platformAmount,
                    )}
                    . Broker{" "}
                    {moneyFormatter.format(commissionDistribution.brokerAmount)}
                    .
                  </p>
                )}
                {commissionDistributionError && (
                  <p className="trader-panel-message rejected">
                    {commissionDistributionError}
                  </p>
                )}
              </section>

              <section className="trader-precheck-section">
                <div className="trader-precheck-title">
                  <IonIcon icon={informationCircleOutline} />
                  <h3>Status</h3>
                </div>
                <div className="trader-precheck-fields">
                  <IonItem>
                    <IonLabel position="stacked">Order reference</IonLabel>
                    <IonInput
                      value={orderReference}
                      onIonInput={(event) =>
                        setOrderReference(String(event.detail.value ?? ""))
                      }
                    />
                  </IonItem>
                </div>
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={handleLoadOrderStatus}
                  disabled={isLoadingOrderStatus}
                >
                  {isLoadingOrderStatus ? "Loading" : "Load Status"}
                </IonButton>
                {orderStatus && (
                  <p className="trader-panel-message approved">
                    {orderStatus.symbol} {orderStatus.side.toLowerCase()} order
                    is {orderStatus.status.replaceAll("_", " ").toLowerCase()}.
                  </p>
                )}
                {orderStatusHistory.length > 0 && (
                  <p className="trader-panel-message approved">
                    {orderStatusHistory.length} status event
                    {orderStatusHistory.length === 1 ? "" : "s"} recorded.
                    Last:{" "}
                    {orderStatusHistory
                      .at(-1)
                      ?.toStatus.replaceAll("_", " ")
                      .toLowerCase()}
                    .
                  </p>
                )}
                {orderStatusError && (
                  <p className="trader-panel-message rejected">
                    {orderStatusError}
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
