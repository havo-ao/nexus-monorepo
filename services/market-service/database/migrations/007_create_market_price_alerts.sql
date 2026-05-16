CREATE TABLE IF NOT EXISTS market_price_alerts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  trader_id VARCHAR(120) NOT NULL,
  symbol VARCHAR(24) NOT NULL,
  target_price DECIMAL(18, 6) NOT NULL,
  condition_type VARCHAR(24) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  triggered_at TIMESTAMP NULL,
  INDEX idx_market_price_alerts_trader_id (trader_id),
  INDEX idx_market_price_alerts_status (status),
  CONSTRAINT fk_market_price_alerts_instrument
    FOREIGN KEY (symbol) REFERENCES market_instruments(symbol)
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS market_price_alert_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  alert_id BIGINT UNSIGNED NOT NULL,
  trader_id VARCHAR(120) NOT NULL,
  symbol VARCHAR(24) NOT NULL,
  target_price DECIMAL(18, 6) NOT NULL,
  market_price DECIMAL(18, 6) NOT NULL,
  condition_type VARCHAR(24) NOT NULL,
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_market_price_alert_events_alert_id (alert_id),
  CONSTRAINT fk_market_price_alert_events_alert
    FOREIGN KEY (alert_id) REFERENCES market_price_alerts(id)
    ON DELETE CASCADE
);
