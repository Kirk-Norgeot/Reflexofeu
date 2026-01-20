import Dexie, { Table } from 'dexie';

export interface PendingReleveEtude {
  id?: number;
  sessionId: string;
  armoireId: string;
  zoneId: string;
  zoneNom: string;
  depth: number;
  nombreAlarmes: number;
  niveauHuile: number;
  numeroFiche: string;
  photos: string[];
  createdAt: Date;
  synced: boolean;
}

export interface PendingPhoto {
  id?: number;
  sessionId: string;
  armoireId: string;
  zoneId: string;
  photoData: string;
  createdAt: Date;
  synced: boolean;
}

class OfflineDatabase extends Dexie {
  relevesEtudes!: Table<PendingReleveEtude, number>;
  photos!: Table<PendingPhoto, number>;

  constructor() {
    super('ReflexoFeuOffline');

    this.version(1).stores({
      relevesEtudes: '++id, sessionId, armoireId, zoneId, synced, createdAt',
      photos: '++id, sessionId, armoireId, zoneId, synced, createdAt'
    });
  }
}

export const offlineDB = new OfflineDatabase();

export const offlineService = {
  async saveReleveEtude(data: Omit<PendingReleveEtude, 'id' | 'createdAt' | 'synced'>) {
    return await offlineDB.relevesEtudes.add({
      ...data,
      createdAt: new Date(),
      synced: false
    });
  },

  async savePhoto(data: Omit<PendingPhoto, 'id' | 'createdAt' | 'synced'>) {
    return await offlineDB.photos.add({
      ...data,
      createdAt: new Date(),
      synced: false
    });
  },

  async getPendingReleves() {
    return await offlineDB.relevesEtudes
      .where('synced')
      .equals(0)
      .toArray();
  },

  async getPendingPhotos() {
    return await offlineDB.photos
      .where('synced')
      .equals(0)
      .toArray();
  },

  async markReleveAsSynced(id: number) {
    return await offlineDB.relevesEtudes.update(id, { synced: true });
  },

  async markPhotoAsSynced(id: number) {
    return await offlineDB.photos.update(id, { synced: true });
  },

  async deleteReleveEtude(id: number) {
    return await offlineDB.relevesEtudes.delete(id);
  },

  async deletePhoto(id: number) {
    return await offlineDB.photos.delete(id);
  },

  async getPendingCount() {
    const releves = await offlineDB.relevesEtudes.where('synced').equals(0).count();
    const photos = await offlineDB.photos.where('synced').equals(0).count();
    return { releves, photos, total: releves + photos };
  },

  async clearSyncedData() {
    await offlineDB.relevesEtudes.where('synced').equals(1).delete();
    await offlineDB.photos.where('synced').equals(1).delete();
  }
};
