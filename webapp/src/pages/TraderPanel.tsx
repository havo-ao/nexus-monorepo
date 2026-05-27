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
  paperPlaneOutline,
  pulseOutline,
  shieldCheckmarkOutline,
  ticketOutline,
} from "ionicons/icons";
import { useHistory, useLocation } from "react-router-dom";
import NavBar from "../components/NavBar";
import {
  calculateCommission,
  cancelOrder,
  createLimitBuyOrder,
  createLimitSellOrder,
  createMarketBuyOrder,
  createMarketSellOrder,
  createStopLossOrder,
  createTakeProfitOrder,
  distributeCommission,
  getOrderStatus,
  getOrderStatusHistory,
  sendOrderToBroker,
  syncOrderSettlement,
  validateOrderByBroker,
  validateBuyFunds,
  validateSellHoldings,
  validateMarketStatus,
  type BrokerExecutionResponse,
  type BrokerOrderValidationResponse,
  type CommissionCalculationResponse,
  type CommissionDistributionResponse,
  type FundsValidationResponse,
  type HoldingsValidationResponse,
  type MarketValidationResponse,
  type OrderSettlementResponse,
  type OrderStatusHistoryEntryResponse,
  type OrderStatusResponse,
  type CancelOrderResponse,
  type TradingOrderResponse,
} from "../api/trading";
import type { UserProfile } from "../api/types";
import { formatUserDisplayName, getStoredUser } from "../auth/storage";
import "./TraderPanel.css";

