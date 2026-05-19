DELETE duplicate_history
FROM market_quote_history duplicate_history
INNER JOIN market_quote_history original_history
  ON duplicate_history.symbol = original_history.symbol
  AND duplicate_history.as_of = original_history.as_of
  AND duplicate_history.id > original_history.id;

SET @market_quote_history_unique_index_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'market_quote_history'
    AND INDEX_NAME = 'uq_market_quote_history_symbol_as_of'
);

SET @market_quote_history_unique_index_sql = IF(
  @market_quote_history_unique_index_exists = 0,
  'ALTER TABLE market_quote_history ADD UNIQUE KEY uq_market_quote_history_symbol_as_of (symbol, as_of)',
  'SELECT 1'
);

PREPARE market_quote_history_unique_index_statement
FROM @market_quote_history_unique_index_sql;

EXECUTE market_quote_history_unique_index_statement;

DEALLOCATE PREPARE market_quote_history_unique_index_statement;
