/*
  # Create signatures verification table

  1. New Tables
    - `signatures_verification`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references verification sessions)
      - `signed_by` (text) - Name of person signing
      - `signature_data` (text) - Base64 encoded signature image
      - `created_at` (timestamp)
      
  2. Security
    - Enable RLS on `signatures_verification` table
    - Add policy for authenticated users to manage signatures
*/

CREATE TABLE IF NOT EXISTS signatures_verification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  signed_by text NOT NULL,
  signature_data text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE signatures_verification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signatures_verification"
  ON signatures_verification
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create signatures_verification"
  ON signatures_verification
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update signatures_verification"
  ON signatures_verification
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete signatures_verification"
  ON signatures_verification
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_signatures_verification_session_id ON signatures_verification(session_id);
