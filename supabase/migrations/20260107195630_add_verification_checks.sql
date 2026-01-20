/*
  # Add verification check fields to verification_systemes table

  1. New Columns
    - `pression_ok` (boolean, default true) - Pression OK status
    - `etat_tube` (text, default 'Bon') - Tube condition: Bon, Pincé, Défectueux
    - `tete_sprinkler_ok` (boolean, default true) - Sprinkler head status
    - `sirene_flash_ok` (boolean, default true) - Siren/flash status
    - `batterie_changee` (boolean, default true) - Battery changed status
    - `etat_environnement` (text array) - Environment conditions: Poussière, Corrosion, Autre
    - `etat_environnement_autre` (text) - Additional environment details when "Autre" selected

  2. Changes
    - Add enum type for tube condition
    - Add columns with appropriate defaults
*/

-- Create enum type for tube condition
DO $$ BEGIN
  CREATE TYPE etat_tube_type AS ENUM ('Bon', 'Pincé', 'Défectueux');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to verification_systemes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_systemes' AND column_name = 'pression_ok'
  ) THEN
    ALTER TABLE verification_systemes ADD COLUMN pression_ok boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_systemes' AND column_name = 'etat_tube'
  ) THEN
    ALTER TABLE verification_systemes ADD COLUMN etat_tube etat_tube_type DEFAULT 'Bon';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_systemes' AND column_name = 'tete_sprinkler_ok'
  ) THEN
    ALTER TABLE verification_systemes ADD COLUMN tete_sprinkler_ok boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_systemes' AND column_name = 'sirene_flash_ok'
  ) THEN
    ALTER TABLE verification_systemes ADD COLUMN sirene_flash_ok boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_systemes' AND column_name = 'batterie_changee'
  ) THEN
    ALTER TABLE verification_systemes ADD COLUMN batterie_changee boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_systemes' AND column_name = 'etat_environnement'
  ) THEN
    ALTER TABLE verification_systemes ADD COLUMN etat_environnement text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_systemes' AND column_name = 'etat_environnement_autre'
  ) THEN
    ALTER TABLE verification_systemes ADD COLUMN etat_environnement_autre text;
  END IF;
END $$;
