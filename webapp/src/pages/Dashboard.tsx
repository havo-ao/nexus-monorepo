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
  analyticsOutline,
  arrowDownOutline,
  arrowForwardOutline,
  arrowUpOutline,
  briefcaseOutline,
  cashOutline,
  pulseOutline,
  refreshOutline,
  walletOutline,
} from "ionicons/icons";
import NavBar from "../components/NavBar";
import {
  getMarketDashboard,
  type DashboardQuote,
  type MarketDashboardResponse,
} from "../api/market";
import {
  getPortfolioSummary,
  getWalletBalance,
  type PortfolioSummary,
  type WalletBalance,
} from "../api/portfolio";
import { getCurrentTraderId } from "../auth/traderContext";
import "./Dashboard.css";

type PortfolioPoint = {
  date: string;
  value: number;
};

const portfolioPoints: PortfolioPoint[] = [
  { date: "04-17", value: 181 },
  { date: "04-20", value: 183 },
  { date: "04-23", value: 185 },
  { date: "04-26", value: 184 },
  { date: "04-29", value: 188 },
  { date: "05-02", value: 191 },
  { date: "05-05", value: 190 },
  { date: "05-08", value: 192 },
  { date: "05-11", value: 195 },
  { date: "05-14", value: 194 },
  { date: "05-16", value: 196 },
];

