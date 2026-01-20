/*
  # Add Documentation Tables

  1. New Tables
    - `fiches_techniques`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `image_url` (text, nullable)
      - `content` (jsonb, nullable)
      - `created_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `installation_reports`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `installation_id` (uuid, foreign key to installations, nullable)
      - `report_type` (text)
      - `title` (text)
      - `content` (jsonb)
      - `status` (text)
      - `created_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create fiches_techniques table
CREATE TABLE IF NOT EXISTS fiches_techniques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  image_url text,
  content jsonb DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create installation_reports table
CREATE TABLE IF NOT EXISTS installation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  installation_id uuid REFERENCES installations(id) ON DELETE SET NULL,
  report_type text NOT NULL DEFAULT 'installation',
  title text NOT NULL,
  content jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE fiches_techniques ENABLE ROW LEVEL SECURITY;
ALTER TABLE installation_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fiches_techniques
CREATE POLICY "Users can view all fiches"
  ON fiches_techniques FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own fiches"
  ON fiches_techniques FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own fiches"
  ON fiches_techniques FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own fiches"
  ON fiches_techniques FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for installation_reports
CREATE POLICY "Users can view all reports"
  ON installation_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own reports"
  ON installation_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own reports"
  ON installation_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own reports"
  ON installation_reports FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fiches_created_by ON fiches_techniques(created_by);
CREATE INDEX IF NOT EXISTS idx_fiches_created_at ON fiches_techniques(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_client_id ON installation_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_installation_id ON installation_reports(installation_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON installation_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON installation_reports(created_at DESC);