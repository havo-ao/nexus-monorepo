import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner,
  useIonViewWillEnter,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import {
  alertCircleOutline,
  cashOutline,
  closeCircleOutline,
  refreshOutline,
  searchOutline,
  starOutline,
  trendingUpOutline,
} from "ionicons/icons";
import NavBar from "../components/NavBar";
import {
  getCurrentTraderId,
  WATCHLIST_CHANGE_EVENT,
} from "../auth/traderContext";
import {
  getWatchlist,
  removeWatchlistItem,
  type Quote,
  type WatchlistResponse,
} from "../api/market";
import "./Watchlist.css";

type WatchlistItem = WatchlistResponse["items"][number];

type ViewState = {
  isLoading: boolean;
  error: string;
};

function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value?: string): string {
  if (!value) {
    return "Pending sync";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const Watchlist: React.FC = () => {
  const history = useHistory();
  const traderId = getCurrentTraderId();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [query, setQuery] = useState("");
  const [pendingSymbol, setPendingSymbol] = useState("");
  const [viewState, setViewState] = useState<ViewState>({
    isLoading: true,
    error: "",
  });

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toUpperCase();

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) => item.symbol.includes(normalizedQuery));
  }, [items, query]);

  const loadWatchlist = useCallback(async () => {
    if (!traderId) {
      setItems([]);
      setViewState({
        isLoading: false,
        error: "You must sign in as a trader to view your watchlist.",
      });
      return;
    }

    setViewState({ isLoading: true, error: "" });

    try {
      const watchlist = await getWatchlist(traderId);
      setItems(
        watchlist.items.map((item) => ({
          ...item,
          symbol: item.symbol.toUpperCase(),
        })),
      );
      setViewState({ isLoading: false, error: "" });
    } catch (requestError) {
      setViewState({
        isLoading: false,
        error:
          requestError instanceof Error
            ? requestError.message
        : "Unable to load your watchlist.",
      });
    }
  }, [traderId]);

  useEffect(() => {
    void loadWatchlist();
  }, [loadWatchlist]);

  useIonViewWillEnter(() => {
    void loadWatchlist();
  });

  useEffect(() => {
    const refreshWatchlist = () => {
      void loadWatchlist();
    };

    window.addEventListener(WATCHLIST_CHANGE_EVENT, refreshWatchlist);
    window.addEventListener("focus", refreshWatchlist);

    return () => {
      window.removeEventListener(WATCHLIST_CHANGE_EVENT, refreshWatchlist);
      window.removeEventListener("focus", refreshWatchlist);
    };
  }, [loadWatchlist]);

  const removeItem = async (symbol: string) => {
    if (!traderId) {
      setViewState({
        isLoading: false,
        error: "You must sign in as a trader to manage your watchlist.",
      });
      return;
    }

    const normalizedSymbol = symbol.toUpperCase();

    if (!window.confirm(`Remove ${normalizedSymbol} from your watchlist?`)) {
      return;
    }

    setPendingSymbol(normalizedSymbol);
    setViewState((currentState) => ({ ...currentState, error: "" }));

    try {
      await removeWatchlistItem(traderId, normalizedSymbol);
      setItems((currentItems) =>
        currentItems.filter((item) => item.symbol !== normalizedSymbol),
      );
    } catch (requestError) {
      setViewState({
        isLoading: false,
        error:
          requestError instanceof Error
            ? requestError.message
            : "Unable to remove this instrument from your watchlist.",
      });
    } finally {
      setPendingSymbol("");
    }
  };

  return (
    <IonPage>
      <NavBar />
      <IonContent fullscreen className="watchlist-content">
        <main className="watchlist-shell">
          <header className="watchlist-header">
            <div>
              <span className="watchlist-eyebrow">Watchlist</span>
              <h1>Your tracked instruments</h1>
              <p>
                Review saved stocks with the latest quote cached by
                market-service.
              </p>
            </div>
            <IonButton
              className="watchlist-refresh-button"
              disabled={viewState.isLoading}
              onClick={() => void loadWatchlist()}
            >
              <IonIcon slot="start" icon={refreshOutline} />
              Refresh
            </IonButton>
          </header>

          {viewState.error && (
            <section className="watchlist-alert" role="alert">
              <IonIcon icon={alertCircleOutline} />
              <span>{viewState.error}</span>
            </section>
          )}

          <section className="watchlist-toolbar">
            <div className="watchlist-search">
              <IonIcon icon={searchOutline} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search saved symbol"
              />
            </div>
            <span>{filteredItems.length} instruments tracked</span>
          </section>

          {viewState.isLoading ? (
            <section className="watchlist-loading">
              <IonSpinner name="crescent" />
              <span>Loading watchlist</span>
            </section>
          ) : filteredItems.length ? (
            <section className="watchlist-grid">
              {filteredItems.map((item) => (
                <WatchlistCard
                  key={item.symbol}
                  item={item}
                  isRemoving={pendingSymbol === item.symbol}
                  onOpen={() =>
                    history.push(
                      `/markets/${item.quote?.symbol ? "NASDAQ" : "NASDAQ"}/instruments/${item.symbol}`,
                    )
                  }
                  onRemove={() => void removeItem(item.symbol)}
                />
              ))}
            </section>
          ) : (
            <section className="watchlist-empty">
              <IonIcon icon={starOutline} />
              <h2>No instruments saved yet</h2>
              <p>
                Add stocks from the Market section to start following their
                latest price, bid, ask and spread.
              </p>
              <IonButton
                className="watchlist-empty-action"
                onClick={() => history.push("/markets")}
              >
                Browse markets
              </IonButton>
            </section>
          )}
        </main>
      </IonContent>
    </IonPage>
  );
};

