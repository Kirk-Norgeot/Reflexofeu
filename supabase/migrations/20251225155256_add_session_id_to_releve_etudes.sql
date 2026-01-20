/*
  # Add session_id to releve_etudes table

  1. Changes
    - Add `session_id` column to `releve_etudes` table
      - UUID type
      - Nullable (for backward compatibility with existing data)
      - Allows grouping multiple armoires into a single study session
    
  2. Purpose
    - Enable creating multiple armoires in one session
    - Allow validating all armoires in a session together
    - Support signing a single report for all armoires in a session
  
  3. Notes
    - Existing records will have NULL session_id (treated as single-armoire sessions)
    - New multi-armoire sessions will share the same session_id
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'releve_etudes' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE releve_etudes ADD COLUMN session_id uuid;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_releve_etudes_session_id ON releve_etudes(session_id);