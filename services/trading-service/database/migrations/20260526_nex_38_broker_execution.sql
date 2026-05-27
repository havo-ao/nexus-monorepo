CREATE TABLE IF NOT EXISTS broker_execution_event (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  order_reference VARCHAR(36) NOT NULL,
  broker_name VARCHAR(40) NOT NULL,
  external_order_id VARCHAR(80) NOT NULL,
  request_summary VARCHAR(255) NOT NULL,
  response_summary VARCHAR(255) NOT NULL,
  broker_status VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_broker_execution_order_reference (order_reference),
  INDEX idx_broker_execution_external_order_id (external_order_id),
  INDEX idx_broker_execution_created_at (created_at)
);
