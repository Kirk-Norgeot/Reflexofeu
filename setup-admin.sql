-- ==========================================
-- Script SQL pour créer le compte admin
-- ==========================================
--
-- INSTRUCTIONS:
-- 1. Créez d'abord l'utilisateur dans Supabase Dashboard:
--    Authentication → Users → Add user
--    Email: kirk.norgeot@gmail.com
--    Password: Reflexofeu2828!
--
-- 2. Exécutez ensuite cette requête dans SQL Editor
--    pour définir le rôle admin
-- ==========================================

-- Mettre à jour le profil avec le rôle admin
UPDATE profiles
SET
  role = 'admin',
  full_name = 'NORGEOT Kirk',
  updated_at = now()
WHERE email = 'kirk.norgeot@gmail.com';

-- Vérifier que le compte a été créé correctement
SELECT
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE email = 'kirk.norgeot@gmail.com';

-- ==========================================
-- Script pour créer un utilisateur technicien
-- ==========================================
--
-- INSTRUCTIONS:
-- 1. Créez l'utilisateur dans Supabase Dashboard
-- 2. Remplacez 'technicien@exemple.fr' par l'email réel
-- 3. Exécutez cette requête
-- ==========================================

-- Exemple pour un technicien
-- UPDATE profiles
-- SET
--   role = 'technicien',
--   full_name = 'Jean Dupont',
--   updated_at = now()
-- WHERE email = 'technicien@exemple.fr';
