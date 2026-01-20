import { supabase } from '../lib/supabase';
import { offlineService, PendingReleveEtude, PendingPhoto } from './offline.service';
import { uploadPhotoToStorage } from '../utils/storage';

export interface SyncResult {
  success: boolean;
  syncedReleves: number;
  syncedPhotos: number;
  errors: string[];
}

async function compressImage(base64: string, maxSizeMB: number = 1): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      const maxWidth = 1920;
      const maxHeight = 1920;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      let quality = 0.8;
      let compressedBase64 = canvas.toDataURL('image/jpeg', quality);

      const sizeInMB = (compressedBase64.length * 3) / 4 / 1024 / 1024;
      if (sizeInMB > maxSizeMB) {
        quality = Math.max(0.3, quality * (maxSizeMB / sizeInMB));
        compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(compressedBase64);
    };
    img.src = base64;
  });
}

async function syncPhoto(photo: PendingPhoto): Promise<boolean> {
  try {
    const compressedPhoto = await compressImage(photo.photoData, 1);

    const blob = await (await fetch(compressedPhoto)).blob();
    const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

    const photoUrl = await uploadPhotoToStorage(file, 'releve-photos');

    if (photo.id) {
      await offlineService.markPhotoAsSynced(photo.id);
    }

    return true;
  } catch (error) {
    console.error('Error syncing photo:', error);
    return false;
  }
}

async function syncReleveEtude(releve: PendingReleveEtude): Promise<boolean> {
  try {
    const pendingPhotos = await offlineService.getPendingPhotos();
    const relevePhotos = pendingPhotos.filter(
      p => p.sessionId === releve.sessionId &&
           p.armoireId === releve.armoireId &&
           p.zoneId === releve.zoneId
    );

    const photoUrls: string[] = [];
    for (const photo of relevePhotos) {
      try {
        const compressedPhoto = await compressImage(photo.photoData, 1);
        const blob = await (await fetch(compressedPhoto)).blob();
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const photoUrl = await uploadPhotoToStorage(file, 'releve-photos');

        if (photoUrl) {
          photoUrls.push(photoUrl);
          if (photo.id) {
            await offlineService.markPhotoAsSynced(photo.id);
          }
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
      }
    }

    const { error } = await supabase
      .from('releve_etudes')
      .insert({
        session_id: releve.sessionId,
        armoire_id: releve.armoireId,
        zone_id: releve.zoneId,
        zone_nom: releve.zoneNom,
        depth: releve.depth,
        nombre_alarmes: releve.nombreAlarmes,
        niveau_huile: releve.niveauHuile,
        numero_fiche: releve.numeroFiche,
        photos: photoUrls
      });

    if (error) throw error;

    if (releve.id) {
      await offlineService.markReleveAsSynced(releve.id);
    }

    return true;
  } catch (error) {
    console.error('Error syncing releve:', error);
    return false;
  }
}

export const syncService = {
  async syncAll(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedReleves: 0,
      syncedPhotos: 0,
      errors: []
    };

    try {
      const pendingReleves = await offlineService.getPendingReleves();

      for (const releve of pendingReleves) {
        const success = await syncReleveEtude(releve);
        if (success) {
          result.syncedReleves++;
        } else {
          result.success = false;
          result.errors.push(`Échec de synchronisation du relevé ${releve.numeroFiche}`);
        }
      }

      await offlineService.clearSyncedData();

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Erreur inconnue');
    }

    return result;
  },

  async hasDataToSync(): Promise<boolean> {
    const counts = await offlineService.getPendingCount();
    return counts.total > 0;
  },

  async getPendingCount() {
    return await offlineService.getPendingCount();
  }
};
