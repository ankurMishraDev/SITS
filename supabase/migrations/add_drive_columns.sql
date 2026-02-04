-- Migration: Add Google Drive integration columns
-- Run this on existing database to add Drive folder support

-- Add drive_folder_id to parties table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'parties' AND column_name = 'drive_folder_id'
    ) THEN
        ALTER TABLE parties ADD COLUMN drive_folder_id VARCHAR(100);
    END IF;
END $$;

-- Add drive columns to trips table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trips' AND column_name = 'drive_folder_id'
    ) THEN
        ALTER TABLE trips ADD COLUMN drive_folder_id VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trips' AND column_name = 'drive_folder_name'
    ) THEN
        ALTER TABLE trips ADD COLUMN drive_folder_name VARCHAR(50);
    END IF;
END $$;

-- Add drive columns to pods table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pods' AND column_name = 'drive_file_id'
    ) THEN
        ALTER TABLE pods ADD COLUMN drive_file_id VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pods' AND column_name = 'file_name'
    ) THEN
        ALTER TABLE pods ADD COLUMN file_name VARCHAR(255);
    END IF;
END $$;

-- Verify the changes
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('parties', 'trips', 'pods') 
AND column_name IN ('drive_folder_id', 'drive_folder_name', 'drive_file_id', 'file_name')
ORDER BY table_name, column_name;
