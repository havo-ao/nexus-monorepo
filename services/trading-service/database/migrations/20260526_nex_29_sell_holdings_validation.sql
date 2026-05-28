CREATE TABLE IF NOT EXISTS sell_holdings_validation_event (
  id BIGINT NOT NULL AUTO_INCREMENT,
  trader_id BIGINT NOT NULL,
  stock_id BIGINT NOT NULL,
  symbol VARCHAR(16) NULL,
  requested_quantity DECIMAL(18,6) NOT NULL,
  available_quantity DECIMAL(18,6) NOT NULL,
  approved BOOLEAN NOT NULL,
  reason VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_sell_holdings_validation_trader_stock (trader_id, stock_id),
  INDEX idx_sell_holdings_validation_created_at (created_at)
);
