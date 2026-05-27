CREATE TABLE IF NOT EXISTS broker_order_validation_event (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  order_reference VARCHAR(36) NOT NULL,
  broker_id BIGINT NOT NULL,
  decision VARCHAR(16) NOT NULL,
  from_status VARCHAR(24) NOT NULL,
  to_status VARCHAR(24) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_broker_validation_order_reference (order_reference),
  INDEX idx_broker_validation_broker (broker_id),
  INDEX idx_broker_validation_created_at (created_at)
);
