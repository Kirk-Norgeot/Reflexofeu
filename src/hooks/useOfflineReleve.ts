import { useState, useCallback } from 'react';
import { offlineService } from '../services/offline.service';
import { releveService, releveSystemeService, relevePhotoService } from '../services/releve.service';
import { armoiresService } from '../services/armoires.service';
import { uploadPhotoToStorage } from '../utils/storage';

interface ArmoireData {
  nom_armoire: string;
  zone?: string;
  hauteur?: number;
  longueur?: number;
  profondeur?: number;
  nb_cellules?: number;
  ventilation: boolean;
  nb_ventilations?: number;
  arrivee_cables: string;
  photos: File[];
  systemes: any[];
}

export function useOfflineReleve() {
  const [isSaving, setIsSaving] = useState(false);
  const isOnline = navigator.onLine;

  const saveReleveOffline = useCallback(async (
    siteId: string,
    armoires: ArmoireData[]
  ) => {
    const sessionId = crypto.randomUUID();

    for (const armoire of armoires) {
      for (const photo of armoire.photos) {
        const reader = new FileReader();
        const photoDataPromise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
        });
        reader.readAsDataURL(photo);
        const photoData = await photoDataPromise;

        await offlineService.savePhoto({
          sessionId,
          armoireId: armoire.nom_armoire,
          zoneId: armoire.zone || '',
          photoData
        });
      }

      await offlineService.saveReleveEtude({
        sessionId,
        armoireId: armoire.nom_armoire,
        zoneId: armoire.zone || '',
        zoneNom: armoire.zone || '',
        depth: armoire.profondeur || 0,
        nombreAlarmes: 0,
        niveauHuile: 0,
        numeroFiche: `OFFLINE-${Date.now()}`,
        photos: []
      });
    }

    return sessionId;
  }, []);

  const saveReleveOnline = useCallback(async (
    siteId: string,
    armoires: ArmoireData[],
    pretAsigner: boolean
  ) => {
    const sessionId = crypto.randomUUID();
    const currentDate = new Date().toISOString().split('T')[0];

    for (const armoire of armoires) {
      const armoireData = {
        site_id: siteId,
        nom_armoire: armoire.nom_armoire,
        zone: armoire.zone || undefined,
        hauteur: armoire.hauteur,
        longueur: armoire.longueur,
        profondeur: armoire.profondeur,
        volume: undefined,
        nb_cellules: armoire.nb_cellules,
        ventilation: armoire.ventilation,
        nb_ventilations: armoire.nb_ventilations,
        arrivee_cables: armoire.arrivee_cables as any,
      };

      const createdArmoire = await armoiresService.create(armoireData);

      const releveData = {
        armoire_id: createdArmoire.id,
        session_id: armoires.length > 1 ? sessionId : undefined,
        date_releve: currentDate,
        statut: pretAsigner ? ('completée' as const) : ('brouillon' as const),
      };

      const createdReleve = await releveService.create(releveData);

      for (const systeme of armoire.systemes) {
        await releveSystemeService.create({
          releve_etude_id: createdReleve.id,
          modele: systeme.modele,
          quantite: systeme.quantite,
          tube: systeme.tube,
          pressostat: systeme.pressostat,
          pressostat_type: systeme.pressostat ? systeme.pressostat_type : undefined,
          tete_sprinkler: systeme.tete_sprinkler,
          tete_sprinkler_quantite: systeme.tete_sprinkler_quantite,
          tete_sprinkler_temperature: systeme.tete_sprinkler
            ? systeme.tete_sprinkler_temperature
            : undefined,
          sirene_flash: systeme.sirene_flash,
        });
      }

      for (let i = 0; i < armoire.photos.length; i++) {
        const photoUrl = await uploadPhotoToStorage(armoire.photos[i], 'releve-photos');
        if (photoUrl) {
          await relevePhotoService.create({
            releve_etude_id: createdReleve.id,
            url_photo: photoUrl,
            position: i + 1,
          });
        }
      }
    }

    return sessionId;
  }, []);

  const saveReleve = useCallback(async (
    siteId: string,
    armoires: ArmoireData[],
    pretAsigner: boolean = false
  ) => {
    setIsSaving(true);
    try {
      if (isOnline) {
        return await saveReleveOnline(siteId, armoires, pretAsigner);
      } else {
        return await saveReleveOffline(siteId, armoires);
      }
    } finally {
      setIsSaving(false);
    }
  }, [isOnline, saveReleveOnline, saveReleveOffline]);

  return {
    saveReleve,
    isSaving,
    isOnline
  };
}
