CREATE TABLE IF NOT EXISTS market_catalog (
  code VARCHAR(16) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  country VARCHAR(80) NOT NULL,
  currency CHAR(3) NOT NULL,
  timezone VARCHAR(80) NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_representative_symbols (
  market_code VARCHAR(16) NOT NULL,
  symbol VARCHAR(24) NOT NULL,
  PRIMARY KEY (market_code, symbol),
  CONSTRAINT fk_market_representative_symbols_market
    FOREIGN KEY (market_code) REFERENCES market_catalog(code)
    ON DELETE CASCADE
);

INSERT INTO market_catalog (
  code,
  name,
  country,
  currency,
  timezone
) VALUES
  ('NYSE', 'New York Stock Exchange', 'United States', 'USD', 'America/New_York'),
  ('NASDAQ', 'NASDAQ Stock Market', 'United States', 'USD', 'America/New_York'),
  ('LSE', 'London Stock Exchange', 'United Kingdom', 'GBP', 'Europe/London'),
  ('TSE', 'Tokyo Stock Exchange', 'Japan', 'JPY', 'Asia/Tokyo'),
  ('ASX', 'Australian Securities Exchange', 'Australia', 'AUD', 'Australia/Sydney')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  country = VALUES(country),
  currency = VALUES(currency),
  timezone = VALUES(timezone);

INSERT INTO market_representative_symbols (market_code, symbol) VALUES
  ('NYSE', 'AAPL'),
  ('NYSE', 'JPM'),
  ('NYSE', 'KO'),
  ('NASDAQ', 'MSFT'),
  ('NASDAQ', 'GOOGL'),
  ('NASDAQ', 'TSLA'),
  ('LSE', 'HSBC'),
  ('LSE', 'BP'),
  ('LSE', 'VOD'),
  ('TSE', '7203.T'),
  ('TSE', '6758.T'),
  ('TSE', '9984.T'),
  ('ASX', 'BHP'),
  ('ASX', 'CBA'),
  ('ASX', 'WBC')
ON DUPLICATE KEY UPDATE
  symbol = VALUES(symbol);
