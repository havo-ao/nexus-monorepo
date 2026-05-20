CREATE TABLE IF NOT EXISTS portfolio_position (
  id BIGINT NOT NULL AUTO_INCREMENT,
  trader_id BIGINT NOT NULL,
  stock_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  avg_buy_price DECIMAL(18,2) NOT NULL,
  total_invested DECIMAL(18,2) NOT NULL,
  last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_portfolio_position_trader_stock (trader_id, stock_id),
  INDEX idx_portfolio_position_trader_id (trader_id),
  INDEX idx_portfolio_position_stock_id (stock_id)
);

CREATE TABLE IF NOT EXISTS portfolio_position_movement (
  id BIGINT NOT NULL AUTO_INCREMENT,
  trader_id BIGINT NOT NULL,
  stock_id BIGINT NOT NULL,
  position_id BIGINT NOT NULL,
  movement_type VARCHAR(20) NOT NULL,
  quantity INT NOT NULL,
  execution_price DECIMAL(18,2) NOT NULL,
  gross_amount DECIMAL(18,2) NOT NULL,
  source_order_id BIGINT NULL,
  source_transaction_id BIGINT NULL,
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_position_movement_trader_id (trader_id),
  INDEX idx_position_movement_position_id (position_id),
  INDEX idx_position_movement_source_transaction_id (source_transaction_id)
);
