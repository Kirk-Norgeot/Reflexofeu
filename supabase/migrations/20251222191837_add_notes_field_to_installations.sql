/*
  # Add notes field to installations table

  1. Changes
    - Add `notes` text field to `installations` table for storing installation notes
  
  2. Notes
    - Field is optional (nullable)
    - No default value
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installations' AND column_name = 'notes'
  ) THEN
    ALTER TABLE installations ADD COLUMN notes text;
  END IF;
END $$;
