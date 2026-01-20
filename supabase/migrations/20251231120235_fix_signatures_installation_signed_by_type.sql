/*
  # Fix signed_by column type in signatures_installation table

  1. Changes
    - Drop foreign key constraint on signed_by column
    - Change signed_by column type from uuid to text
    - This allows storing the signer's name instead of a user ID reference
  
  2. Security
    - No RLS changes needed
*/

-- Drop the foreign key constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'signatures_installation_signed_by_fkey' 
    AND table_name = 'signatures_installation'
  ) THEN
    ALTER TABLE signatures_installation 
    DROP CONSTRAINT signatures_installation_signed_by_fkey;
  END IF;
END $$;

-- Change the column type from uuid to text
ALTER TABLE signatures_installation 
ALTER COLUMN signed_by TYPE text USING signed_by::text;