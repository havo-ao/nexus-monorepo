INSERT INTO market_hours_configs (
  market_code,
  timezone,
  open_hour,
  open_minute,
  close_hour,
  close_minute,
  operating_days
) VALUES
  ('NYSE', 'America/New_York', 9, 30, 16, 0, CAST('[1,2,3,4,5]' AS JSON)),
  ('NASDAQ', 'America/New_York', 9, 30, 16, 0, CAST('[1,2,3,4,5]' AS JSON))
ON DUPLICATE KEY UPDATE
  market_code = VALUES(market_code);

INSERT INTO market_restrictions (
  market_code,
  restriction_date,
  status,
  reason
) VALUES
  ('NYSE', '2026-05-25', 'CLOSED', 'Memorial Day market holiday'),
  ('NASDAQ', '2026-05-25', 'CLOSED', 'Memorial Day market holiday')
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  reason = VALUES(reason);

INSERT INTO market_configuration_events (
  market_code,
  change_type,
  actor,
  context
) VALUES
  ('NYSE', 'SCHEDULE_CONFIGURED', 'system', 'Default market-hours seed'),
  ('NASDAQ', 'SCHEDULE_CONFIGURED', 'system', 'Default market-hours seed');
