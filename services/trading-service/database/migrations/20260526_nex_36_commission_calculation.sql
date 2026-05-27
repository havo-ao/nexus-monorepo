CREATE TABLE IF NOT EXISTS commission_calculation_event (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  trader_id BIGINT NOT NULL,
  order_reference VARCHAR(36) NULL,
  side VARCHAR(16) NOT NULL,
  order_type VARCHAR(24) NOT NULL,
  gross_amount DECIMAL(18, 2) NOT NULL,
  rate_bps INT NOT NULL,
  commission_amount DECIMAL(18, 2) NOT NULL,
  net_amount DECIMAL(18, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_commission_calculation_trader (trader_id),
  INDEX idx_commission_calculation_order_reference (order_reference),
  INDEX idx_commission_calculation_created_at (created_at)
);
