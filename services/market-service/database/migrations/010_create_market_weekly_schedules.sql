CREATE TABLE IF NOT EXISTS market_weekly_schedules (
  market_code VARCHAR(16) NOT NULL,
  day_of_week TINYINT UNSIGNED NOT NULL,
  is_open BOOLEAN NOT NULL DEFAULT FALSE,
  open_hour TINYINT UNSIGNED NOT NULL,
  open_minute TINYINT UNSIGNED NOT NULL,
  close_hour TINYINT UNSIGNED NOT NULL,
  close_minute TINYINT UNSIGNED NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (market_code, day_of_week),
  CONSTRAINT fk_market_weekly_schedules_market
    FOREIGN KEY (market_code)
    REFERENCES market_hours_configs (market_code)
    ON DELETE CASCADE,
  CONSTRAINT chk_market_weekly_schedules_day
    CHECK (day_of_week BETWEEN 0 AND 6)
);

INSERT INTO market_weekly_schedules (
  market_code,
  day_of_week,
  is_open,
  open_hour,
  open_minute,
  close_hour,
  close_minute
)
SELECT
  config.market_code,
  days.day_of_week,
  JSON_CONTAINS(config.operating_days, CAST(days.day_of_week AS CHAR), '$'),
  config.open_hour,
  config.open_minute,
  config.close_hour,
  config.close_minute
FROM market_hours_configs config
JOIN (
  SELECT 0 AS day_of_week UNION ALL
  SELECT 1 UNION ALL
  SELECT 2 UNION ALL
  SELECT 3 UNION ALL
  SELECT 4 UNION ALL
  SELECT 5 UNION ALL
  SELECT 6
) days
ON TRUE
ON DUPLICATE KEY UPDATE
  is_open = VALUES(is_open),
  open_hour = VALUES(open_hour),
  open_minute = VALUES(open_minute),
  close_hour = VALUES(close_hour),
  close_minute = VALUES(close_minute);