function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function buildChartPolyline(points: PortfolioPoint[]): string {
  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 100 - ((point.value - minValue) / range) * 72 - 14;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function resolveLatestQuote(
  dashboard: MarketDashboardResponse | null,
): DashboardQuote | null {
  return dashboard?.quotes.latest[0] ?? dashboard?.quotes.topGainers[0] ?? null;
}

const Dashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<MarketDashboardResponse | null>(
    null,
  );
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const traderId = getCurrentTraderId();

  const loadDashboard = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [marketResult, portfolioResult, walletResult] = await Promise.all([
        getMarketDashboard(),
        traderId ? getPortfolioSummary(traderId).catch(() => null) : null,
        traderId ? getWalletBalance(traderId).catch(() => null) : null,
      ]);
      setDashboard(marketResult);
      setPortfolio(portfolioResult);
      setWallet(walletResult);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the market dashboard.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const chartPolyline = useMemo(() => buildChartPolyline(portfolioPoints), []);
  const latestQuote = resolveLatestQuote(dashboard);
  const portfolioValue = portfolio?.currentValue ?? 0;
  const availableFunds = wallet?.availableBalance ?? 0;
  const totalBalance = wallet ? wallet.totalBalance + portfolioValue : portfolioValue;
  const dailyPnL = portfolio?.profitLoss ?? 0;
  const dailyPnLPercent = portfolio?.returnPercentage ?? 0;
  const generatedAt = dashboard
    ? new Date(dashboard.platform.generatedAt).toLocaleString()
    : "Pending sync";

  return (
    <IonPage>
      <NavBar />
      <IonContent fullscreen className="dashboard-content">
        <main className="dashboard-shell">
          <header className="dashboard-header">
            <div>
              <h1>Dashboard</h1>
              <p>Welcome back! Here&apos;s your portfolio overview.</p>
            </div>
            <IonButton
              className="dashboard-refresh-button"
              onClick={() => void loadDashboard()}
              disabled={isLoading}
            >
              <IonIcon slot="start" icon={refreshOutline} />
              Refresh
            </IonButton>
          </header>

          {error && (
            <section className="dashboard-alert" role="alert">
              <IonIcon icon={alertCircleOutline} />
              <span>{error}</span>
            </section>
          )}

          {isLoading && !dashboard ? (
            <section className="dashboard-loading">
              <IonSpinner name="crescent" />
              <span>Loading market dashboard</span>
            </section>
          ) : (
            <>
              <section className="dashboard-metric-grid">
                <article className="dashboard-metric-card">
                  <div>
                    <span>Total Balance</span>
                    <strong>{formatCurrency(totalBalance)}</strong>
                    <small>Wallet plus current holdings</small>
                  </div>
                  <IonIcon icon={walletOutline} />
                </article>
                <article className="dashboard-metric-card">
                  <div>
                    <span>Portfolio Value</span>
                    <strong>{formatCurrency(portfolioValue)}</strong>
                    <small>Current holdings preview</small>
                  </div>
                  <IonIcon icon={briefcaseOutline} />
                </article>
                <article className="dashboard-metric-card">
                  <div>
                    <span>Available Funds</span>
                    <strong>{formatCurrency(availableFunds)}</strong>
                    <small>Available wallet balance</small>
                  </div>
                  <IonIcon icon={cashOutline} />
                </article>
                <article className="dashboard-metric-card dashboard-profit-card">
                  <div>
                    <span>Today&apos;s P&amp;L</span>
                    <strong>
                      {dailyPnL >= 0 ? "+" : ""}
                      {formatCurrency(dailyPnL)}
                    </strong>
                    <small>{formatPercent(dailyPnLPercent)} return</small>
                  </div>
                  <IonIcon icon={analyticsOutline} />
                </article>
              </section>

              <section className="dashboard-summary-grid">
                <article className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2>Market Coverage</h2>
                      <p>Available markets and instruments from market-service</p>
                    </div>
                    <span className="dashboard-status-pill">
                      {dashboard?.platform.status ?? "UNKNOWN"}
                    </span>
                  </div>
                  <div className="dashboard-coverage-grid">
                    <div>
                      <strong>{dashboard?.markets.active ?? 0}</strong>
                      <span>Active markets</span>
                    </div>
                    <div>
                      <strong>{dashboard?.markets.total ?? 0}</strong>
                      <span>Total markets</span>
                    </div>
                    <div>
                      <strong>{dashboard?.instruments.total ?? 0}</strong>
                      <span>Listed instruments</span>
                    </div>
                    <div>
                      <strong>{dashboard?.quotes.trackedCount ?? 0}</strong>
                      <span>Tracked quotes</span>
                    </div>
                  </div>
                  <div className="dashboard-market-strip">
                    {dashboard?.markets.items.map((market) => (
                      <span key={market.code}>
                        {market.code}
                        <small>{market.currency}</small>
                      </span>
                    ))}
                  </div>
                  <p className="dashboard-sync-time">Updated {generatedAt}</p>
                </article>

                <article className="dashboard-panel dashboard-live-quote">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2>Latest Quote</h2>
                      <p>Freshest market quote cached by market-service</p>
                    </div>
                    <IonIcon icon={pulseOutline} />
                  </div>
                  {latestQuote ? (
                    <div className="dashboard-live-quote-body">
                      <span>{latestQuote.symbol}</span>
                      <strong>
                        {formatCurrency(latestQuote.price, latestQuote.currency)}
                      </strong>
                      <small>{latestQuote.name}</small>
                      <p>{latestQuote.provider}</p>
                    </div>
                  ) : (
                    <p className="dashboard-empty-text">
                      No synchronized quotes yet.
                    </p>
                  )}
                </article>
              </section>

              <section className="dashboard-panel dashboard-chart-panel">
                <div className="dashboard-panel-header">
                  <div>
                    <h2>Portfolio Performance</h2>
                    <p>Portfolio trend preview and latest valuation context</p>
                  </div>
                  <div className="dashboard-range-control" aria-label="Range">
                    <button type="button" className="active">
                      1M
                    </button>
                    <button type="button">3M</button>
                    <button type="button">1Y</button>
                    <button type="button">ALL</button>
                  </div>
                </div>
                <div className="dashboard-chart">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline
                      className="dashboard-chart-fill"
                      points={`0,100 ${chartPolyline} 100,100`}
                    />
                    <polyline
                      className="dashboard-chart-line"
                      points={chartPolyline}
                    />
                  </svg>
                  <div className="dashboard-chart-labels">
                    {portfolioPoints.map((point) => (
                      <span key={point.date}>{point.date}</span>
                    ))}
                  </div>
                </div>
              </section>

              <section className="dashboard-lists-grid">
                <QuoteList
                  title="Top Gainers"
                  actionLabel="View all"
                  quotes={dashboard?.quotes.topGainers ?? []}
                  direction="up"
                />
                <QuoteList
                  title="Top Losers"
                  actionLabel="View all"
                  quotes={dashboard?.quotes.topLosers ?? []}
                  direction="down"
                />
              </section>

              <section className="dashboard-bottom-grid">
                <article className="dashboard-quick-trade">
                  <h2>Quick Trade</h2>
                  <p>Start trading in seconds</p>
                  <IonButton routerLink="/trader-panel">
                    Open Trading Panel
                  </IonButton>
                </article>

                <article className="dashboard-panel dashboard-positions-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2>Your Positions</h2>
                      <p>Current holdings from portfolio-service</p>
                    </div>
                    <button type="button" className="dashboard-link-button">
                      View all
                      <IonIcon icon={arrowForwardOutline} />
                    </button>
                  </div>
                  <div className="dashboard-position-list">
                    {(portfolio?.positions ?? []).slice(0, 4).map((position) => {
                      const value = position.currentValue ?? 0;
                      const pnl = position.profitLoss ?? 0;
                      const pnlPercent = position.returnPercentage ?? 0;

                      return (
                        <div key={position.positionId} className="dashboard-position">
                          <div>
                            <strong>{position.symbol ?? position.stockId}</strong>
                            <span>
                              {position.quantity} shares @{" "}
                              {formatCurrency(position.averageBuyPrice)}
                            </span>
                          </div>
                          <div>
                            <strong>{formatCurrency(value)}</strong>
                            <span className={pnl >= 0 ? "positive" : "negative"}>
                              {pnl >= 0 ? "+" : ""}
                              {formatCurrency(pnl)} ({formatPercent(pnlPercent)})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {!portfolio?.positions.length && (
                      <p className="dashboard-empty-text">
                        No positions yet. Create a buy order to start building
                        your portfolio.
                      </p>
                    )}
                  </div>
                </article>
              </section>
            </>
          )}
        </main>
      </IonContent>
    </IonPage>
  );
};

type QuoteListProps = {
  title: string;
  actionLabel: string;
  quotes: DashboardQuote[];
  direction: "up" | "down";
};

const QuoteList: React.FC<QuoteListProps> = ({
  title,
  actionLabel,
  quotes,
  direction,
}) => (
  <article className="dashboard-panel">
    <div className="dashboard-panel-header">
      <h2>{title}</h2>
      <button type="button" className="dashboard-link-button">
        {actionLabel}
        <IonIcon icon={arrowForwardOutline} />
      </button>
    </div>
    <div className="dashboard-quote-list">
      {quotes.length > 0 ? (
        quotes.map((quote) => (
          <div key={quote.symbol} className="dashboard-quote-item">
            <div className="dashboard-symbol-badge">
              {quote.symbol.slice(0, 2)}
            </div>
            <div className="dashboard-quote-main">
              <strong>{quote.symbol}</strong>
              <span>{quote.name}</span>
            </div>
            <div className="dashboard-quote-price">
              <strong>{formatCurrency(quote.price, quote.currency)}</strong>
              <span className={direction === "up" ? "positive" : "negative"}>
                <IonIcon
                  icon={direction === "up" ? arrowUpOutline : arrowDownOutline}
                />
                {formatPercent(quote.changePercent)}
              </span>
            </div>
          </div>
        ))
      ) : (
        <p className="dashboard-empty-text">No quote movement available yet.</p>
      )}
    </div>
  </article>
);

export default Dashboard;
