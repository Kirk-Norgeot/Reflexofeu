import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/database.types';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at: string;
}

interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export const usersService = {
  async listUsers(): Promise<User[]> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Non authentifié');
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users?action=list`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de la récupération des utilisateurs');
    }

    return result.users;
  },

  async createUser(userData: CreateUserData): Promise<User> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Non authentifié');
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users?action=create`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de la création de l\'utilisateur');
    }

    return result.user;
  },

  async deleteUser(userId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Non authentifié');
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`;

    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de la suppression de l\'utilisateur');
    }
  },
};
