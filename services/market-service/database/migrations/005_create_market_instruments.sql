CREATE TABLE IF NOT EXISTS market_instruments (
  symbol VARCHAR(24) NOT NULL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  market_code VARCHAR(16) NOT NULL,
  currency CHAR(3) NOT NULL,
  sector VARCHAR(80) NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_market_instruments_market
    FOREIGN KEY (market_code) REFERENCES market_catalog(code)
    ON DELETE RESTRICT
);

INSERT INTO market_instruments (
  symbol,
  name,
  market_code,
  currency,
  sector
) VALUES
  ('AAPL', 'Apple Inc.', 'NASDAQ', 'USD', 'Technology'),
  ('MSFT', 'Microsoft Corporation', 'NASDAQ', 'USD', 'Technology'),
  ('TSLA', 'Tesla Inc.', 'NASDAQ', 'USD', 'Consumer Cyclical'),
  ('JPM', 'JPMorgan Chase & Co.', 'NYSE', 'USD', 'Financial Services'),
  ('KO', 'The Coca-Cola Company', 'NYSE', 'USD', 'Consumer Defensive'),
  ('HSBC', 'HSBC Holdings plc', 'LSE', 'GBP', 'Financial Services')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  market_code = VALUES(market_code),
  currency = VALUES(currency),
  sector = VALUES(sector);
