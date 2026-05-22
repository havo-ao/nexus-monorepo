CREATE TABLE IF NOT EXISTS wallet_movement (
  id BIGINT NOT NULL AUTO_INCREMENT,
  trader_id BIGINT NOT NULL,
  movement_type VARCHAR(20) NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  source_transaction_id VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_wallet_movement_trader_id (trader_id),
  INDEX idx_wallet_movement_source_transaction_id (source_transaction_id)
);
