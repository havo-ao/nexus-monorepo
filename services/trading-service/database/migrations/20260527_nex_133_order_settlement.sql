CREATE TABLE IF NOT EXISTS order_settlement_event (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  order_reference VARCHAR(36) NOT NULL,
  broker_name VARCHAR(40) NOT NULL,
  external_order_id VARCHAR(80) NOT NULL,
  broker_status VARCHAR(32) NOT NULL,
  internal_status VARCHAR(24) NOT NULL,
  filled_quantity DECIMAL(18,6) NOT NULL,
  average_filled_price DECIMAL(18,2) NULL,
  settled_amount DECIMAL(18,2) NOT NULL,
  commission_amount DECIMAL(18,2) NOT NULL,
  net_amount DECIMAL(18,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_settlement_reference (order_reference),
  INDEX idx_order_settlement_external_order (external_order_id),
  INDEX idx_order_settlement_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS trading_notification_event (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_reference VARCHAR(36) NOT NULL,
  notification_type VARCHAR(40) NOT NULL,
  recipient_email VARCHAR(160) NULL,
  delivered BOOLEAN NOT NULL,
  reason VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_trading_notification_reference (order_reference),
  INDEX idx_trading_notification_created_at (created_at)
);
