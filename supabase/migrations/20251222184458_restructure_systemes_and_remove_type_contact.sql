/*
  # Restructure system tables and remove type_contact

  1. Changes to armoires table
    - Drop type_contact field from armoires
  
  2. Changes to installations table
    - Drop type_contact field
  
  3. Changes to releve_systemes table
    - Drop old type_contact field
    - Rename pressostat to pressostat_type
    - Add pressostat boolean field
    - Change tube from text to boolean
    - Add tete_sprinkler boolean field
    - Add tete_sprinkler_quantite integer field
    - Rename temperature_sprinkler to tete_sprinkler_temperature
    - Add sirene_flash boolean field
  
  4. Changes to installation_systemes table
    - Drop type_contact field
    - Rename pressostat to pressostat_type
    - Add pressostat boolean field
    - Change tube from text to boolean
    - Add tete_sprinkler boolean field
    - Add tete_sprinkler_quantite integer field
    - Rename temperature_sprinkler to tete_sprinkler_temperature
  
  5. Changes to verification_systemes table
    - Drop type_contact field
    - Rename pressostat to pressostat_type
    - Add pressostat boolean field
    - Change tube from text to boolean
    - Add tete_sprinkler boolean field
    - Add tete_sprinkler_quantite integer field
    - Rename temperature_sprinkler to tete_sprinkler_temperature
  
  3. Notes
    - This restructures the system selection to use checkboxes for products
    - Pressostat is now a boolean checkbox with a type (NO/NF) when checked
    - Tube is now a simple boolean checkbox
    - Tête sprinkler is a checkbox with quantity and temperature
    - Sirene flash is added as a checkbox
*/

-- Drop type_contact from armoires
ALTER TABLE armoires DROP COLUMN IF EXISTS type_contact;

-- Drop type_contact from installations
ALTER TABLE installations DROP COLUMN IF EXISTS type_contact;

-- Restructure releve_systemes
DO $$
BEGIN
  -- Drop old type_contact
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'releve_systemes' AND column_name = 'type_contact'
  ) THEN
    ALTER TABLE releve_systemes DROP COLUMN type_contact;
  END IF;

  -- Rename pressostat to pressostat_type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'releve_systemes' AND column_name = 'pressostat'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'releve_systemes' AND column_name = 'pressostat_type'
  ) THEN
    ALTER TABLE releve_systemes RENAME COLUMN pressostat TO pressostat_type;
  END IF;

  -- Add pressostat boolean
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'releve_systemes' AND column_name = 'pressostat'
  ) THEN
    ALTER TABLE releve_systemes ADD COLUMN pressostat boolean DEFAULT false;
  END IF;

  -- Change tube to boolean (drop and recreate)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'releve_systemes' AND column_name = 'tube' AND data_type = 'text'
  ) THEN
    ALTER TABLE releve_systemes DROP COLUMN tube;
    ALTER TABLE releve_systemes ADD COLUMN tube boolean DEFAULT false;
  END IF;

  -- Add tete_sprinkler boolean
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'releve_systemes' AND column_name = 'tete_sprinkler'
  ) THEN
    ALTER TABLE releve_systemes ADD COLUMN tete_sprinkler boolean DEFAULT false;
  END IF;

  -- Add tete_sprinkler_quantite
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'releve_systemes' AND column_name = 'tete_sprinkler_quantite'
  ) THEN
    ALTER TABLE releve_systemes ADD COLUMN tete_sprinkler_quantite integer DEFAULT 1;
  END IF;

  -- Rename temperature_sprinkler to tete_sprinkler_temperature
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'releve_systemes' AND column_name = 'temperature_sprinkler'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'releve_systemes' AND column_name = 'tete_sprinkler_temperature'
  ) THEN
    ALTER TABLE releve_systemes RENAME COLUMN temperature_sprinkler TO tete_sprinkler_temperature;
  END IF;

  -- Add sirene_flash boolean
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'releve_systemes' AND column_name = 'sirene_flash'
  ) THEN
    ALTER TABLE releve_systemes ADD COLUMN sirene_flash boolean DEFAULT false;
  END IF;
