CREATE TABLE IF NOT EXISTS commission_distribution_event (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  trader_id BIGINT NOT NULL,
  broker_id BIGINT NOT NULL,
  order_reference VARCHAR(36) NULL,
  commission_amount DECIMAL(18, 2) NOT NULL,
  platform_amount DECIMAL(18, 2) NOT NULL,
  broker_amount DECIMAL(18, 2) NOT NULL,
  platform_share_bps INT NOT NULL,
  broker_share_bps INT NOT NULL,
  currency VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_commission_distribution_trader (trader_id),
  INDEX idx_commission_distribution_broker (broker_id),
  INDEX idx_commission_distribution_order_reference (order_reference),
  INDEX idx_commission_distribution_created_at (created_at)
);
