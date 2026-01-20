import { supabase } from '@/lib/supabase';
import type { SignatureReleve, SignatureInstallation, SignatureVerification } from '@/types/database.types';
import { releveService, releveSystemeService } from './releve.service';
import { armoiresService } from './armoires.service';
import { installationService, installationSystemeService } from './installation.service';
import { verificationService } from './verification.service';

export const signatureService = {
  async create(
    releveId: string,
    signatureData: string,
    signedBy: string
  ): Promise<SignatureReleve> {
    const { data, error } = await supabase
      .from('signatures_releve')
      .insert({
        releve_id: releveId,
        signature_data: signatureData,
        signed_by: signedBy,
      })
      .select()
      .single();

    if (error) throw error;

    try {
      await createInstallationFromReleve(releveId);
    } catch (err) {
      console.error('Erreur lors de la création de l\'installation:', err);
    }

    return data;
  },

  async createForSession(
    sessionId: string,
    signatureData: string,
    signedBy: string
  ): Promise<SignatureReleve> {
    const { data, error } = await supabase
      .from('signatures_releve')
      .insert({
        session_id: sessionId,
        signature_data: signatureData,
        signed_by: signedBy,
      })
      .select()
      .single();

    if (error) throw error;

    try {
      const releves = await releveService.getBySessionId(sessionId);
      for (const releve of releves) {
        await createInstallationFromReleve(releve.id);
      }
    } catch (err) {
      console.error('Erreur lors de la création des installations:', err);
    }

    return data;
  },

  async getByReleveId(releveId: string): Promise<SignatureReleve | null> {
    const { data, error } = await supabase
      .from('signatures_releve')
      .select('*')
      .eq('releve_id', releveId)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getBySessionId(sessionId: string): Promise<SignatureReleve | null> {
    const { data, error } = await supabase
      .from('signatures_releve')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('signatures_releve')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

export const installationSignatureService = {
  async create(
    siteId: string,
    signatureData: string,
    signedBy?: string
  ): Promise<SignatureInstallation> {
    const { data, error } = await supabase
      .from('signatures_installation')
      .insert({
        site_id: siteId,
        signature_data: signatureData,
        signed_by: signedBy || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getBySiteId(siteId: string): Promise<SignatureInstallation | null> {
    const { data, error } = await supabase
      .from('signatures_installation')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error} = await supabase
      .from('signatures_installation')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

async function createInstallationFromReleve(releveId: string): Promise<void> {
  const existingInstallation = await installationService.getByReleveId(releveId);
  if (existingInstallation) {
    return;
  }

  const releve = await releveService.getById(releveId);
  if (!releve) {
    throw new Error('Relevé introuvable');
  }

  const armoire = await armoiresService.getById(releve.armoire_id);
  if (!armoire) {
    throw new Error('Armoire introuvable');
  }

  const installation = await installationService.create({
    armoire_id: releve.armoire_id,
    releve_etude_id: releveId,
    date_installation: releve.date_releve,
    statut: 'à faire',
    hauteur: armoire.hauteur,
    longueur: armoire.longueur,
    profondeur: armoire.profondeur,
    volume: armoire.volume,
    nb_cellules: armoire.nb_cellules,
    ventilation: armoire.ventilation,
    nb_ventilations: armoire.nb_ventilations,
    arrivee_cables: armoire.arrivee_cables,
  });

  const systemes = await releveSystemeService.getByReleveId(releveId);
  for (const systeme of systemes) {
    await installationSystemeService.create({
      installation_id: installation.id,
      modele: systeme.modele,
      quantite: systeme.quantite,
      tube: systeme.tube,
      pressostat: systeme.pressostat,
      pressostat_type: systeme.pressostat_type,
      tete_sprinkler: systeme.tete_sprinkler,
      tete_sprinkler_quantite: systeme.tete_sprinkler_quantite,
      tete_sprinkler_temperature: systeme.tete_sprinkler_temperature,
      sirene_flash: systeme.sirene_flash,
      panneau: false,
      contact_nf_suppl: false,
    });
  }

  await releveService.update(releveId, { statut: 'completée' });
}

export const verificationSignatureService = {
  async create(
    sessionId: string,
    signatureData: string,
    signedBy: string
  ): Promise<SignatureVerification> {
    const { data, error } = await supabase
      .from('signatures_verification')
      .insert({
        session_id: sessionId,
        signature_data: signatureData,
        signed_by: signedBy,
      })
      .select()
      .single();

    if (error) throw error;

    try {
      const verifications = await verificationService.getBySessionId(sessionId);
      for (const verification of verifications) {
        await verificationService.update(verification.id, { statut: 'fait' });
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour des vérifications:', err);
    }

    return data;
  },

  async getBySessionId(sessionId: string): Promise<SignatureVerification | null> {
    const { data, error } = await supabase
      .from('signatures_verification')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('signatures_verification')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
