import { supabase } from '@/lib/supabase';
import type {
  Verification,
  VerificationComplete,
  VerificationSysteme,
  VerificationPhoto,
} from '@/types/database.types';

export const verificationService = {
  async getAll(): Promise<Verification[]> {
    const { data, error } = await supabase
      .from('verifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<VerificationComplete | null> {
    const { data, error } = await supabase
      .from('verifications')
      .select(`
        *,
        armoire:armoires (*),
        verification_systemes (*),
        verification_photos (*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getByArmoireId(armoireId: string): Promise<VerificationComplete | null> {
    const { data, error } = await supabase
      .from('verifications')
      .select(`
        *,
        armoire:armoires (*),
        verification_systemes (*),
        verification_photos (*)
      `)
      .eq('armoire_id', armoireId)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getBySessionId(sessionId: string): Promise<VerificationComplete[]> {
    const { data, error } = await supabase
      .from('verifications')
      .select(`
        *,
        armoire:armoires (*),
        verification_systemes (*),
        verification_photos (*)
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(verification: Omit<Verification, 'id' | 'created_at' | 'updated_at'>): Promise<Verification> {
    const { data, error } = await supabase
      .from('verifications')
      .insert(verification)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Verification>): Promise<Verification> {
    const { data, error } = await supabase
      .from('verifications')
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
      .from('verifications')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

export const verificationSystemeService = {
  async create(systeme: Omit<VerificationSysteme, 'id' | 'created_at'>): Promise<VerificationSysteme> {
    const { data, error } = await supabase
      .from('verification_systemes')
      .insert(systeme)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<VerificationSysteme>): Promise<VerificationSysteme> {
    const { data, error } = await supabase
      .from('verification_systemes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('verification_systemes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getByVerificationId(verificationId: string): Promise<VerificationSysteme[]> {
    const { data, error } = await supabase
      .from('verification_systemes')
      .select('*')
      .eq('verification_id', verificationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};

export const verificationPhotoService = {
  async create(photo: Omit<VerificationPhoto, 'id' | 'created_at'>): Promise<VerificationPhoto> {
    const { data, error } = await supabase
      .from('verification_photos')
      .insert(photo)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('verification_photos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getByVerificationId(verificationId: string): Promise<VerificationPhoto[]> {
    const { data, error } = await supabase
      .from('verification_photos')
      .select('*')
      .eq('verification_id', verificationId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
