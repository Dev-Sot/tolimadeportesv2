import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  loadSession: () => Promise<void>;
}

function mapProfile(p: any): User {
  return {
    id: p.id,
    email: p.email,
    name: p.name,
    role: p.role,
    avatar: p.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.email}`,
    bio: p.bio,
    phone: p.phone,
    location: p.location,
    createdAt: p.created_at,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      loadSession: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          const { data: profile } = await supabase
            .from('profiles').select('*').eq('id', session.user.id).single();
          if (profile) set({ user: mapProfile(profile), isAuthenticated: true });
        } catch {
          // Supabase not configured yet — silently ignore
        }
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw new Error('Credenciales inválidas');
          const { data: profile, error: pe } = await supabase
            .from('profiles').select('*').eq('id', data.user.id).single();
          if (pe || !profile) throw new Error('No se pudo cargar el perfil');
          set({ user: mapProfile(profile), isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (email, password, name, role) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email, password, options: { data: { name, role } },
          });
          if (error) throw new Error(error.message);
          if (!data.user) throw new Error('No se pudo crear la cuenta');
          const { data: profile } = await supabase
            .from('profiles')
            .upsert({ id: data.user.id, email, name, role,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}` })
            .select().single();
          if (profile) set({ user: mapProfile(profile), isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: (updates) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, ...updates } });
      },
    }),
    {
      name: 'tolima-auth',
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
);

// Auth state listener — safe, won't throw
try {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      useAuthStore.setState({ user: null, isAuthenticated: false });
    }
    if (event === 'SIGNED_IN' && session) {
      try {
        const { data: profile } = await supabase
          .from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) useAuthStore.setState({ user: mapProfile(profile), isAuthenticated: true });
      } catch { /* ignore */ }
    }
  });
} catch { /* Supabase not configured */ }
