-- Migration: Add annual_interest_rate and interest_type columns to investment_settings table
ALTER TABLE investment_settings 
ADD COLUMN IF NOT EXISTS annual_interest_rate NUMERIC DEFAULT 18.0,
ADD COLUMN IF NOT EXISTS interest_type TEXT DEFAULT 'simple';

-- Update existing rows so annual_interest_rate matches (monthly_interest_rate * 12) if null
UPDATE investment_settings 
SET annual_interest_rate = COALESCE(annual_interest_rate, monthly_interest_rate * 12, 18.0),
    interest_type = COALESCE(interest_type, 'simple')
WHERE annual_interest_rate IS NULL OR interest_type IS NULL;
