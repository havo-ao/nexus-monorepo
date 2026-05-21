ALTER TABLE market_instruments
  ADD COLUMN asset_type VARCHAR(80) NULL AFTER status,
  ADD COLUMN industry VARCHAR(120) NULL AFTER asset_type,
  ADD COLUMN country VARCHAR(80) NULL AFTER industry,
  ADD COLUMN description TEXT NULL AFTER country,
  ADD COLUMN metadata_provider VARCHAR(80) NULL AFTER description,
  ADD COLUMN metadata_updated_at TIMESTAMP NULL AFTER metadata_provider;
