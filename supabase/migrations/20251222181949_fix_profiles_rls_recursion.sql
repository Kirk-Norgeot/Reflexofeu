/*
  # Fix profiles RLS recursion issue

  1. Changes
    - Drop existing problematic policy
    - Create helper function to get user role without triggering RLS
    - Create new policy using the helper function
  
  2. Security
    - Helper function uses SECURITY DEFINER to bypass RLS
    - New policy maintains same security logic without recursion
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Profiles are viewable by owner or admin" ON profiles;

-- Create a helper function to get user role without triggering RLS
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$;

-- Create new policy without recursion
CREATE POLICY "Profiles are viewable by owner or admin"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR get_user_role(auth.uid()) = 'admin'
  );
