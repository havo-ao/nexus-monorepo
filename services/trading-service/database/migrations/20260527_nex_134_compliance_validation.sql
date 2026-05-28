CREATE TABLE IF NOT EXISTS compliance_validation_event (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  trader_id BIGINT NOT NULL,
  operation VARCHAR(50) NOT NULL,
  allowed BOOLEAN NOT NULL,
  status VARCHAR(40) NOT NULL,
  reason VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_compliance_validation_trader (trader_id),
  INDEX idx_compliance_validation_operation (operation),
  INDEX idx_compliance_validation_created_at (created_at)
);