type WatchlistCardProps = {
  item: WatchlistItem;
  isRemoving: boolean;
  onOpen: () => void;
  onRemove: () => void;
};

const WatchlistCard: React.FC<WatchlistCardProps> = ({
  item,
  isRemoving,
  onOpen,
  onRemove,
}) => {
  const quote = item.quote;

  return (
    <article className="watchlist-card">
      <button type="button" className="watchlist-card-main" onClick={onOpen}>
        <span className="watchlist-symbol">{item.symbol}</span>
        <span>
          <strong>{item.symbol}</strong>
          <small>Added {formatDateTime(item.addedAt)}</small>
        </span>
      </button>

      <div className="watchlist-card-metrics">
        <QuoteMetric label="Price" quote={quote} field="price" />
        <QuoteMetric label="Bid" quote={quote} field="bid" />
        <QuoteMetric label="Ask" quote={quote} field="ask" />
        <QuoteMetric label="Spread" quote={quote} field="spread" />
      </div>

      <footer className="watchlist-card-footer">
        <span>
          <IonIcon icon={trendingUpOutline} />
          {quote
            ? `${quote.provider} - ${formatDateTime(quote.asOf)}`
            : "Quote pending"}
        </span>
        <button
          type="button"
          className="watchlist-remove-button"
          disabled={isRemoving}
          onClick={onRemove}
        >
          <IonIcon icon={closeCircleOutline} />
          {isRemoving ? "Removing" : "Remove"}
        </button>
      </footer>
    </article>
  );
};

type QuoteMetricProps = {
  label: string;
  quote?: Quote;
  field: "price" | "bid" | "ask" | "spread";
};

const QuoteMetric: React.FC<QuoteMetricProps> = ({ label, quote, field }) => {
  const value = quote
    ? field === "spread"
      ? quote.spread.toFixed(2)
      : formatCurrency(quote[field], quote.currency)
    : "Pending";

  return (
    <div className="watchlist-metric">
      <span>
        <IonIcon icon={cashOutline} />
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
};

export default Watchlist;
