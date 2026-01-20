/*
  # Add signatures table for releve etude

  1. New Tables
    - `signatures_releve`
      - `id` (uuid, primary key)
      - `releve_id` (uuid, foreign key to releve_etudes)
      - `signature_data` (text, base64 encoded signature image)
      - `signed_at` (timestamptz, timestamp when signed)
      - `signed_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `signatures_releve` table
    - Add policy for authenticated users to create signatures
    - Add policy for authenticated users to read signatures
*/

CREATE TABLE IF NOT EXISTS signatures_releve (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  releve_id uuid NOT NULL REFERENCES releve_etudes(id) ON DELETE CASCADE,
  signature_data text NOT NULL,
  signed_at timestamptz DEFAULT now(),
  signed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE signatures_releve ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create signatures"
  ON signatures_releve
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = signed_by);

CREATE POLICY "Users can read signatures"
  ON signatures_releve
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_signatures_releve_releve_id ON signatures_releve(releve_id);
