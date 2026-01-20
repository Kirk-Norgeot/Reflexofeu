/*
  # Add pressostat field to system tables

  1. Changes
    - Add pressostat field (type_contact enum) to releve_systemes table
    - Add pressostat field (type_contact enum) to installation_systemes table
    - Add pressostat field (type_contact enum) to verification_systemes table
  
  2. Notes
    - pressostat stores whether the pressostat is NO (Normalement Ouvert) or NF (Normalement Fermé)
    - Uses existing type_contact enum type
*/

-- Add pressostat to releve_systemes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'releve_systemes' AND column_name = 'pressostat'
  ) THEN
    ALTER TABLE releve_systemes ADD COLUMN pressostat type_contact;
  END IF;
END $$;

-- Add pressostat to installation_systemes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installation_systemes' AND column_name = 'pressostat'
  ) THEN
    ALTER TABLE installation_systemes ADD COLUMN pressostat type_contact;
  END IF;
END $$;

-- Add pressostat to verification_systemes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_systemes' AND column_name = 'pressostat'
  ) THEN
    ALTER TABLE verification_systemes ADD COLUMN pressostat type_contact;
  END IF;
END $$;
