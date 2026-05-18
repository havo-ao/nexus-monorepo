DELETE duplicate_history
FROM market_quote_history duplicate_history
INNER JOIN market_quote_history original_history
  ON duplicate_history.symbol = original_history.symbol
  AND duplicate_history.as_of = original_history.as_of
  AND duplicate_history.id > original_history.id;

ALTER TABLE market_quote_history
  DROP INDEX idx_market_quote_history_symbol_as_of;

ALTER TABLE market_quote_history
  ADD UNIQUE KEY uq_market_quote_history_symbol_as_of (symbol, as_of);
