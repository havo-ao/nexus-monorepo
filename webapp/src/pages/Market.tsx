import { type MouseEvent, useEffect, useMemo, useState } from "react";
import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner,
} from "@ionic/react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import {
  alertCircleOutline,
  arrowBackOutline,
  businessOutline,
  calendarOutline,
  cashOutline,
  pulseOutline,
  refreshOutline,
  searchOutline,
  starOutline,
  timeOutline,
  trendingUpOutline,
} from "ionicons/icons";
import NavBar from "../components/NavBar";
import {
  addWatchlistItem,
  getInstrumentDetail,
  getInstruments,
  getMarketStatus,
  getMarkets,
  getQuote,
  getQuoteHistory,
  getWatchlist,
  removeWatchlistItem,
  type Instrument,
  type InstrumentDetail,
  type Market as MarketModel,
  type MarketStatus,
  type Quote,
} from "../api/market";
import "./Market.css";

type MarketRouteParams = {
  marketCode?: string;
  symbol?: string;
};

type AsyncState = {
  isLoading: boolean;
  error: string;
};

type MarketLocationState = {
  sellIntent?: {
    positionId: string;
    stockId: string;
    symbol?: string;
    quantity: number;
  };
};

const traderId = "trader-123";

function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value?: string): string {
  if (!value) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateInputValue(value?: string): string {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

type ChartPoint = {
  quote: Quote;
  x: number;
  y: number;
};

function buildHistoryChartPoints(points: Quote[]): ChartPoint[] {
  const visiblePoints = points.slice(-42);
  const values = visiblePoints.map((point) => point.price);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  return visiblePoints
    .map((point, index) => {
      const x =
        visiblePoints.length === 1
          ? 50
          : (index / (visiblePoints.length - 1)) * 100;
      const y = 88 - ((point.price - minValue) / range) * 72;
      return { quote: point, x, y };
    })
}

function toPolyline(points: ChartPoint[]): string {
  return points
    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");
}

const Market: React.FC = () => {
  const history = useHistory();
  const location = useLocation<MarketLocationState | undefined>();
  const { marketCode, symbol } = useParams<MarketRouteParams>();
  const selectedMarketCode = marketCode?.toUpperCase();
  const selectedSymbol = symbol?.toUpperCase();
  const queryParams = new URLSearchParams(location.search);
  const sellIntent =
    queryParams.get("action") === "sell" ? location.state?.sellIntent : null;

  const [markets, setMarkets] = useState<MarketModel[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [detail, setDetail] = useState<InstrumentDetail | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [historyPrices, setHistoryPrices] = useState<Quote[]>([]);
  const [watchlistSymbols, setWatchlistSymbols] = useState<Set<string>>(
    () => new Set(),
  );
  const [pendingWatchlistSymbol, setPendingWatchlistSymbol] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AsyncState>({
    isLoading: true,
    error: "",
  });
  const [watchlistMessage, setWatchlistMessage] = useState("");
  const [isAddingWatchlist, setIsAddingWatchlist] = useState(false);

  const selectedMarket = useMemo(
    () => markets.find((market) => market.code === selectedMarketCode) ?? null,
    [markets, selectedMarketCode],
  );

  const filteredInstruments = useMemo(() => {
    const normalizedQuery = query.trim().toUpperCase();

    return instruments
      .filter((instrument) =>
        selectedMarketCode
          ? instrument.marketCode === selectedMarketCode
          : true,
      )
      .filter((instrument) => {
        if (!normalizedQuery) {
          return true;
        }

        return (
          instrument.symbol.includes(normalizedQuery) ||
          instrument.name.toUpperCase().includes(normalizedQuery)
        );
      })
      .slice(0, 80);
  }, [instruments, query, selectedMarketCode]);

  const loadMarketData = async () => {
    setStatus({ isLoading: true, error: "" });
    setWatchlistMessage("");

    try {
      const [loadedMarkets, loadedInstruments, loadedWatchlist] = await Promise.all([
        getMarkets(),
        getInstruments(),
        getWatchlist(traderId).catch(() => null),
      ]);

      setMarkets(loadedMarkets);
      setInstruments(loadedInstruments);
      setWatchlistSymbols(
        new Set(
          loadedWatchlist?.items.map((item) => item.symbol.toUpperCase()) ?? [],
        ),
      );

      if (selectedMarketCode) {
        const loadedStatus = await getMarketStatus(selectedMarketCode).catch(
          () => null,
        );
        setMarketStatus(loadedStatus);
      } else {
        setMarketStatus(null);
      }

      if (selectedSymbol) {
        const loadedDetail = await getInstrumentDetail(selectedSymbol);
        const [loadedQuote, loadedHistory] = await Promise.all([
          getQuote(selectedSymbol).catch(() => null),
          getQuoteHistory(selectedSymbol).catch(() => ({
            symbol: selectedSymbol,
            prices: [],
          })),
        ]);

        setDetail(loadedDetail);
        setQuote(loadedQuote);
        setHistoryPrices(loadedHistory.prices);
      } else {
        setDetail(null);
        setQuote(null);
        setHistoryPrices([]);
      }
    } catch (requestError) {
      setStatus({
        isLoading: false,
        error:
          requestError instanceof Error
            ? requestError.message
            : "Unable to load market information.",
      });
      return;
    }

    setStatus({ isLoading: false, error: "" });
  };

  useEffect(() => {
    void loadMarketData();
  }, [selectedMarketCode, selectedSymbol]);

  const openMarket = (code: string) => {
    history.push(`/markets/${code}/instruments`);
  };

  const openInstrument = (instrumentSymbol: string) => {
    history.push(
      `/markets/${selectedMarketCode ?? "NASDAQ"}/instruments/${instrumentSymbol}`,
    );
  };

  const addToWatchlist = async () => {
    if (!selectedSymbol) {
      return;
    }

    setIsAddingWatchlist(true);
    setWatchlistMessage("");

    try {
      await addWatchlistItem(traderId, selectedSymbol);
      setWatchlistSymbols((currentSymbols) => {
        const nextSymbols = new Set(currentSymbols);
        nextSymbols.add(selectedSymbol);
        return nextSymbols;
      });
      setWatchlistMessage(`${selectedSymbol} was added to your watchlist.`);
    } catch (requestError) {
      setWatchlistMessage(
        requestError instanceof Error
          ? requestError.message
          : "Unable to add this instrument to the watchlist.",
      );
    } finally {
      setIsAddingWatchlist(false);
    }
  };

  const toggleInstrumentWatchlist = async (instrumentSymbol: string) => {
    const normalizedSymbol = instrumentSymbol.toUpperCase();
    const isInWatchlist = watchlistSymbols.has(normalizedSymbol);

    setPendingWatchlistSymbol(normalizedSymbol);

    try {
      if (isInWatchlist) {
        await removeWatchlistItem(traderId, normalizedSymbol);
        setWatchlistSymbols((currentSymbols) => {
          const nextSymbols = new Set(currentSymbols);
          nextSymbols.delete(normalizedSymbol);
          return nextSymbols;
        });
        return;
      }

      await addWatchlistItem(traderId, normalizedSymbol);
      setWatchlistSymbols((currentSymbols) => {
        const nextSymbols = new Set(currentSymbols);
        nextSymbols.add(normalizedSymbol);
        return nextSymbols;
      });
    } catch (requestError) {
      setStatus({
        isLoading: false,
        error:
          requestError instanceof Error
            ? requestError.message
            : "Unable to update your watchlist.",
      });
    } finally {
      setPendingWatchlistSymbol("");
    }
  };

  return (
    <IonPage>
      <NavBar />
      <IonContent fullscreen className="market-content">
        <main className="market-shell">
            <header className="market-header">
              <div>
                <span className="market-eyebrow">Market</span>
                <h1>{resolveTitle(selectedMarket, detail)}</h1>
                <p>
                  Browse available markets, inspect listed instruments and review
                  real quote data from market-service.
                </p>
              </div>
              <IonButton
                className="market-refresh-button"
                onClick={() => void loadMarketData()}
                disabled={status.isLoading}
              >
                <IonIcon slot="start" icon={refreshOutline} />
                Refresh
              </IonButton>
            </header>

            <MarketBreadcrumb
              market={selectedMarket}
              instrument={detail}
              onRoot={() => history.push("/markets")}
              onMarket={() =>
                selectedMarketCode &&
                history.push(`/markets/${selectedMarketCode}/instruments`)
              }
            />

            {status.error && (
              <section className="market-alert" role="alert">
                <IonIcon icon={alertCircleOutline} />
                <span>{status.error}</span>
              </section>
            )}

            {status.isLoading ? (
              <section className="market-loading">
                <IonSpinner name="crescent" />
                <span>Loading market data</span>
              </section>
            ) : selectedSymbol ? (
              <InstrumentDetailView
                detail={detail}
                quote={quote}
                historyPrices={historyPrices}
                marketStatus={marketStatus}
                sellIntent={sellIntent ?? null}
                watchlistMessage={watchlistMessage}
                isAddingWatchlist={isAddingWatchlist}
                onBack={() =>
                  history.push(`/markets/${selectedMarketCode}/instruments`)
                }
                onAddToWatchlist={() => void addToWatchlist()}
              />
            ) : selectedMarketCode ? (
              <InstrumentListView
                market={selectedMarket}
                marketStatus={marketStatus}
                instruments={filteredInstruments}
                query={query}
                onQueryChange={setQuery}
                onBack={() => history.push("/markets")}
                onOpenInstrument={openInstrument}
                watchlistSymbols={watchlistSymbols}
                pendingWatchlistSymbol={pendingWatchlistSymbol}
                onToggleWatchlist={(instrumentSymbol) =>
                  void toggleInstrumentWatchlist(instrumentSymbol)
                }
              />
            ) : (
              <MarketListView markets={markets} onOpenMarket={openMarket} />
            )}
          </main>
      </IonContent>
    </IonPage>
  );
};

function resolveTitle(
  market: MarketModel | null,
  detail: InstrumentDetail | null,
): string {
  if (detail) {
    return detail.symbol;
  }

  if (market) {
    return market.name;
  }

  return "Available markets";
}

type MarketBreadcrumbProps = {
  market: MarketModel | null;
  instrument: InstrumentDetail | null;
  onRoot: () => void;
  onMarket: () => void;
};

const MarketBreadcrumb: React.FC<MarketBreadcrumbProps> = ({
  market,
  instrument,
  onRoot,
  onMarket,
}) => (
  <nav className="market-breadcrumb" aria-label="Market navigation">
    <button type="button" onClick={onRoot}>
      Markets
    </button>
    {market && (
      <>
        <span>/</span>
        <button type="button" onClick={onMarket}>
          {market.code}
        </button>
      </>
    )}
    {instrument && (
      <>
        <span>/</span>
        <strong>{instrument.symbol}</strong>
      </>
    )}
  </nav>
);

type MarketListViewProps = {
  markets: MarketModel[];
  onOpenMarket: (code: string) => void;
};

const MarketListView: React.FC<MarketListViewProps> = ({
  markets,
  onOpenMarket,
}) => (
  <section className="market-grid">
    {markets.map((market) => (
      <button
        key={market.code}
        type="button"
        className="market-card"
        onClick={() => onOpenMarket(market.code)}
      >
        <span className="market-card-icon">
          <IonIcon icon={businessOutline} />
        </span>
        <span className="market-card-main">
          <strong>{market.code}</strong>
          <small>{market.name}</small>
        </span>
        <span className="market-card-meta">
          <small>{market.country}</small>
          <small>{market.currency}</small>
        </span>
        <span className={`market-state ${market.status.toLowerCase()}`}>
          {market.status}
        </span>
      </button>
    ))}
  </section>
);

type InstrumentListViewProps = {
  market: MarketModel | null;
  marketStatus: MarketStatus | null;
  instruments: Instrument[];
  query: string;
  onQueryChange: (value: string) => void;
  onBack: () => void;
  onOpenInstrument: (symbol: string) => void;
  watchlistSymbols: Set<string>;
  pendingWatchlistSymbol: string;
  onToggleWatchlist: (symbol: string) => void;
};

const InstrumentListView: React.FC<InstrumentListViewProps> = ({
  market,
  marketStatus,
  instruments,
  query,
  onQueryChange,
  onBack,
  onOpenInstrument,
  watchlistSymbols,
  pendingWatchlistSymbol,
  onToggleWatchlist,
}) => (
  <>
    <section className="market-context-panel">
      <button type="button" className="market-back-button" onClick={onBack}>
        <IonIcon icon={arrowBackOutline} />
        Back to markets
      </button>
      <div>
        <h2>{market?.name ?? "Selected market"}</h2>
        <p>
          {market?.country} - {market?.currency} - {market?.timezone}
        </p>
      </div>
      <MarketStatusBadge status={marketStatus} />
    </section>

    <section className="market-toolbar">
      <div className="market-search">
        <IonIcon icon={searchOutline} />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by symbol or company"
        />
      </div>
      <span>{instruments.length} instruments shown</span>
    </section>

    <section className="instrument-table">
      {instruments.length ? (
        instruments.map((instrument) => {
          const isInWatchlist = watchlistSymbols.has(instrument.symbol);
          const isPending = pendingWatchlistSymbol === instrument.symbol;

          return (
          <div
            key={instrument.symbol}
            className="instrument-row"
            role="button"
            tabIndex={0}
            onClick={() => onOpenInstrument(instrument.symbol)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpenInstrument(instrument.symbol);
              }
            }}
          >
            <span className="instrument-symbol">{instrument.symbol}</span>
            <span>
              <strong>{instrument.name}</strong>
              <small>{instrument.sector}</small>
            </span>
            <span>{instrument.currency}</span>
            <span className={`market-state ${instrument.status.toLowerCase()}`}>
              {instrument.status}
            </span>
            <button
              type="button"
              className={`instrument-watchlist-action ${
                isInWatchlist ? "remove" : "add"
              }`}
              disabled={isPending}
              onClick={(event) => {
                event.stopPropagation();
                onToggleWatchlist(instrument.symbol);
              }}
            >
              {isInWatchlist ? "Eliminar" : "Agregar"}
            </button>
          </div>
          );
        })
      ) : (
        <div className="market-empty">
          <p>No instruments are available for this market yet.</p>
        </div>
      )}
    </section>
  </>
);

type InstrumentDetailViewProps = {
  detail: InstrumentDetail | null;
  quote: Quote | null;
  historyPrices: Quote[];
  marketStatus: MarketStatus | null;
  sellIntent: MarketLocationState["sellIntent"] | null;
  watchlistMessage: string;
  isAddingWatchlist: boolean;
  onBack: () => void;
  onAddToWatchlist: () => void;
};

const InstrumentDetailView: React.FC<InstrumentDetailViewProps> = ({
  detail,
  quote,
  historyPrices,
  marketStatus,
  sellIntent,
  watchlistMessage,
  isAddingWatchlist,
  onBack,
  onAddToWatchlist,
}) => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const filteredHistoryPrices = useMemo(() => {
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

    return historyPrices.filter((historyPrice) => {
      const pointTime = new Date(historyPrice.asOf).getTime();

      return (
        Number.isFinite(pointTime) &&
        (fromTime === null || pointTime >= fromTime) &&
        (toTime === null || pointTime <= toTime)
      );
    });
  }, [dateFrom, dateTo, historyPrices]);
  const chartPoints = filteredHistoryPrices.length
    ? buildHistoryChartPoints(filteredHistoryPrices)
    : [];
  const polyline = chartPoints.length ? toPolyline(chartPoints) : "";
  const latestHistory = filteredHistoryPrices.at(-1);
  const firstHistory = filteredHistoryPrices.at(0);

  if (!detail) {
    return (
      <section className="market-empty">
        <p>Instrument detail is not available.</p>
      </section>
    );
  }

  const currentQuote = quote ?? detail.quote ?? null;

  const handleChartPointerMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!chartPoints.length) {
      return;
    }

    const chartBounds = event.currentTarget.getBoundingClientRect();
    const cursorX =
      ((event.clientX - chartBounds.left) / chartBounds.width) * 100;
    const nearestPoint = chartPoints.reduce((nearest, point) =>
      Math.abs(point.x - cursorX) < Math.abs(nearest.x - cursorX)
        ? point
        : nearest,
    );

    setHoveredPoint(nearestPoint);
  };

  const clearHistoryRange = () => {
    setDateFrom("");
    setDateTo("");
    setHoveredPoint(null);
  };

  return (
    <>
      <section className="market-context-panel">
        <button type="button" className="market-back-button" onClick={onBack}>
          <IonIcon icon={arrowBackOutline} />
          Back to instruments
        </button>
        <div>
          <h2>{detail.name}</h2>
          <p>
            {detail.marketCode} - {detail.currency} - {detail.sector}
          </p>
        </div>
        <MarketStatusBadge status={marketStatus} />
      </section>

      <section className="quote-metric-grid">
        <QuoteMetric
          label="Current price"
          value={
            currentQuote
              ? formatCurrency(currentQuote.price, currentQuote.currency)
              : "Pending"
          }
          icon={cashOutline}
        />
        <QuoteMetric
          label="Bid"
          value={
            currentQuote
              ? formatCurrency(currentQuote.bid, currentQuote.currency)
              : "Pending"
          }
          icon={trendingUpOutline}
        />
        <QuoteMetric
          label="Ask"
          value={
            currentQuote
              ? formatCurrency(currentQuote.ask, currentQuote.currency)
              : "Pending"
          }
          icon={pulseOutline}
        />
        <QuoteMetric
          label="Spread"
          value={currentQuote ? currentQuote.spread.toFixed(2) : "Pending"}
          icon={timeOutline}
        />
      </section>

      {sellIntent && (
        <section className="market-sell-intent" role="status">
          <div>
            <span>Sell intent from portfolio</span>
            <strong>
              {sellIntent.quantity} shares of {sellIntent.symbol ?? detail.symbol}
            </strong>
          </div>
          <p>
            The order ticket is not implemented in Market yet, so no sale is
            recorded from this screen.
          </p>
        </section>
      )}

      <section className="instrument-detail-grid">
        <article className="market-panel instrument-profile">
          <div className="market-panel-header">
            <div>
              <h2>Instrument detail</h2>
              <p>Metadata enriched by market-service</p>
            </div>
            <IonButton
              className="watchlist-button"
              onClick={onAddToWatchlist}
              disabled={isAddingWatchlist}
            >
              <IonIcon slot="start" icon={starOutline} />
              Add to watchlist
            </IonButton>
          </div>
          {watchlistMessage && (
            <p className="watchlist-message">{watchlistMessage}</p>
          )}
          <dl className="instrument-definition-list">
            <div>
              <dt>Asset type</dt>
              <dd>{detail.assetType ?? "Not classified"}</dd>
            </div>
            <div>
              <dt>Industry</dt>
              <dd>{detail.industry ?? "Not available"}</dd>
            </div>
            <div>
              <dt>Country</dt>
              <dd>{detail.country ?? "Not available"}</dd>
            </div>
            <div>
              <dt>Quote provider</dt>
              <dd>{currentQuote?.provider ?? "Pending sync"}</dd>
            </div>
          </dl>
          <p className="instrument-description">
            {detail.description ?? "No description available yet."}
          </p>
        </article>

        <article className="market-panel history-panel">
          <div className="market-panel-header">
            <div>
              <h2>Historical prices</h2>
              <p>
                {firstHistory && latestHistory
                  ? `${formatDateTime(firstHistory.asOf)} - ${formatDateTime(
                      latestHistory.asOf,
                    )}`
                  : "No historical series available"}
              </p>
            </div>
            <div className="history-range-controls">
              <label>
                From
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(event) => {
                    setDateFrom(event.target.value);
                    setHoveredPoint(null);
                  }}
                />
              </label>
              <label>
                To
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(event) => {
                    setDateTo(event.target.value);
                    setHoveredPoint(null);
                  }}
                />
              </label>
              {(dateFrom || dateTo) && (
                <button type="button" onClick={clearHistoryRange}>
                  Clear
                </button>
              )}
              <IonIcon icon={calendarOutline} />
            </div>
          </div>
          {filteredHistoryPrices.length ? (
            <div
              className="history-chart"
              onMouseMove={handleChartPointerMove}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                  className="history-chart-fill"
                  points={`0,100 ${polyline} 100,100`}
                />
                <polyline className="history-chart-line" points={polyline} />
                {chartPoints.map((point) => (
                  <circle
                    key={`${point.quote.asOf}-${point.quote.price}`}
                    className="history-chart-point"
                    cx={point.x}
                    cy={point.y}
                    r="1.35"
                  />
                ))}
                {hoveredPoint && (
                  <>
                    <line
                      className="history-chart-cursor"
                      x1={hoveredPoint.x}
                      x2={hoveredPoint.x}
                      y1="8"
                      y2="92"
                    />
                    <circle
                      className="history-chart-active-point"
                      cx={hoveredPoint.x}
                      cy={hoveredPoint.y}
                      r="2.4"
                    />
                  </>
                )}
              </svg>
              {hoveredPoint && (
                <div
                  className="history-tooltip"
                  style={{
                    left: `${hoveredPoint.x}%`,
                    top: `${hoveredPoint.y}%`,
                  }}
                >
                  <strong>
                    {formatCurrency(
                      hoveredPoint.quote.price,
                      hoveredPoint.quote.currency,
                    )}
                  </strong>
                  <span>{formatDateTime(hoveredPoint.quote.asOf)}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="market-empty-text">
              No historical prices available for the selected range.
            </p>
          )}
          {historyPrices.length > 0 && (
            <div className="history-range-shortcuts">
              <button
                type="button"
                onClick={() => {
                  setDateFrom(formatDateInputValue(historyPrices.at(-7)?.asOf));
                  setDateTo(formatDateInputValue(historyPrices.at(-1)?.asOf));
                  setHoveredPoint(null);
                }}
              >
                Last 7
              </button>
              <button
                type="button"
                onClick={() => {
                  setDateFrom(formatDateInputValue(historyPrices.at(-30)?.asOf));
                  setDateTo(formatDateInputValue(historyPrices.at(-1)?.asOf));
                  setHoveredPoint(null);
                }}
              >
                Last 30
              </button>
              <button type="button" onClick={clearHistoryRange}>
                All
              </button>
            </div>
          )}
        </article>
      </section>
    </>
  );
};

type QuoteMetricProps = {
  label: string;
  value: string;
  icon: string;
};

const QuoteMetric: React.FC<QuoteMetricProps> = ({ label, value, icon }) => (
  <article className="quote-metric">
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
    <IonIcon icon={icon} />
  </article>
);

type MarketStatusBadgeProps = {
  status: MarketStatus | null;
};

const MarketStatusBadge: React.FC<MarketStatusBadgeProps> = ({ status }) => (
  <span className={`market-hours-badge ${status?.status.toLowerCase() ?? ""}`}>
    {status?.status ?? "UNKNOWN"}
    <small>{status?.reason ?? "Market status pending"}</small>
  </span>
);

export default Market;
