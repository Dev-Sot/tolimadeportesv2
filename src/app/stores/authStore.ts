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
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => void;
  loadSession: () => Promise<void>;
}

function mapProfile(p: any): User {
  return {
    id: p.id,
    email: p.email,
    name: p.name ?? p.email?.split('@')[0] ?? 'Usuario',
    role: p.role ?? 'customer',
    avatar: p.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.email}`,
    bio: p.bio ?? '',
    phone: p.phone ?? '',
    location: p.location ?? 'Ibagué, Tolima',
    createdAt: p.created_at ?? new Date().toISOString(),
  };
}

function mapAuthUser(authUser: any): User {
  const meta = authUser.user_metadata ?? {};
  return {
    id: authUser.id,
    email: authUser.email ?? '',
    name: meta.name ?? meta.full_name ?? authUser.email?.split('@')[0] ?? 'Usuario',
    role: (meta.role as UserRole) ?? 'customer',
    avatar: meta.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.email}`,
    bio: '',
    phone: '',
    location: 'Ibagué, Tolima',
    createdAt: authUser.created_at ?? new Date().toISOString(),
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
          if (!session?.user) return;

          // Try to get profile, but fall back to auth user data
          const { data: profile } = await supabase
            .from('profiles').select('*').eq('id', session.user.id).maybeSingle();

          set({
            user: profile ? mapProfile(profile) : mapAuthUser(session.user),
            isAuthenticated: true,
          });
        } catch (e) {
          console.error('loadSession error:', e);
        }
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });

          if (error) {
            // Show the real error from Supabase
            if (error.message.includes('Email not confirmed')) {
              throw new Error('Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
            }
            if (error.message.includes('Invalid login credentials')) {
              throw new Error('Email o contraseña incorrectos.');
            }
            throw new Error(error.message);
          }

          if (!data.user) throw new Error('No se pudo iniciar sesión.');

          // Get profile — use maybeSingle() to not throw if not found
          const { data: profile } = await supabase
            .from('profiles').select('*').eq('id', data.user.id).maybeSingle();

          set({
            user: profile ? mapProfile(profile) : mapAuthUser(data.user),
            isAuthenticated: true,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (email, password, name, role) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name, role } },
          });

          if (error) throw new Error(error.message);
          if (!data.user) throw new Error('No se pudo crear la cuenta.');

          // If email confirmation required, user.identities will be empty
          if (data.user.identities?.length === 0) {
            throw new Error('Este email ya está registrado. Intenta iniciar sesión.');
          }

          // Upsert profile — always set role explicitly
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            name,
            role,
            location: 'Ibagué, Tolima',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });

          if (profileError) {
            console.error('Profile upsert error:', profileError.message);
          }

          const { data: profile } = await supabase
            .from('profiles').select('*').eq('id', data.user.id).maybeSingle();

          set({
            user: profile ? mapProfile(profile) : mapAuthUser(data.user),
            isAuthenticated: true,
          });
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

// Sync auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  try {
    if (event === 'SIGNED_OUT') {
      useAuthStore.setState({ user: null, isAuthenticated: false });
      return;
    }
    if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      useAuthStore.setState({
        user: profile ? mapProfile(profile) : mapAuthUser(session.user),
        isAuthenticated: true,
      });
    }
  } catch (e) {
    console.error('onAuthStateChange error:', e);
  }
});
