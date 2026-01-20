import { supabase } from '@/lib/supabase';
import type { Client, ClientWithSites, Site } from '@/types/database.types';

export const clientsService = {
  async getAll(): Promise<ClientWithSites[]> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        sites (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<ClientWithSites | null> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        sites (*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'created_by'>, userId: string): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...client,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
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
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async searchByFilters(filters: {
    clientId?: string;
    ville?: string;
    codePostal?: string;
  }): Promise<ClientWithSites[]> {
    let query = supabase
      .from('clients')
      .select(`
        *,
        sites (*)
      `);

    if (filters.clientId) {
      query = query.eq('id', filters.clientId);
    }

    if (filters.ville) {
      query = query.ilike('ville', `%${filters.ville}%`);
    }

    if (filters.codePostal) {
      query = query.ilike('code_postal', `${filters.codePostal}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

export const sitesService = {
  async getAll(): Promise<Site[]> {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Site | null> {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getByClientId(clientId: string): Promise<Site[]> {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(site: Omit<Site, 'id' | 'created_at' | 'updated_at'>): Promise<Site> {
    const { data, error } = await supabase
      .from('sites')
      .insert(site)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Site>): Promise<Site> {
    const { data, error } = await supabase
      .from('sites')
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
      .from('sites')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getSitesWithCoordinates(): Promise<Site[]> {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error) throw error;
    return data || [];
  },
};
