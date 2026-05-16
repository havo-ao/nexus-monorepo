CREATE TABLE IF NOT EXISTS market_watchlist_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  trader_id VARCHAR(120) NOT NULL,
  symbol VARCHAR(24) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_market_watchlist_trader_symbol (trader_id, symbol),
  INDEX idx_market_watchlist_trader_id (trader_id),
  CONSTRAINT fk_market_watchlist_items_instrument
    FOREIGN KEY (symbol) REFERENCES market_instruments(symbol)
    ON DELETE RESTRICT
);
