/*
  # Fix signed_by column type in signatures_releve table (version 2)

  1. Changes
    - Drop RLS policy that depends on signed_by
    - Drop foreign key constraint on signed_by column
    - Change signed_by column type from uuid to text
    - Recreate RLS policy without signed_by check (authenticated users can create signatures)
  
  2. Security
    - Policy updated to allow authenticated users to create signatures
    - The signed_by field now stores the client's name instead of user ID
*/

-- Drop the policy that depends on signed_by
DROP POLICY IF EXISTS "Users can create signatures" ON signatures_releve;

-- Drop the foreign key constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'signatures_releve_signed_by_fkey' 
    AND table_name = 'signatures_releve'
  ) THEN
    ALTER TABLE signatures_releve 
    DROP CONSTRAINT signatures_releve_signed_by_fkey;
  END IF;
END $$;

-- Change the column type from uuid to text
ALTER TABLE signatures_releve 
ALTER COLUMN signed_by TYPE text USING signed_by::text;

-- Recreate the policy for authenticated users
CREATE POLICY "Users can create signatures"
  ON signatures_releve
  FOR INSERT
  TO authenticated
  WITH CHECK (true);