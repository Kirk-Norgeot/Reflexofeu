import { supabase } from '@/lib/supabase';
import type { Document, DocumentCategory, TransferType } from '@/types/database.types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const documentsService = {
  async getAll(): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Document | null> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getByClientId(clientId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getBySiteId(siteId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByArmoireId(armoireId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('armoire_id', armoireId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByCategory(categoryId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByTransferType(transferTypeId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('transfer_type_id', transferTypeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(document: Omit<Document, 'id' | 'created_at' | 'date_ajout'>, userId: string): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        ...document,
        created_by: userId,
        date_ajout: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Document>): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async uploadFile(file: File, bucket: string = 'documents', folder: string = ''): Promise<{ path: string; url: string }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Non authentifié');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    formData.append('folder', folder);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/upload-file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'upload');
    }

    const result = await response.json();
    return { path: result.path, url: result.url };
  },

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Non authentifié');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/delete-file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bucket, path }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la suppression');
    }
  },

  async listFiles(bucket: string = 'documents', folder: string = ''): Promise<any[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Non authentifié');

    const url = new URL(`${SUPABASE_URL}/functions/v1/list-files`);
    url.searchParams.append('bucket', bucket);
    url.searchParams.append('folder', folder);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des fichiers');
    }

    const result = await response.json();
    return result.files || [];
  },
};

export const documentCategoriesService = {
  async getAll(): Promise<DocumentCategory[]> {
    const { data, error } = await supabase
      .from('document_categories')
      .select('*')
      .order('nom', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<DocumentCategory | null> {
    const { data, error } = await supabase
      .from('document_categories')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};

export const transferTypesService = {
  async getAll(): Promise<TransferType[]> {
    const { data, error } = await supabase
      .from('transfer_types')
      .select('*')
      .order('nom', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<TransferType | null> {
    const { data, error } = await supabase
      .from('transfer_types')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};
