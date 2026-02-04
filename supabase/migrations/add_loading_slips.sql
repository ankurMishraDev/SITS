-- Add Loading Slips table
-- Run this SQL in your Supabase SQL Editor

-- Create loading_slips table if it doesn't exist
CREATE TABLE IF NOT EXISTS loading_slips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    vehicle_no VARCHAR(20) NOT NULL,
    origin_place VARCHAR(255) NOT NULL,
    destination_place VARCHAR(255) NOT NULL,
    trip_date DATE NOT NULL,
    freight_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    advance_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    material_description TEXT,
    lr_no VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_loading_slips_party_id ON loading_slips(party_id);
CREATE INDEX IF NOT EXISTS idx_loading_slips_trip_date ON loading_slips(trip_date);
CREATE INDEX IF NOT EXISTS idx_loading_slips_lr_no ON loading_slips(lr_no);

-- Ensure trigger function exists and is up to date
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it already exists, then recreate
DROP TRIGGER IF EXISTS update_loading_slips_updated_at ON loading_slips;

CREATE TRIGGER update_loading_slips_updated_at
    BEFORE UPDATE ON loading_slips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (idempotent)
ALTER TABLE loading_slips ENABLE ROW LEVEL SECURITY;

-- Create policy (idempotent: will only create if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'loading_slips'
      AND policyname = 'Enable all operations for loading_slips'
  ) THEN
    CREATE POLICY "Enable all operations for loading_slips" ON loading_slips
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END;
$$;
