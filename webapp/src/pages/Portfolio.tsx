import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner,
} from "@ionic/react";
import {
  alertCircleOutline,
  arrowDownOutline,
  arrowUpOutline,
  briefcaseOutline,
  cashOutline,
  closeOutline,
  documentsOutline,
  layersOutline,
  pieChartOutline,
  refreshOutline,
  storefrontOutline,
  swapVerticalOutline,
  trendingUpOutline,
  walletOutline,
} from "ionicons/icons";
import { useHistory, useLocation } from "react-router-dom";
import NavBar from "../components/NavBar";
import {
  getPortfolioPosition,
  getPortfolioSummary,
  getSectorDistribution,
  getWalletBalance,
  getWalletHistory,
  recordDeposit,
  recordWithdrawal,
  type PortfolioPosition,
  type PortfolioSectorDistribution,
  type PortfolioSummary,
  type WalletBalance,
  type WalletHistory,
  type WalletMovement,
} from "../api/portfolio";
import { getStoredUser } from "../auth/storage";
import "./Portfolio.css";

type FundsMode = "deposit" | "withdrawal";
type PortfolioView = "overview" | "positions" | "cash";

type PortfolioState = {
  summary: PortfolioSummary | null;
  balance: WalletBalance | null;
  history: WalletHistory | null;
  distribution: PortfolioSectorDistribution | null;
};

const emptyPortfolioState: PortfolioState = {
  summary: null,
  balance: null,
  history: null,
  distribution: null,
};

