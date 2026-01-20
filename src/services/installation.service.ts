import { supabase } from '@/lib/supabase';
import type {
  Installation,
  InstallationComplete,
  InstallationSysteme,
  InstallationPhoto,
} from '@/types/database.types';

export const installationService = {
  async getAll(): Promise<Installation[]> {
    const { data, error } = await supabase
      .from('installations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<InstallationComplete | null> {
    const { data, error } = await supabase
      .from('installations')
      .select(`
        *,
        armoire:armoires (*),
        installation_systemes (*),
        installation_photos (*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getByArmoireId(armoireId: string): Promise<Installation[]> {
    const { data, error } = await supabase
      .from('installations')
      .select('*')
      .eq('armoire_id', armoireId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByReleveId(releveId: string): Promise<Installation | null> {
    const { data, error } = await supabase
      .from('installations')
      .select('*')
      .eq('releve_etude_id', releveId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(installation: Omit<Installation, 'id' | 'created_at' | 'updated_at'>): Promise<Installation> {
    const { data, error } = await supabase
      .from('installations')
      .insert(installation)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Installation>): Promise<Installation> {
    const { data, error } = await supabase
      .from('installations')
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
      .from('installations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

export const installationSystemeService = {
  async create(systeme: Omit<InstallationSysteme, 'id' | 'created_at'>): Promise<InstallationSysteme> {
    const { data, error } = await supabase
      .from('installation_systemes')
      .insert(systeme)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<InstallationSysteme>): Promise<InstallationSysteme> {
    const { data, error } = await supabase
      .from('installation_systemes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('installation_systemes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getByInstallationId(installationId: string): Promise<InstallationSysteme[]> {
    const { data, error } = await supabase
      .from('installation_systemes')
      .select('*')
      .eq('installation_id', installationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};

export const installationPhotoService = {
  async create(photo: Omit<InstallationPhoto, 'id' | 'created_at'>): Promise<InstallationPhoto> {
    const { data, error } = await supabase
      .from('installation_photos')
      .insert(photo)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('installation_photos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getByInstallationId(installationId: string): Promise<InstallationPhoto[]> {
    const { data, error } = await supabase
      .from('installation_photos')
      .select('*')
      .eq('installation_id', installationId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
