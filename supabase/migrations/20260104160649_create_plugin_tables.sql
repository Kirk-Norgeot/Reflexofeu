/*
  # Create Plugin Tables for Technical Sheets

  1. New Tables
    - `cards`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `image_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `installation_reports`
      - `id` (uuid, primary key)
      - `client_id` (uuid, optional foreign key to clients)
      - `client_name` (text)
      - `client_contact` (text)
      - `project_name` (text)
      - `project_location` (text)
      - `installation_date` (date)
      - `status` (text)
      - Various protection and configuration fields (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `protected_equipment`
      - `id` (uuid, primary key)
      - `report_id` (uuid, foreign key to installation_reports)
      - `equipment_name` (text)
      - `equipment_type` (text)
      - `cylinder_count` (integer)
      - `volume` (numeric)
      - `agent_quantity` (numeric)
      - `notes` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
*/

-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cards"
  ON cards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert cards"
  ON cards FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cards"
  ON cards FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cards"
  ON cards FOR DELETE
  TO authenticated
  USING (true);

-- Create installation_reports table
CREATE TABLE IF NOT EXISTS installation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_contact text DEFAULT '',
  project_name text NOT NULL,
  project_location text DEFAULT '',
  installation_date date NOT NULL,
  status text DEFAULT 'draft',
  protection_armoire_commande boolean DEFAULT false,
  protection_tgbt boolean DEFAULT false,
  protection_armoire_condensateur boolean DEFAULT false,
  protection_machine_cnc boolean DEFAULT false,
  protection_stockage boolean DEFAULT false,
  protection_divers boolean DEFAULT false,
  protection_divers_description text DEFAULT '',
  elements_plans boolean DEFAULT false,
  elements_dimensions boolean DEFAULT false,
  elements_descriptions boolean DEFAULT false,
  elements_photos boolean DEFAULT false,
  classe_feu_a boolean DEFAULT false,
  classe_feu_b boolean DEFAULT false,
  classe_feu_c boolean DEFAULT false,
  pressostat_no boolean DEFAULT false,
  pressostat_nf boolean DEFAULT false,
  centrale_technique boolean DEFAULT false,
  monitoring_non_demande boolean DEFAULT false,
  monitoring_filaire boolean DEFAULT false,
  monitoring_sans_fil boolean DEFAULT false,
  detection_composants boolean DEFAULT false,
  detection_thermique_68c boolean DEFAULT false,
  diffuseurs_supplementaires boolean DEFAULT false,
  sirene_flash boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE installation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view installation reports"
  ON installation_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert installation reports"
  ON installation_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update installation reports"
  ON installation_reports FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete installation reports"
  ON installation_reports FOR DELETE
  TO authenticated
  USING (true);

-- Create protected_equipment table
CREATE TABLE IF NOT EXISTS protected_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES installation_reports(id) ON DELETE CASCADE,
  equipment_name text NOT NULL,
  equipment_type text DEFAULT '',
  cylinder_count integer DEFAULT 0,
  volume numeric DEFAULT 0,
  agent_quantity numeric DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE protected_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view protected equipment"
  ON protected_equipment FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert protected equipment"
  ON protected_equipment FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update protected equipment"
  ON protected_equipment FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete protected equipment"
  ON protected_equipment FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_installation_reports_client_id ON installation_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_installation_reports_status ON installation_reports(status);
CREATE INDEX IF NOT EXISTS idx_installation_reports_created_at ON installation_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_protected_equipment_report_id ON protected_equipment(report_id);