END $$;

-- Restructure installation_systemes
DO $$
BEGIN
  -- Drop type_contact
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installation_systemes' AND column_name = 'type_contact'
  ) THEN
    ALTER TABLE installation_systemes DROP COLUMN type_contact;
  END IF;

  -- Rename pressostat to pressostat_type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installation_systemes' AND column_name = 'pressostat'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installation_systemes' AND column_name = 'pressostat_type'
  ) THEN
    ALTER TABLE installation_systemes RENAME COLUMN pressostat TO pressostat_type;
  END IF;

  -- Add pressostat boolean
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installation_systemes' AND column_name = 'pressostat'
  ) THEN
    ALTER TABLE installation_systemes ADD COLUMN pressostat boolean DEFAULT false;
  END IF;

  -- Change tube to boolean
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installation_systemes' AND column_name = 'tube' AND data_type = 'text'
  ) THEN
    ALTER TABLE installation_systemes DROP COLUMN tube;
    ALTER TABLE installation_systemes ADD COLUMN tube boolean DEFAULT false;
  END IF;

  -- Add tete_sprinkler boolean
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installation_systemes' AND column_name = 'tete_sprinkler'
  ) THEN
    ALTER TABLE installation_systemes ADD COLUMN tete_sprinkler boolean DEFAULT false;
  END IF;

  -- Add tete_sprinkler_quantite
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installation_systemes' AND column_name = 'tete_sprinkler_quantite'
  ) THEN
    ALTER TABLE installation_systemes ADD COLUMN tete_sprinkler_quantite integer DEFAULT 1;
  END IF;

  -- Rename temperature_sprinkler to tete_sprinkler_temperature
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installation_systemes' AND column_name = 'temperature_sprinkler'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installation_systemes' AND column_name = 'tete_sprinkler_temperature'
  ) THEN
    ALTER TABLE installation_systemes RENAME COLUMN temperature_sprinkler TO tete_sprinkler_temperature;
  END IF;
END $$;

-- Restructure verification_systemes
DO $$
BEGIN
  -- Drop type_contact
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_systemes' AND column_name = 'type_contact'
  ) THEN
    ALTER TABLE verification_systemes DROP COLUMN type_contact;
  END IF;

  -- Rename pressostat to pressostat_type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_systemes' AND column_name = 'pressostat'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_systemes' AND column_name = 'pressostat_type'
  ) THEN
    ALTER TABLE verification_systemes RENAME COLUMN pressostat TO pressostat_type;
  END IF;

  -- Add pressostat boolean
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_systemes' AND column_name = 'pressostat'
  ) THEN
    ALTER TABLE verification_systemes ADD COLUMN pressostat boolean DEFAULT false;
  END IF;

  -- Change tube to boolean
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_systemes' AND column_name = 'tube' AND data_type = 'text'
  ) THEN
    ALTER TABLE verification_systemes DROP COLUMN tube;
    ALTER TABLE verification_systemes ADD COLUMN tube boolean DEFAULT false;
  END IF;

  -- Add tete_sprinkler boolean
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_systemes' AND column_name = 'tete_sprinkler'
  ) THEN
    ALTER TABLE verification_systemes ADD COLUMN tete_sprinkler boolean DEFAULT false;
  END IF;

  -- Add tete_sprinkler_quantite
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_systemes' AND column_name = 'tete_sprinkler_quantite'
  ) THEN
    ALTER TABLE verification_systemes ADD COLUMN tete_sprinkler_quantite integer DEFAULT 1;
  END IF;

  -- Rename temperature_sprinkler to tete_sprinkler_temperature
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_systemes' AND column_name = 'temperature_sprinkler'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_systemes' AND column_name = 'tete_sprinkler_temperature'
  ) THEN
    ALTER TABLE verification_systemes RENAME COLUMN temperature_sprinkler TO tete_sprinkler_temperature;
  END IF;
END $$;
