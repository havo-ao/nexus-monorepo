CREATE TABLE IF NOT EXISTS market_exchange (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  country VARCHAR(80) NOT NULL,
  timezone VARCHAR(64) NOT NULL,
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS market_validation_event (
  id BIGINT NOT NULL AUTO_INCREMENT,
  exchange_id BIGINT NOT NULL,
  market_status VARCHAR(20) NOT NULL,
  can_operate BOOLEAN NOT NULL,
  evaluated_at TIMESTAMP NOT NULL,
  timezone VARCHAR(64) NULL,
  open_time VARCHAR(8) NULL,
  close_time VARCHAR(8) NULL,
  reason VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_market_validation_event_exchange_id (exchange_id),
  INDEX idx_market_validation_event_created_at (created_at)
);

INSERT INTO market_exchange (id, name, country, timezone, open_time, close_time)
VALUES (1, 'NYSE', 'United States', 'America/New_York', '09:30:00', '16:00:00')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  country = VALUES(country),
  timezone = VALUES(timezone),
  open_time = VALUES(open_time),
  close_time = VALUES(close_time);