function formatCurrency(value: number | null | undefined, currency = "USD") {
  if (value === null || value === undefined) {
    return "Pending";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Pending";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatMovementDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function resolveCurrency(balance: WalletBalance | null) {
  return balance?.currency ?? "USD";
}

function getRequestErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function resolvePositionName(position: PortfolioPosition): string {
  return position.symbol ?? `Stock ${position.stockId}`;
}

const Portfolio: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [portfolio, setPortfolio] = useState<PortfolioState>(emptyPortfolioState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingFunds, setIsSubmittingFunds] = useState(false);
  const [error, setError] = useState("");
  const [positionError, setPositionError] = useState("");
  const [fundsMessage, setFundsMessage] = useState("");
  const [fundsMode, setFundsMode] = useState<FundsMode>("deposit");
  const [activeView, setActiveView] = useState<PortfolioView>("overview");
  const [amount, setAmount] = useState("");
  const [sourceTransactionId, setSourceTransactionId] = useState("");
  const [selectedPosition, setSelectedPosition] =
    useState<PortfolioPosition | null>(null);
  const [isLoadingPosition, setIsLoadingPosition] = useState(false);
  const [traderId, setTraderId] = useState("");

  useEffect(() => {
    const user = getStoredUser();

    if (!user) {
      history.replace("/login");
      return;
    }

    setTraderId(String(user.id));
  }, [history, location.key]);

  const loadPortfolio = useCallback(async () => {
    if (!traderId) {
      return;
    }

    setIsLoading(true);
    setError("");
    setPositionError("");

    try {
      const [summary, balance, history, distribution] = await Promise.all([
        getPortfolioSummary(traderId),
        getWalletBalance(traderId),
        getWalletHistory(traderId),
        getSectorDistribution(traderId).catch(() => null),
      ]);

      setPortfolio({ summary, balance, history, distribution });
    } catch (requestError) {
      setPortfolio(emptyPortfolioState);
      setError(
        getRequestErrorMessage(requestError, "Unable to load your portfolio."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [traderId]);

  useEffect(() => {
    if (traderId) {
      void loadPortfolio();
    }
  }, [traderId, loadPortfolio]);

  const topPositions = useMemo(
    () =>
      [...(portfolio.summary?.positions ?? [])].sort(
        (left, right) =>
          (right.currentValue ?? right.totalInvested) -
          (left.currentValue ?? left.totalInvested),
      ),
    [portfolio.summary],
  );

  const recentMovements = useMemo(
    () => (portfolio.history?.movements ?? []).slice(0, 6),
    [portfolio.history],
  );

  const handleFundsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFundsMessage("");
    setError("");

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFundsMessage("Enter a valid amount greater than zero.");
      return;
    }

    if (
      fundsMode === "withdrawal" &&
      portfolio.balance &&
      numericAmount > portfolio.balance.availableBalance
    ) {
      setFundsMessage(
        `Insufficient available balance. You can withdraw up to ${formatCurrency(
          portfolio.balance.availableBalance,
          portfolio.balance.currency,
        )}.`,
      );
      return;
    }

    setIsSubmittingFunds(true);
    try {
      const request = {
        amount: numericAmount,
        currency: resolveCurrency(portfolio.balance),
        sourceTransactionId: sourceTransactionId.trim() || undefined,
      };

      const result =
        fundsMode === "deposit"
          ? await recordDeposit(traderId, request)
          : await recordWithdrawal(traderId, request);

      setFundsMessage(
        `${result.movementType === "DEPOSIT" ? "Deposit" : "Withdrawal"} recorded. New total balance: ${formatCurrency(
          result.totalBalance,
          result.currency,
        )}.`,
      );
      setAmount("");
      setSourceTransactionId("");
      await loadPortfolio();
    } catch (requestError) {
      setFundsMessage(
        getRequestErrorMessage(requestError, "Unable to update wallet funds."),
      );
    } finally {
      setIsSubmittingFunds(false);
    }
  };

  const handleSelectPosition = async (position: PortfolioPosition) => {
    setIsLoadingPosition(true);
    setFundsMessage("");
    setPositionError("");
    setSelectedPosition(null);
    setActiveView("positions");

    try {
      const detail = await getPortfolioPosition(traderId, position.positionId);
      setSelectedPosition(detail);
    } catch (requestError) {
      setPositionError(
        getRequestErrorMessage(
          requestError,
          "Unable to load this position detail.",
        ),
      );
    } finally {
      setIsLoadingPosition(false);
    }
  };

  const handleStartSellFlow = (position: PortfolioPosition) => {
    const symbol = position.symbol?.toUpperCase();
    const pathname = symbol
      ? `/markets/NASDAQ/instruments/${encodeURIComponent(symbol)}`
      : "/markets";

    history.push({
      pathname,
      search: symbol
        ? `?action=sell&quantity=${encodeURIComponent(String(position.quantity))}`
        : "?action=sell",
      state: {
        sellIntent: {
          positionId: position.positionId,
          stockId: position.stockId,
          symbol,
          quantity: position.quantity,
        },
      },
    });
  };

  const currency = resolveCurrency(portfolio.balance);
  const invested = portfolio.summary?.totalInvested ?? 0;
  const currentValue = portfolio.summary?.currentValue ?? null;
  const profitLoss = portfolio.summary?.profitLoss ?? null;
  const returnPercentage = portfolio.summary?.returnPercentage ?? null;
  const hasCurrentValuation = currentValue !== null && currentValue !== undefined;
  const totalEquity =
    hasCurrentValuation && portfolio.balance
      ? portfolio.balance.totalBalance + currentValue
      : null;

  if (!traderId) {
    return null;
  }

  return (
    <IonPage>
      <NavBar />
      <IonContent fullscreen className="portfolio-content">
        <main className="portfolio-shell">
          <header className="portfolio-header">
            <div>
              <span className="portfolio-eyebrow">Portfolio</span>
              <h1>Control center for holdings, cash and exits</h1>
              <p>
                Consolidated positions, market valuation, sector exposure,
                wallet balance and sale initiation powered by portfolio-service.
              </p>
            </div>
            <IonButton
              className="portfolio-refresh-button"
              onClick={() => void loadPortfolio()}
              disabled={isLoading}
            >
              <IonIcon slot="start" icon={refreshOutline} />
              Refresh
            </IonButton>
          </header>

          {error && (
            <section className="portfolio-alert" role="alert">
              <IonIcon icon={alertCircleOutline} />
              <span>{error}</span>
            </section>
          )}

          <PortfolioNav activeView={activeView} onChange={setActiveView} />

          {isLoading ? (
            <section className="portfolio-loading">
              <IonSpinner name="crescent" />
              <span>Loading portfolio data</span>
            </section>
          ) : (
            <>
              <section className="portfolio-hero-grid">
                <article className="portfolio-balance-panel">
                  <div className="portfolio-panel-header">
                    <div>
                      <h2>Account Equity</h2>
                      <p>
                        {hasCurrentValuation
                          ? "Wallet balance plus current portfolio value"
                          : "Waiting for market valuation to complete"}
                      </p>
                    </div>
                    <IonIcon icon={walletOutline} />
                  </div>
                  <strong>{formatCurrency(totalEquity, currency)}</strong>
                  <div className="portfolio-balance-breakdown">
                    <span>
                      <span>Available</span>
                      <b>
                        {formatCurrency(
                          portfolio.balance?.availableBalance,
                          currency,
                        )}
                      </b>
                    </span>
                    <span>
                      <span>Reserved</span>
                      <b>
                        {formatCurrency(
                          portfolio.balance?.reservedBalance,
                          currency,
                        )}
                      </b>
                    </span>
                    <span>
                      <span>
                        {hasCurrentValuation ? "Positions" : "Cost basis"}
                      </span>
                      <b>
                        {formatCurrency(
                          hasCurrentValuation ? currentValue : invested,
                          currency,
                        )}
                      </b>
                    </span>
                  </div>
                </article>

                <MetricCard
                  label="Invested"
                  value={formatCurrency(invested, currency)}
                  helper={`${portfolio.summary?.positions.length ?? 0} open positions`}
                  icon={briefcaseOutline}
                />
                <MetricCard
                  label="Profit / Loss"
                  value={formatCurrency(profitLoss, currency)}
                  helper={
                    hasCurrentValuation
                      ? formatPercent(returnPercentage)
                      : "Pending market valuation"
                  }
                  icon={trendingUpOutline}
                  tone={(profitLoss ?? 0) >= 0 ? "positive" : "negative"}
                />
                <MetricCard
                  label="Cash Balance"
                  value={formatCurrency(portfolio.balance?.totalBalance, currency)}
                  helper="Available and reserved funds"
                  icon={cashOutline}
                />
              </section>

              {activeView === "overview" && (
                <section className="portfolio-main-grid">
                  <article className="portfolio-panel portfolio-chart-panel">
                    <div className="portfolio-panel-header">
                      <div>
                        <h2>Holdings Performance</h2>
                        <p>
                          {hasCurrentValuation
                            ? "Largest positions by current market value"
                            : "Largest positions by invested cost basis"}
                        </p>
                      </div>
                      <IonIcon icon={layersOutline} />
                    </div>
                    <PositionsChart positions={topPositions} currency={currency} />
                  </article>

                  <article className="portfolio-panel">
                    <div className="portfolio-panel-header">
                      <div>
                        <h2>Sector Allocation</h2>
                        <p>Distribution calculated by portfolio-service</p>
                      </div>
                      <IonIcon icon={swapVerticalOutline} />
                    </div>
                    <SectorAllocation
                      distribution={portfolio.distribution}
                      currency={currency}
                    />
                  </article>
                </section>
              )}

              {activeView === "positions" && (
                <section className="portfolio-workspace-grid">
                  <article className="portfolio-panel">
                    <div className="portfolio-panel-header">
                      <div>
                        <h2>Positions</h2>
                        <p>Open holdings with valuation and sale access</p>
                      </div>
                    </div>
                    <PositionsTable
                      positions={topPositions}
                      currency={currency}
                      selectedPositionId={selectedPosition?.positionId ?? ""}
                      onSelectPosition={(position) =>
                        void handleSelectPosition(position)
                      }
                    />
                  </article>

                  <PositionDetailPanel
                    position={selectedPosition}
                    currency={currency}
                    isLoading={isLoadingPosition}
                    error={positionError}
                    onStartSellFlow={handleStartSellFlow}
                    onClose={() => {
                      setSelectedPosition(null);
                      setPositionError("");
                    }}
                  />
                </section>
              )}

              {activeView === "cash" && (
                <section className="portfolio-cash-grid">
                  <article className="portfolio-panel">
                    <div className="portfolio-panel-header">
                      <div>
                        <h2>Move Funds</h2>
                        <p>Record wallet deposits or withdrawals</p>
                      </div>
                    </div>
                    <form
                      className="portfolio-funds-form"
                      onSubmit={(event) => void handleFundsSubmit(event)}
                    >
                      <div className="portfolio-segmented-control">
                        <button
                          type="button"
                          className={fundsMode === "deposit" ? "active" : ""}
                          onClick={() => setFundsMode("deposit")}
                        >
                          <IonIcon icon={arrowDownOutline} />
                          Deposit
                        </button>
                        <button
                          type="button"
                          className={fundsMode === "withdrawal" ? "active" : ""}
                          onClick={() => setFundsMode("withdrawal")}
                        >
                          <IonIcon icon={arrowUpOutline} />
                          Withdraw
                        </button>
                      </div>
                      <label>
                        <span>Amount</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={amount}
                          onChange={(event) => setAmount(event.target.value)}
                          placeholder="0.00"
                        />
                      </label>
                      <label>
                        <span>Reference</span>
                        <input
                          value={sourceTransactionId}
                          onChange={(event) =>
                            setSourceTransactionId(event.target.value)
                          }
                          placeholder="Optional transaction id"
                        />
                      </label>
                      <IonButton
                        expand="block"
                        type="submit"
                        className="portfolio-submit-button"
                        disabled={isSubmittingFunds}
                      >
                        {isSubmittingFunds ? "Processing" : "Submit"}
                      </IonButton>
                      {fundsMessage && (
                        <p className="portfolio-funds-message">{fundsMessage}</p>
                      )}
                    </form>
                  </article>

                  <article className="portfolio-panel">
                    <div className="portfolio-panel-header">
                      <div>
                        <h2>Recent Activity</h2>
                        <p>Latest wallet movements</p>
                      </div>
                    </div>
                    <MovementList movements={recentMovements} />
                  </article>
                </section>
              )}
            </>
          )}
        </main>
      </IonContent>
    </IonPage>
  );
};

type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: string;
  tone?: "positive" | "negative";
};

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  helper,
  icon,
  tone,
}) => (
  <article className={`portfolio-metric-card ${tone ?? ""}`}>
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </div>
    <IonIcon icon={icon} />
  </article>
);

