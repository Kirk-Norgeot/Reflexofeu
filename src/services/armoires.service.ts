import { supabase } from '@/lib/supabase';
import type { Armoire, ArmoireWithRelations } from '@/types/database.types';

export const armoiresService = {
  async getAll(): Promise<Armoire[]> {
    const { data, error } = await supabase
      .from('armoires')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<ArmoireWithRelations | null> {
    const { data, error } = await supabase
      .from('armoires')
      .select(`
        *,
        site:sites (*),
        releve_etudes (*),
        installations (*),
        verifications (*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getBySiteId(siteId: string): Promise<Armoire[]> {
    const { data, error } = await supabase
      .from('armoires')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getBySiteAndName(siteId: string, nomArmoire: string): Promise<Armoire | null> {
    const { data, error } = await supabase
      .from('armoires')
      .select('*')
      .eq('site_id', siteId)
      .eq('nom_armoire', nomArmoire)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(armoire: Omit<Armoire, 'id' | 'created_at' | 'updated_at'>): Promise<Armoire> {
    const { data, error } = await supabase
      .from('armoires')
      .insert(armoire)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Armoire>): Promise<Armoire> {
    const { data, error } = await supabase
      .from('armoires')
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
      .from('armoires')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  calculateVolume(hauteur?: number, longueur?: number, profondeur?: number): number | undefined {
    if (!hauteur || !longueur || !profondeur) return undefined;
    return Number((hauteur * longueur * profondeur).toFixed(2));
  },
};
