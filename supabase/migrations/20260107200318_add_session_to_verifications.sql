/*
  # Add session support to verifications

  1. Changes
    - Add `session_id` column to `verifications` table
      - UUID type
      - Nullable (for backward compatibility with existing data)
      - Allows grouping multiple armoire verifications into a single session
    - Add index for performance
    
  2. Purpose
    - Enable creating multiple armoire verifications in one session
    - Allow validating all verifications in a session together
    - Support signing a single report for all verifications in a session
  
  3. Notes
    - Existing records will have NULL session_id (treated as single-armoire sessions)
    - New multi-armoire sessions will share the same session_id
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verifications' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE verifications ADD COLUMN session_id uuid;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_verifications_session_id ON verifications(session_id);
