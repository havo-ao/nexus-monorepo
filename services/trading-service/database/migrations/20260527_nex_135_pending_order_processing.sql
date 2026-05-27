CREATE TABLE IF NOT EXISTS pending_order_processing_event (
  id BIGINT NOT NULL AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  order_reference VARCHAR(36) NOT NULL,
  from_status VARCHAR(24) NOT NULL,
  to_status VARCHAR(24) NULL,
  symbol VARCHAR(16) NOT NULL,
  order_type VARCHAR(24) NOT NULL,
  market_status VARCHAR(24) NULL,
  market_price DECIMAL(18,2) NULL,
  trigger_price DECIMAL(18,2) NULL,
  matched BOOLEAN NOT NULL,
  action VARCHAR(40) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  evaluated_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_pending_order_processing_reference (order_reference),
  INDEX idx_pending_order_processing_status (from_status, to_status),
  INDEX idx_pending_order_processing_created_at (created_at),
  CONSTRAINT fk_pending_order_processing_order
    FOREIGN KEY (order_id) REFERENCES trading_order(id)
);
