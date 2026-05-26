ALTER TABLE trading_order
  ADD COLUMN limit_price DECIMAL(18,2) NULL AFTER estimated_unit_price;
