CREATE TABLE IF NOT EXISTS trading_order (
  id BIGINT NOT NULL AUTO_INCREMENT,
  order_reference VARCHAR(36) NOT NULL,
  trader_id BIGINT NOT NULL,
  side VARCHAR(16) NOT NULL,
  order_type VARCHAR(24) NOT NULL,
  status VARCHAR(24) NOT NULL,
  symbol VARCHAR(16) NOT NULL,
  exchange_id BIGINT NOT NULL,
  quantity DECIMAL(18,6) NOT NULL,
  estimated_unit_price DECIMAL(18,2) NOT NULL,
  gross_amount DECIMAL(18,2) NOT NULL,
  reserved_amount DECIMAL(18,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  rejection_reason VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_trading_order_reference (order_reference),
  INDEX idx_trading_order_trader_id (trader_id),
  INDEX idx_trading_order_symbol (symbol),
  INDEX idx_trading_order_status (status),
  INDEX idx_trading_order_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS trading_order_status_event (
  id BIGINT NOT NULL AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  order_reference VARCHAR(36) NOT NULL,
  from_status VARCHAR(24) NULL,
  to_status VARCHAR(24) NOT NULL,
  actor_type VARCHAR(24) NOT NULL,
  actor_id VARCHAR(64) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_order_status_event_order_id (order_id),
  INDEX idx_order_status_event_reference (order_reference),
  INDEX idx_order_status_event_created_at (created_at),
  CONSTRAINT fk_order_status_event_order
    FOREIGN KEY (order_id) REFERENCES trading_order(id)
);
