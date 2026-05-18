CREATE TABLE IF NOT EXISTS wallet (
  id BIGINT NOT NULL AUTO_INCREMENT,
  trader_id BIGINT NOT NULL,
  balance DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  available_balance DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  reserved_balance DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_wallet_trader_id (trader_id)
);

ALTER TABLE wallet
  ADD COLUMN available_balance DECIMAL(18,2) NOT NULL DEFAULT 0.00;

ALTER TABLE wallet
  ADD COLUMN reserved_balance DECIMAL(18,2) NOT NULL DEFAULT 0.00;

CREATE TABLE IF NOT EXISTS funds_validation_event (
  id BIGINT NOT NULL AUTO_INCREMENT,
  trader_id BIGINT NOT NULL,
  validation_type VARCHAR(50) NOT NULL,
  approved BOOLEAN NOT NULL,
  required_amount DECIMAL(18,2) NOT NULL,
  available_amount DECIMAL(18,2) NOT NULL,
  reserved_amount DECIMAL(18,2) NOT NULL,
  reason VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_funds_validation_event_trader_id (trader_id),
  INDEX idx_funds_validation_event_created_at (created_at)
);

INSERT INTO wallet (trader_id, balance, currency, available_balance, reserved_balance)
VALUES (101, 1000.00, 'USD', 1000.00, 0.00)
ON DUPLICATE KEY UPDATE
  currency = VALUES(currency);
