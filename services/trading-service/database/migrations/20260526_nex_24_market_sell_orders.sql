ALTER TABLE trading_order
  ADD COLUMN stock_id BIGINT NULL AFTER exchange_id;
