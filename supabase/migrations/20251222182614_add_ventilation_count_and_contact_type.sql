/*
  # Add ventilation count and contact type fields

  1. Changes
    - Add nb_ventilations field to armoires table
    - Add type_contact enum type (NO/NF)
    - Add type_contact field to armoires table
    - Add type_contact fields to installations table
    - Add type_contact fields to releve_systemes table
    - Add type_contact fields to installation_systemes table
    - Add type_contact fields to verification_systemes table
  
  2. Notes
    - nb_ventilations stores the number of ventilations
    - type_contact stores whether contact is NO (Normalement Ouvert) or NF (Normalement Fermé)
*/

-- Create enum type for contact type
DO $$ BEGIN
  CREATE TYPE type_contact AS ENUM ('NO', 'NF');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add nb_ventilations to armoires table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'armoires' AND column_name = 'nb_ventilations'
  ) THEN
    ALTER TABLE armoires ADD COLUMN nb_ventilations integer;
  END IF;
END $$;

-- Add type_contact to armoires table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'armoires' AND column_name = 'type_contact'
  ) THEN
    ALTER TABLE armoires ADD COLUMN type_contact type_contact;
  END IF;
END $$;

-- Add nb_ventilations to installations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installations' AND column_name = 'nb_ventilations'
  ) THEN
    ALTER TABLE installations ADD COLUMN nb_ventilations integer;
  END IF;
END $$;

-- Add type_contact to installations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installations' AND column_name = 'type_contact'
  ) THEN
    ALTER TABLE installations ADD COLUMN type_contact type_contact;
  END IF;
END $$;

-- Add type_contact to releve_systemes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'releve_systemes' AND column_name = 'type_contact'
  ) THEN
    ALTER TABLE releve_systemes ADD COLUMN type_contact type_contact;
  END IF;
END $$;

-- Add type_contact to installation_systemes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installation_systemes' AND column_name = 'type_contact'
  ) THEN
    ALTER TABLE installation_systemes ADD COLUMN type_contact type_contact;
  END IF;
END $$;

-- Add type_contact to verification_systemes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_systemes' AND column_name = 'type_contact'
  ) THEN
    ALTER TABLE verification_systemes ADD COLUMN type_contact type_contact;
  END IF;
END $$;
