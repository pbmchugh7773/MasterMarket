-- Migration script to add country field to community_prices table
-- Run this against your PostgreSQL database

-- Add country column to community_prices table
ALTER TABLE community_prices ADD COLUMN IF NOT EXISTS country VARCHAR DEFAULT 'UK';

-- Update existing records to have UK as default country
-- (This assumes most existing data is from UK users)
UPDATE community_prices SET country = 'UK' WHERE country IS NULL;

-- Verify the migration
SELECT 
    COUNT(*) as total_records,
    country,
    COUNT(*) as records_per_country
FROM community_prices 
GROUP BY country;

-- Show table structure
\d community_prices;