import { supabase } from '@/lib/supabase';
import type {
  ReleveEtude,
  ReleveEtudeComplete,
  ReleveSysteme,
  RelevePhoto,
} from '@/types/database.types';

export const releveService = {
  async getAll(): Promise<ReleveEtude[]> {
    const { data, error } = await supabase
      .from('releve_etudes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<ReleveEtudeComplete | null> {
    const { data, error } = await supabase
      .from('releve_etudes')
      .select(`
        *,
        armoire:armoires (*),
        releve_systemes (*),
        releve_photos (*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getByArmoireId(armoireId: string): Promise<ReleveEtudeComplete[]> {
    const { data, error } = await supabase
      .from('releve_etudes')
      .select(`
        *,
        armoire:armoires (*),
        releve_systemes (*),
        releve_photos (*)
      `)
      .eq('armoire_id', armoireId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getBySiteId(siteId: string): Promise<ReleveEtudeComplete[]> {
    const { data, error } = await supabase
      .from('releve_etudes')
      .select(`
        *,
        armoire:armoires!inner (
          *,
          site:sites!inner (*)
        ),
        releve_systemes (*),
        releve_photos (*)
      `)
      .eq('armoire.site_id', siteId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(releve: Omit<ReleveEtude, 'id' | 'created_at' | 'updated_at'>): Promise<ReleveEtude> {
    const { data, error } = await supabase
      .from('releve_etudes')
      .insert(releve)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<ReleveEtude>): Promise<ReleveEtude> {
    const { data, error } = await supabase
      .from('releve_etudes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('releve_etudes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getBySessionId(sessionId: string): Promise<ReleveEtudeComplete[]> {
    const { data, error } = await supabase
      .from('releve_etudes')
      .select(`
        *,
        armoire:armoires (*),
        releve_systemes (*),
        releve_photos (*)
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async updateSessionStatus(sessionId: string, statut: 'brouillon' | 'completée'): Promise<void> {
    const { error } = await supabase
      .from('releve_etudes')
      .update({
        statut,
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId);

    if (error) throw error;
  },

  async createSessionFromReleves(releveIds: string[]): Promise<string> {
    const sessionId = crypto.randomUUID();

    const { error } = await supabase
      .from('releve_etudes')
      .update({
        session_id: sessionId,
        updated_at: new Date().toISOString(),
      })
      .in('id', releveIds);

    if (error) throw error;
    return sessionId;
  },
};

export const releveSystemeService = {
  async create(systeme: Omit<ReleveSysteme, 'id' | 'created_at'>): Promise<ReleveSysteme> {
    const { data, error } = await supabase
      .from('releve_systemes')
      .insert(systeme)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<ReleveSysteme>): Promise<ReleveSysteme> {
    const { data, error } = await supabase
      .from('releve_systemes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('releve_systemes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getByReleveId(releveId: string): Promise<ReleveSysteme[]> {
    const { data, error } = await supabase
      .from('releve_systemes')
      .select('*')
      .eq('releve_etude_id', releveId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};

export const relevePhotoService = {
  async create(photo: Omit<RelevePhoto, 'id' | 'created_at'>): Promise<RelevePhoto> {
    const { data, error } = await supabase
      .from('releve_photos')
      .insert(photo)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('releve_photos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getByReleveId(releveId: string): Promise<RelevePhoto[]> {
    const { data, error } = await supabase
      .from('releve_photos')
      .select('*')
      .eq('releve_etude_id', releveId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
