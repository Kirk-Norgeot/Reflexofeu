/*
  # Ajouter les champs de quantité pour pressostat et sirène flash

  1. Modifications
    - Ajouter la colonne `pressostat_quantite` aux tables:
      - `releve_systemes`
      - `installation_systemes`
      - `verification_systemes`
    - Ajouter la colonne `sirene_flash_quantite` aux tables:
      - `releve_systemes`
      - `installation_systemes`
      - `verification_systemes`
    - Modifier le type `type_contact` pour inclure 'NO/NF'
  
  2. Notes
    - Les champs sont optionnels (nullable)
    - Par défaut, pressostat_quantite = 1 si pressostat est vrai
    - Par défaut, sirene_flash_quantite = 1 si sirene_flash est vrai
*/

-- Modifier le type type_contact pour inclure 'NO/NF'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'type_contact' AND e.enumlabel = 'NO/NF'
  ) THEN
    ALTER TYPE type_contact ADD VALUE 'NO/NF';
  END IF;
END $$;

-- Ajouter les colonnes à releve_systemes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'releve_systemes' AND column_name = 'pressostat_quantite'
  ) THEN
    ALTER TABLE releve_systemes ADD COLUMN pressostat_quantite integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'releve_systemes' AND column_name = 'sirene_flash_quantite'
  ) THEN
    ALTER TABLE releve_systemes ADD COLUMN sirene_flash_quantite integer;
  END IF;
END $$;

-- Ajouter les colonnes à installation_systemes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installation_systemes' AND column_name = 'pressostat_quantite'
  ) THEN
    ALTER TABLE installation_systemes ADD COLUMN pressostat_quantite integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installation_systemes' AND column_name = 'sirene_flash_quantite'
  ) THEN
    ALTER TABLE installation_systemes ADD COLUMN sirene_flash_quantite integer;
  END IF;
END $$;

-- Ajouter les colonnes à verification_systemes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_systemes' AND column_name = 'pressostat_quantite'
  ) THEN
    ALTER TABLE verification_systemes ADD COLUMN pressostat_quantite integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_systemes' AND column_name = 'sirene_flash_quantite'
  ) THEN
    ALTER TABLE verification_systemes ADD COLUMN sirene_flash_quantite integer;
  END IF;
END $$;