CREATE TABLE IF NOT EXISTS market_hours_configs (
  market_code VARCHAR(16) PRIMARY KEY,
  timezone VARCHAR(80) NOT NULL,
  open_hour TINYINT UNSIGNED NOT NULL,
  open_minute TINYINT UNSIGNED NOT NULL,
  close_hour TINYINT UNSIGNED NOT NULL,
  close_minute TINYINT UNSIGNED NOT NULL,
  operating_days JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_restrictions (
  market_code VARCHAR(16) NOT NULL,
  restriction_date DATE NOT NULL,
  status ENUM('CLOSED', 'RESTRICTED') NOT NULL,
  reason VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (market_code, restriction_date),
  CONSTRAINT fk_market_restrictions_market
    FOREIGN KEY (market_code)
    REFERENCES market_hours_configs (market_code)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS market_configuration_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  market_code VARCHAR(16) NOT NULL,
  change_type ENUM('SCHEDULE_CONFIGURED', 'RESTRICTION_CONFIGURED') NOT NULL,
  actor VARCHAR(120) NOT NULL,
  context VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_market_configuration_events_market_code (market_code)
);
