/*
  # Create verification-photos storage bucket

  1. Changes
    - Create new public storage bucket for verification photos
    - Set up RLS policies for authenticated users
    
  2. Security
    - Authenticated users can upload files
    - Authenticated users can read files
    - Authenticated users can delete files
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-photos', 'verification-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload verification photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'verification-photos');

CREATE POLICY "Authenticated users can read verification photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'verification-photos');

CREATE POLICY "Authenticated users can delete verification photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'verification-photos');

CREATE POLICY "Public can read verification photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'verification-photos');
