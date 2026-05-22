ALTER TABLE wallet_movement
  ADD COLUMN IF NOT EXISTS source_order_id VARCHAR(100) NULL;

ALTER TABLE wallet_movement
  ADD INDEX idx_wallet_movement_source_order_id (source_order_id);
