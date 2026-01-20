import { uploadFile, deleteFile } from '@/lib/supabase';

export async function uploadPhotoToStorage(
  file: File,
  bucket: string = 'releve-photos'
): Promise<string | null> {
  const fileName = `${Date.now()}-${crypto.randomUUID()}-${file.name}`;
  return await uploadFile(bucket, fileName, file);
}

export async function deletePhotoFromStorage(
  url: string,
  bucket: string = 'releve-photos'
): Promise<boolean> {
  const fileName = url.split('/').pop();
  if (!fileName) return false;
  return await deleteFile(bucket, fileName);
}
