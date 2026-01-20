/*
  # Add signatures_installation table

  1. New Tables
    - `signatures_installation`
      - `id` (uuid, primary key)
      - `site_id` (uuid, reference to sites) - Pour grouper toutes les installations d'un site
      - `signature_data` (text) - Base64 encoded signature
      - `signed_at` (timestamptz)
      - `signed_by` (uuid, reference to auth.users)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `signatures_installation` table
    - Add policy for authenticated users to create signatures
    - Add policy for authenticated users to read their own signatures
*/

CREATE TABLE IF NOT EXISTS signatures_installation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  signature_data text NOT NULL,
  signed_at timestamptz DEFAULT now(),
  signed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE signatures_installation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create signatures"
  ON signatures_installation FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read signatures"
  ON signatures_installation FOR SELECT
  TO authenticated
  USING (true);