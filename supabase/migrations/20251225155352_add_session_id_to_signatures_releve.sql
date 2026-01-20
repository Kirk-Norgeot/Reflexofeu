/*
  # Add session_id to signatures_releve table

  1. Changes
    - Add `session_id` column to `signatures_releve` table
      - UUID type
      - Nullable
      - Allows signing either a single releve or an entire session
    - Make `releve_id` nullable (since we can now sign by session_id)
    
  2. Purpose
    - Enable signing multiple armoires in one session together
    - Maintain backward compatibility with single-releve signatures
  
  3. Notes
    - Either releve_id OR session_id should be set (not both)
    - Existing signatures remain unchanged (releve_id only)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signatures_releve' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE signatures_releve ADD COLUMN session_id uuid;
  END IF;
END $$;

DO $$
BEGIN
  ALTER TABLE signatures_releve ALTER COLUMN releve_id DROP NOT NULL;
EXCEPTION
  WHEN others THEN
    NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_signatures_releve_session_id ON signatures_releve(session_id);