type PortfolioNavProps = {
  activeView: PortfolioView;
  onChange: (view: PortfolioView) => void;
};

const portfolioViews: Array<{
  id: PortfolioView;
  label: string;
  icon: string;
}> = [
  { id: "overview", label: "Overview", icon: pieChartOutline },
  { id: "positions", label: "Positions", icon: storefrontOutline },
  { id: "cash", label: "Cash activity", icon: documentsOutline },
];

const PortfolioNav: React.FC<PortfolioNavProps> = ({ activeView, onChange }) => (
  <nav className="portfolio-view-nav" aria-label="Portfolio sections">
    {portfolioViews.map((view) => (
      <button
        key={view.id}
        type="button"
        className={activeView === view.id ? "active" : ""}
        onClick={() => onChange(view.id)}
      >
        <IonIcon icon={view.icon} />
        {view.label}
      </button>
    ))}
  </nav>
);

type PositionsChartProps = {
  positions: PortfolioPosition[];
  currency: string;
};

const PositionsChart: React.FC<PositionsChartProps> = ({
  positions,
  currency,
}) => {
  const chartPositions = positions.slice(0, 6);
  const maxValue = Math.max(
    ...chartPositions.map((position) => position.currentValue ?? position.totalInvested),
    1,
  );

  if (!chartPositions.length) {
    return (
      <div className="portfolio-empty">
        <p>No positions have been recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="portfolio-position-chart">
      {chartPositions.map((position) => {
        const value = position.currentValue ?? position.totalInvested;
        const height = Math.max(14, (value / maxValue) * 100);

        return (
          <div key={position.positionId} className="portfolio-chart-column">
            <div className="portfolio-chart-track">
              <span style={{ height: `${height}%` }} />
            </div>
            <strong>{position.symbol ?? position.stockId}</strong>
            <small>{formatCurrency(value, currency)}</small>
          </div>
        );
      })}
    </div>
  );
};

type SectorAllocationProps = {
  distribution: PortfolioSectorDistribution | null;
  currency: string;
};

const SectorAllocation: React.FC<SectorAllocationProps> = ({
  distribution,
  currency,
}) => {
  if (!distribution?.sectors.length) {
    return (
      <div className="portfolio-empty">
        <p>No sector distribution is available yet.</p>
      </div>
    );
  }

  return (
    <div className="portfolio-sector-list">
      {distribution.sectors.map((sector) => (
        <div key={sector.sector} className="portfolio-sector-item">
          <div>
            <strong>{sector.sector}</strong>
            <span>
              {sector.positions} positions - {formatCurrency(sector.value, currency)}
            </span>
          </div>
          <b>{sector.percentage.toFixed(1)}%</b>
          <span className="portfolio-sector-bar">
            <i style={{ width: `${Math.min(sector.percentage, 100)}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
};

type PositionsTableProps = {
  positions: PortfolioPosition[];
  currency: string;
  selectedPositionId: string;
  onSelectPosition: (position: PortfolioPosition) => void;
};

const PositionsTable: React.FC<PositionsTableProps> = ({
  positions,
  currency,
  selectedPositionId,
  onSelectPosition,
}) => {
  if (!positions.length) {
    return (
      <div className="portfolio-empty">
        <p>Your open holdings will appear here after executed purchases.</p>
      </div>
    );
  }

  return (
    <div className="portfolio-position-table">
      <div className="portfolio-position-header" aria-hidden="true">
        <span>Asset</span>
        <span>Holding</span>
        <span>Price</span>
        <span>Value</span>
        <span>Return</span>
      </div>
      {positions.map((position) => (
        <button
          key={position.positionId}
          type="button"
          className={`portfolio-position-row ${
            selectedPositionId === position.positionId ? "active" : ""
          }`}
          onClick={() => onSelectPosition(position)}
        >
          <span className="portfolio-symbol">{position.symbol ?? "STK"}</span>
          <span>
            <strong>{position.symbol ?? `Stock ${position.stockId}`}</strong>
            <small>
              {position.quantity} units @{" "}
              {formatCurrency(position.averageBuyPrice, currency)}
            </small>
          </span>
          <span>{formatCurrency(position.currentPrice, currency)}</span>
          <span>{formatCurrency(position.currentValue, currency)}</span>
          <span className={(position.profitLoss ?? 0) >= 0 ? "positive" : "negative"}>
            {formatCurrency(position.profitLoss, currency)}
            <small>{formatPercent(position.returnPercentage)}</small>
          </span>
        </button>
      ))}
    </div>
  );
};

type PositionDetailPanelProps = {
  position: PortfolioPosition | null;
  currency: string;
  isLoading: boolean;
  error: string;
  onStartSellFlow: (position: PortfolioPosition) => void;
  onClose: () => void;
};

const PositionDetailPanel: React.FC<PositionDetailPanelProps> = ({
  position,
  currency,
  isLoading,
  error,
  onStartSellFlow,
  onClose,
}) => (
  <article className="portfolio-panel portfolio-detail-panel">
    <div className="portfolio-panel-header">
      <div>
        <h2>Position Detail</h2>
        <p>
          {position
            ? `${resolvePositionName(position)} valuation`
            : "Select a holding to inspect it"}
        </p>
      </div>
      {(position || error) && (
        <button
          type="button"
          className="portfolio-icon-button"
          onClick={onClose}
          aria-label="Close position detail"
        >
          <IonIcon icon={closeOutline} />
        </button>
      )}
    </div>

    <PositionDetailContent
      currency={currency}
      error={error}
      isLoading={isLoading}
      onStartSellFlow={onStartSellFlow}
      position={position}
    />
  </article>
);

type PositionDetailContentProps = Omit<PositionDetailPanelProps, "onClose">;

const PositionDetailContent: React.FC<PositionDetailContentProps> = ({
  position,
  currency,
  isLoading,
  error,
  onStartSellFlow,
}) => {
  if (isLoading) {
    return (
      <div className="portfolio-detail-loading">
        <IonSpinner name="crescent" />
        <span>Loading detail</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-detail-error" role="alert">
        <IonIcon icon={alertCircleOutline} />
        <p>{error}</p>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="portfolio-empty compact">
        <p>Click any position to review its valuation details.</p>
      </div>
    );
  }

  return (
    <>
      <div className="portfolio-detail-hero">
        <span>{position.symbol ?? "STK"}</span>
        <strong>{formatCurrency(position.currentValue, currency)}</strong>
        <small>
          {formatCurrency(position.profitLoss, currency)} -{" "}
          {formatPercent(position.returnPercentage)}
        </small>
      </div>
      <dl className="portfolio-detail-grid">
        <div>
          <dt>Quantity</dt>
          <dd>{position.quantity}</dd>
        </div>
        <div>
          <dt>Average buy</dt>
          <dd>{formatCurrency(position.averageBuyPrice, currency)}</dd>
        </div>
        <div>
          <dt>Current price</dt>
          <dd>{formatCurrency(position.currentPrice, currency)}</dd>
        </div>
        <div>
          <dt>Total invested</dt>
          <dd>{formatCurrency(position.totalInvested, currency)}</dd>
        </div>
      </dl>
      <p className="portfolio-detail-updated">
        Updated {formatMovementDate(position.lastUpdated)}
      </p>
      <div className="portfolio-sell-ticket">
        <div>
          <h3>Sell position</h3>
          <p>Open this asset in Market to start the sell workflow.</p>
        </div>
        <div className="portfolio-sell-preview">
          <span>Available shares</span>
          <strong>{position.quantity}</strong>
        </div>
        <IonButton
          expand="block"
          className="portfolio-sell-button"
          onClick={() => onStartSellFlow(position)}
        >
          Continue to sell
        </IonButton>
      </div>
    </>
  );
};

type MovementListProps = {
  movements: WalletMovement[];
};

const MovementList: React.FC<MovementListProps> = ({ movements }) => {
  if (!movements.length) {
    return (
      <div className="portfolio-empty compact">
        <p>No wallet movements yet.</p>
      </div>
    );
  }

  return (
    <div className="portfolio-movement-list">
      {movements.map((movement) => {
        const isCredit = ["DEPOSIT", "RELEASE", "SELL"].includes(
          movement.movementType,
        );

        return (
          <div key={movement.movementId} className="portfolio-movement-item">
            <span className={isCredit ? "credit" : "debit"}>
              <IonIcon icon={isCredit ? arrowDownOutline : arrowUpOutline} />
            </span>
            <div>
              <strong>{movement.movementType.replace("_", " ")}</strong>
              <small>{formatMovementDate(movement.createdAt)}</small>
            </div>
            <b className={isCredit ? "positive" : "negative"}>
              {isCredit ? "+" : "-"}
              {formatCurrency(movement.amount, movement.currency)}
            </b>
          </div>
        );
      })}
    </div>
  );
};

export default Portfolio;
