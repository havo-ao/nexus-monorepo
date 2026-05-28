CREATE TABLE IF NOT EXISTS market_representative_symbols (
  market_code VARCHAR(16) NOT NULL,
  symbol VARCHAR(24) NOT NULL,
  PRIMARY KEY (market_code, symbol),
  CONSTRAINT fk_market_representative_symbols_market
    FOREIGN KEY (market_code) REFERENCES market_catalog(code)
    ON DELETE CASCADE
);

INSERT IGNORE INTO market_representative_symbols (market_code, symbol) VALUES
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
  ('ASX', 'WBC');