type BuyOrderMode = "MARKET" | "LIMIT" | "STOP_LOSS" | "TAKE_PROFIT";
type OrderSide = "BUY" | "SELL";
type WorkflowStepStatus = "ready" | "active" | "done";

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
  const [cancelledOrder, setCancelledOrder] =
    useState<CancelOrderResponse | null>(null);
  const [orderStatusError, setOrderStatusError] = useState("");
  const [isLoadingOrderStatus, setIsLoadingOrderStatus] = useState(false);
  const [brokerValidation, setBrokerValidation] =
    useState<BrokerOrderValidationResponse | null>(null);
  const [brokerValidationError, setBrokerValidationError] = useState("");
  const [isValidatingBrokerOrder, setIsValidatingBrokerOrder] = useState(false);
  const [brokerExecution, setBrokerExecution] =
    useState<BrokerExecutionResponse | null>(null);
  const [brokerExecutionError, setBrokerExecutionError] = useState("");
  const [isSendingToBroker, setIsSendingToBroker] = useState(false);
  const [settlement, setSettlement] = useState<OrderSettlementResponse | null>(
    null,
  );
  const [settlementError, setSettlementError] = useState("");
  const [isSyncingSettlement, setIsSyncingSettlement] = useState(false);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(1);

  const quantity = Number(orderQuantity);
  const activePrice =
    orderMode === "MARKET" ? Number(estimatedUnitPrice) : Number(limitPrice);
  const estimatedGrossAmount =
    Number.isFinite(quantity) && Number.isFinite(activePrice)
      ? quantity * activePrice
      : 0;
  const nextStatus =
    orderMode === "MARKET" ? "Pending execution" : "Pending condition";
  const currentOrderStatus =
    brokerExecution?.status ?? orderStatus?.status ?? createdOrder?.status;
  const currentOrderReference =
    brokerExecution?.orderReference ??
    orderStatus?.orderReference ??
    createdOrder?.orderReference ??
    orderReference;
  const hasValidationEvidence = Boolean(
    validation ||
      holdingsValidation ||
      marketValidation ||
      commissionCalculation ||
      commissionDistribution,
  );
  const isBrokerApproved = brokerValidation?.decision === "APPROVE";
  const isOrderSentToBroker = brokerExecution?.status === "SENT_TO_BROKER";
  const isSettlementSynced = Boolean(settlement);
  const isOrderExecuted = settlement?.status === "EXECUTED";
  const hasTrackingEvidence = Boolean(
    orderStatus || orderStatusHistory.length > 0 || cancelledOrder,
  );
  const isTicketConfigured = Boolean(
    traderId.trim() &&
      exchangeId.trim() &&
      orderSymbol.trim() &&
      Number.isFinite(quantity) &&
      quantity > 0 &&
      Number.isFinite(activePrice) &&
      activePrice > 0,
  );
  const workflowSteps = [
    ["1", "Checks", "Funds, market and fees"],
    ["2", "Order Details", "Configure ticket"],
    ["3", "Create", "Submit order"],
    ["4", "Review", "Broker decision"],
    ["5", "Execute", "Alpaca and settlement"],
    ["6", "Monitor", "Status and audit trail"],
  ];

  const getWorkflowStepStatus = (step: number): WorkflowStepStatus => {
    if (activeWorkflowStep === step) {
      return "active";
    }
    if (step === 1) {
      return hasValidationEvidence ? "done" : "ready";
    }
    if (step === 2) {
      return isTicketConfigured ? "done" : "ready";
    }
    if (step === 3) {
      return createdOrder ? "done" : "ready";
    }
    if (step === 4) {
      return isBrokerApproved ? "done" : "ready";
    }
    if (step === 5) {
      return isOrderSentToBroker || isSettlementSynced ? "done" : "ready";
    }
    return isOrderExecuted || hasTrackingEvidence ? "done" : "ready";
  };

  const getWorkflowStepLabel = (status: WorkflowStepStatus): string => {
    if (status === "done") {
      return "Done";
    }
    if (status === "active") {
      return "Current";
    }
    return "Ready";
  };

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
      setActiveWorkflowStep(1);
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
      setActiveWorkflowStep(1);
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
      setActiveWorkflowStep(1);
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
      setActiveWorkflowStep(1);
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
      setActiveWorkflowStep(1);
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
    setCancelledOrder(null);
    setBrokerExecution(null);
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
      setActiveWorkflowStep(6);
    } catch (error) {
      setOrderStatusError(
        error instanceof Error ? error.message : "Unable to load order status.",
      );
    } finally {
      setIsLoadingOrderStatus(false);
    }
  };

  const handleBrokerValidation = async (decision: "APPROVE" | "REJECT") => {
    setBrokerValidation(null);
    setBrokerValidationError("");

    if (!orderReference.trim() || !brokerId.trim()) {
      setBrokerValidationError("Enter a valid order reference and broker.");
      return;
    }

    setIsValidatingBrokerOrder(true);
    try {
      const result = await validateOrderByBroker(orderReference.trim(), {
        brokerId: brokerId.trim(),
        decision,
        reason:
          decision === "APPROVE"
            ? "Order reviewed by assigned broker."
            : "Order rejected by assigned broker.",
      });
      setBrokerValidation(result);
      setOrderStatus(null);
      setOrderStatusHistory([]);
      setBrokerExecution(null);
      setActiveWorkflowStep(decision === "APPROVE" ? 5 : 6);
    } catch (error) {
      setBrokerValidationError(
        error instanceof Error
          ? error.message
          : "Unable to validate order by broker.",
      );
    } finally {
      setIsValidatingBrokerOrder(false);
    }
  };

  const handleSendOrderToBroker = async () => {
    setBrokerExecution(null);
    setBrokerExecutionError("");
    setSettlement(null);
    setSettlementError("");
    setCancelledOrder(null);

    if (!orderReference.trim()) {
      setBrokerExecutionError("Enter an order reference.");
      return;
    }

    setIsSendingToBroker(true);
    try {
      const normalizedReference = orderReference.trim();
      const result = await sendOrderToBroker(normalizedReference);
      const [status, history] = await Promise.all([
        getOrderStatus(normalizedReference),
        getOrderStatusHistory(normalizedReference),
      ]);
      setBrokerExecution(result);
      setOrderStatus(status);
      setOrderStatusHistory(history);
      setCreatedOrder((current) =>
        current && current.orderReference === result.orderReference
          ? { ...current, status: result.status }
          : current,
      );
      setActiveWorkflowStep(5);
    } catch (error) {
      setBrokerExecutionError(
        error instanceof Error
          ? error.message
          : "Unable to send order to broker.",
      );
    } finally {
      setIsSendingToBroker(false);
    }
  };

  const handleSyncSettlement = async () => {
    setSettlement(null);
    setSettlementError("");

    if (!orderReference.trim()) {
      setSettlementError("Enter an order reference.");
      return;
    }

    setIsSyncingSettlement(true);
    try {
      const normalizedReference = orderReference.trim();
      const result = await syncOrderSettlement(normalizedReference, {
        actorId: brokerId.trim() || undefined,
        notificationRecipient: user
          ? {
              email: user.email,
              name: user.name,
              surname: user.surname,
              username: user.username,
            }
          : undefined,
      });
      const [status, history] = await Promise.all([
        getOrderStatus(normalizedReference),
        getOrderStatusHistory(normalizedReference),
      ]);
      setSettlement(result);
      setOrderStatus(status);
      setOrderStatusHistory(history);
      setCreatedOrder((current) =>
        current && current.orderReference === result.orderReference
          ? { ...current, status: result.status }
          : current,
      );
      setActiveWorkflowStep(6);
    } catch (error) {
      setSettlementError(
        error instanceof Error
          ? error.message
          : "Unable to synchronize settlement.",
      );
    } finally {
      setIsSyncingSettlement(false);
    }
  };

  const handleCancelOrder = async () => {
    setCancelledOrder(null);
    setOrderStatusError("");
    setBrokerExecution(null);

    if (!orderReference.trim() || !traderId.trim()) {
      setOrderStatusError("Enter an order reference and trader.");
      return;
    }

    setIsCancellingOrder(true);
    try {
      const result = await cancelOrder(orderReference.trim(), {
        actorId: traderId.trim(),
      });
      setCancelledOrder(result);
      setActiveWorkflowStep(6);
      setOrderStatus((current) =>
        current
          ? {
              ...current,
              status: result.currentStatus,
              reservedAmount: Math.max(
                current.reservedAmount - result.releasedAmount,
                0,
              ),
            }
          : current,
      );
    } catch (error) {
      setOrderStatusError(
        error instanceof Error ? error.message : "Unable to cancel order.",
      );
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const handleCreateBuyOrder = async () => {
    setCreatedOrder(null);
    setOrderError("");
    setBrokerExecution(null);
    setBrokerExecutionError("");

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
              stockId: stockId.trim() || undefined,
              estimatedUnitPrice: activePrice,
              marketEvaluatedAt: marketEvaluatedAt.trim() || undefined,
            })
          : await createLimitBuyOrder({
              ...commonPayload,
              stockId: stockId.trim() || undefined,
              limitPrice: activePrice,
            });
      setCreatedOrder(order);
      setOrderReference(order.orderReference);
      setOrderStatus(null);
      setOrderStatusHistory([]);
      setBrokerValidation(null);
      setActiveWorkflowStep(4);
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
              <h1>Trading desk</h1>
              <p>
                Create an order, collect validation evidence, route it to
                Alpaca, settle the result and review the audit trail.
              </p>
            </div>
            <div className="trader-panel-actions">
              <button
                type="button"
                className="trader-panel-secondary-action"
                onClick={() => history.push("/markets")}
              >
                Market
              </button>
              <button
                type="button"
                className="trader-panel-secondary-action"
                onClick={() => history.push("/portfolio")}
              >
                Portfolio
              </button>
            </div>
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
            <div>
              <span>External broker</span>
              <strong>{brokerExecution?.brokerName ?? "Alpaca"}</strong>
            </div>
          </section>

          <section className="trader-execution-summary" aria-label="Current order summary">
            <div className="trader-execution-reference">
              <IonItem>
                <IonLabel position="stacked">Order reference</IonLabel>
                <IonInput
                  value={orderReference}
                  onIonInput={(event) =>
                    setOrderReference(String(event.detail.value ?? ""))
                  }
                />
              </IonItem>
              <p className="trader-panel-note">
                {currentOrderStatus
                  ? `Status: ${currentOrderStatus.replaceAll("_", " ").toLowerCase()}`
                  : "Create an order or paste a reference to continue."}
              </p>
            </div>
            <div className="trader-dashboard-metrics">
              <div>
                <span>Step</span>
                <strong>
                  {workflowSteps[activeWorkflowStep - 1]?.[1] ?? "Ticket"}
                </strong>
              </div>
              <div>
                <span>Order state</span>
                <strong>
                  {currentOrderStatus
                    ? currentOrderStatus.replaceAll("_", " ")
                    : "NOT STARTED"}
                </strong>
              </div>
              <div>
                <span>Broker</span>
                <strong>
                  {brokerExecution?.brokerName ??
                    brokerValidation?.brokerId ??
                    "Pending"}
                </strong>
              </div>
              <div>
                <span>Settlement</span>
                <strong>
                  {settlement
                    ? settlement.status.replaceAll("_", " ")
                    : "PENDING"}
                </strong>
              </div>
            </div>
          </section>

          <section className="trader-workflow-rail" aria-label="Trading steps">
            {workflowSteps.map(([step, title, detail]) => {
              const status = getWorkflowStepStatus(Number(step));
              return (
                <button
                  className={`trader-workflow-step ${status}`}
                  key={step}
                  onClick={() => setActiveWorkflowStep(Number(step))}
                  type="button"
                >
                  <span>{step}</span>
                  <div>
                    <strong>{title}</strong>
                    <small>{detail}</small>
                  </div>
                  <em>{getWorkflowStepLabel(status)}</em>
                </button>
              );
            })}
          </section>

          <section className="trader-panel-grid single">
            {activeWorkflowStep === 2 && (
              <article className="trader-order-ticket">
              <div className="trader-panel-section-heading">
                <span>
                  <IonIcon icon={ticketOutline} />
                </span>
                <div>
                  <h2>Order ticket</h2>
                  <p>
                    {orderSide === "BUY" ? "Buy order" : "Sell order"} ·{" "}
                    {nextStatus}
                  </p>
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

              <div className="trader-step-navigation">
                <IonButton
                  fill="outline"
                  onClick={() => setActiveWorkflowStep(1)}
                >
                  Previous
                </IonButton>
                <IonButton onClick={() => setActiveWorkflowStep(3)}>
                  Next
                </IonButton>
              </div>
              </article>
            )}

            {activeWorkflowStep !== 2 && (
            <article
              className={`trader-precheck-panel trader-step-panel step-${activeWorkflowStep}`}
            >
              <div className="trader-panel-section-heading">
                <span>
                  <IonIcon
                    icon={
                      activeWorkflowStep === 1
                        ? checkmarkCircleOutline
                        : activeWorkflowStep === 3
                          ? ticketOutline
                          : activeWorkflowStep === 4
                            ? shieldCheckmarkOutline
                            : activeWorkflowStep === 5
                              ? paperPlaneOutline
                              : informationCircleOutline
                    }
                  />
                </span>
                <div>
                  <h2>{workflowSteps[activeWorkflowStep - 1]?.[1]}</h2>
                  <p>{workflowSteps[activeWorkflowStep - 1]?.[2]}</p>
                </div>
              </div>

              {activeWorkflowStep === 1 && (
                <>
              <section className="trader-precheck-section">
                <div className="trader-precheck-title">
                  <IonIcon icon={cashOutline} />
                  <h3>Funds reservation</h3>
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
                <div className="trader-card-actions">
                  <IonButton
                    fill="outline"
                    onClick={handleValidateFunds}
                    disabled={isValidatingFunds}
                  >
                    {isValidatingFunds ? "Validating" : "Validate Funds"}
                  </IonButton>
                </div>
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
                  <h3>Market availability</h3>
                </div>
                <div className="trader-card-actions">
                  <IonButton
                    fill="outline"
                    onClick={handleValidateMarket}
                    disabled={isValidatingMarket}
                  >
                    {isValidatingMarket ? "Validating" : "Validate Market"}
                  </IonButton>
                </div>
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
                  <h3>Holdings check</h3>
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
                <div className="trader-card-actions">
                  <IonButton
                    fill="outline"
                    onClick={handleValidateHoldings}
                    disabled={isValidatingHoldings}
                  >
                    {isValidatingHoldings
                      ? "Validating"
                      : "Validate Holdings"}
                  </IonButton>
                </div>
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
                  <h3>Commission evidence</h3>
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
                <div className="trader-card-actions">
                  <IonButton
                    fill="outline"
                    onClick={handleCalculateCommission}
                    disabled={isCalculatingCommission}
                  >
                    {isCalculatingCommission
                      ? "Calculating"
                      : "Calculate Commission"}
                  </IonButton>
                  <IonButton
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
                </div>
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
                </>
              )}

              {activeWorkflowStep === 3 && (
                <section className="trader-precheck-section wide">
                <div className="trader-precheck-title">
                  <IonIcon icon={ticketOutline} />
                  <h3>Order preview</h3>
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
                  <div>
                    <span>Reference</span>
                    <strong>{currentOrderReference || "No order selected"}</strong>
                  </div>
                </div>
                <div className="trader-card-actions">
                  <IonButton
                    className="trader-primary-button"
                    onClick={handleCreateBuyOrder}
                    disabled={isCreatingOrder}
                  >
                    {isCreatingOrder
                      ? "Creating"
                      : `Create ${orderMode.toLowerCase()} ${orderSide.toLowerCase()} order`}
                  </IonButton>
                </div>
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
                    {createdOrder.status === "PENDING_EXECUTION"
                      ? " It is ready for broker review."
                      : ""}
                  </p>
                )}
                {orderError && (
                  <p className="trader-panel-message rejected">{orderError}</p>
                )}
              </section>
              )}

              {activeWorkflowStep === 4 && (
                <section className="trader-precheck-section">
                <div className="trader-precheck-title">
                  <IonIcon icon={shieldCheckmarkOutline} />
                  <h3>Broker review</h3>
                </div>
                <div className="trader-precheck-fields compact">
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
                <div className="trader-broker-actions">
                  <IonButton
                    fill="outline"
                    onClick={() => void handleBrokerValidation("APPROVE")}
                    disabled={isValidatingBrokerOrder}
                  >
                    {isValidatingBrokerOrder ? "Validating" : "Approve Order"}
                  </IonButton>
                  <IonButton
                    fill="outline"
                    color="danger"
                    onClick={() => void handleBrokerValidation("REJECT")}
                    disabled={isValidatingBrokerOrder}
                  >
                    Reject Order
                  </IonButton>
                </div>
                {brokerValidation && (
                  <p
                    className={
                      brokerValidation.decision === "APPROVE"
                        ? "trader-panel-message approved"
                        : "trader-panel-message rejected"
                    }
                  >
                    Broker {brokerValidation.brokerId}{" "}
                    {brokerValidation.decision === "APPROVE"
                      ? "approved"
                      : "rejected"}{" "}
                    order{" "}
                    {brokerValidation.orderReference}. Status{" "}
                    {brokerValidation.status.replaceAll("_", " ").toLowerCase()}
                    .
                  </p>
                )}
                {brokerValidationError && (
                  <p className="trader-panel-message rejected">
                    {brokerValidationError}
                  </p>
                )}
              </section>
              )}

              {activeWorkflowStep === 5 && (
                <>
                <section className="trader-precheck-section">
                <div className="trader-precheck-title">
                  <IonIcon icon={paperPlaneOutline} />
                  <h3>External execution</h3>
                </div>
                <div className="trader-card-actions">
                  <IonButton
                    fill="outline"
                    onClick={handleSendOrderToBroker}
                    disabled={isSendingToBroker}
                  >
                    {isSendingToBroker ? "Sending to Broker" : "Send to Broker"}
                  </IonButton>
                </div>
                {brokerExecution && (
                  <div
                    className={
                      brokerExecution.status === "SENT_TO_BROKER"
                        ? "trader-panel-message approved"
                        : "trader-panel-message rejected"
                    }
                  >
                    <strong>
                      {brokerExecution.brokerName}{" "}
                      {brokerExecution.brokerStatus.toLowerCase()}
                    </strong>
                    <span>
                      {brokerExecution.symbol}{" "}
                      {brokerExecution.side.toLowerCase()}{" "}
                      {brokerExecution.quantity} share
                      {brokerExecution.quantity === 1 ? "" : "s"}.
                    </span>
                    <span>
                      External order {brokerExecution.externalOrderId}.
                    </span>
                  </div>
                )}
                {brokerExecutionError && (
                  <p className="trader-panel-message rejected">
                    {brokerExecutionError}
                  </p>
                )}
              </section>

              <section className="trader-precheck-section">
                <div className="trader-precheck-title">
                  <IonIcon icon={layersOutline} />
                  <h3>Settlement</h3>
                </div>
                <div className="trader-card-actions">
                  <IonButton
                    fill="outline"
                    onClick={handleSyncSettlement}
                    disabled={isSyncingSettlement}
                  >
                    {isSyncingSettlement
                      ? "Syncing Settlement"
                      : "Sync Broker Settlement"}
                  </IonButton>
                </div>
                {settlement && (
                  <div
                    className={
                      settlement.status === "EXECUTED"
                        ? "trader-panel-message approved"
                        : "trader-panel-message rejected"
                    }
                  >
                    <strong>
                      {settlement.brokerName}{" "}
                      {settlement.brokerStatus.toLowerCase()}
                    </strong>
                    <span>
                      {settlement.status === "EXECUTED"
                        ? `Settled ${settlement.filledQuantity} ${settlement.symbol} share${settlement.filledQuantity === 1 ? "" : "s"}.`
                        : `Internal status: ${settlement.status.replaceAll("_", " ").toLowerCase()}.`}
                    </span>
                    <span>
                      Net amount {moneyFormatter.format(settlement.netAmount)} ·
                      Commission{" "}
                      {moneyFormatter.format(settlement.commissionAmount)}.
                    </span>
                    <span>
                      Portfolio {settlement.portfolioUpdated ? "updated" : "not updated"} ·
                      Funds {settlement.fundsUpdated ? "updated" : "not updated"} ·
                      Notification{" "}
                      {settlement.notificationDelivered ? "sent" : "not sent"}.
                    </span>
                  </div>
                )}
                {settlementError && (
                  <p className="trader-panel-message rejected">
                    {settlementError}
                  </p>
                )}
              </section>
                </>
              )}

              {activeWorkflowStep === 6 && (
                <section className="trader-precheck-section">
                <div className="trader-precheck-title">
                  <IonIcon icon={informationCircleOutline} />
                  <h3>Monitoring</h3>
                </div>
                <div className="trader-card-actions">
                  <IonButton
                    fill="outline"
                    onClick={handleLoadOrderStatus}
                    disabled={isLoadingOrderStatus}
                  >
                    {isLoadingOrderStatus ? "Loading" : "Load Status"}
                  </IonButton>
                  <IonButton
                    fill="outline"
                    onClick={handleCancelOrder}
                    disabled={isCancellingOrder}
                  >
                    {isCancellingOrder ? "Cancelling" : "Cancel Order"}
                  </IonButton>
                </div>
                {orderStatus && (
                  <p className="trader-panel-message approved">
                    {orderStatus.symbol} {orderStatus.side.toLowerCase()} order
                    is {orderStatus.status.replaceAll("_", " ").toLowerCase()}.
                  </p>
                )}
                {cancelledOrder && (
                  <p className="trader-panel-message approved">
                    Order {cancelledOrder.orderReference} was cancelled.
                    Released {moneyFormatter.format(cancelledOrder.releasedAmount)}.
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
              )}

              <div className="trader-step-navigation">
                <IonButton
                  fill="outline"
                  onClick={() =>
                    setActiveWorkflowStep((current) => Math.max(current - 1, 1))
                  }
                  disabled={activeWorkflowStep === 1}
                >
                  Previous
                </IonButton>
                <IonButton
                  onClick={() =>
                    setActiveWorkflowStep((current) => Math.min(current + 1, 6))
                  }
                  disabled={activeWorkflowStep === 6}
                >
                  Next
                </IonButton>
              </div>
            </article>
            )}
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default TraderPanel;
