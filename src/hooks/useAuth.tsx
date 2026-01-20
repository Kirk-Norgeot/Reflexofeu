import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { authService } from '@/services/auth.service';
import type { Profile } from '@/types/database.types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getCurrentUser()
      .then((user) => {
        setUser(user);
        if (user) {
          return authService.getCurrentProfile().then(setProfile);
        }
      })
      .catch((error) => {
        console.error('Error loading user:', error);
        setUser(null);
        setProfile(null);
      })
      .finally(() => {
        setLoading(false);
      });

    const { data: subscription } = authService.onAuthStateChange((user) => {
      setUser(user);
      if (user) {
        (async () => {
          try {
            const profile = await authService.getCurrentProfile();
            setProfile(profile);
          } catch (error) {
            console.error('Error loading profile:', error);
            setProfile(null);
          }
        })();
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    await authService.signIn(email, password);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    await authService.signUp(email, password, fullName);
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signOut, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
