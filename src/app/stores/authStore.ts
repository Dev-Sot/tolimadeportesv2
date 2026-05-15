import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeRole: UserRole;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => void;
  loadSession: () => Promise<void>;
  setActiveRole: (role: UserRole) => void;
}

function mapProfile(p: any): User {
  const role = (p.role as UserRole) ?? 'customer';
  const roles: UserRole[] = Array.isArray(p.roles) && p.roles.length > 0
    ? p.roles as UserRole[]
    : [role];
  return {
    id: p.id,
    email: p.email,
    name: p.name ?? p.email?.split('@')[0] ?? 'Usuario',
    role,
    roles,
    avatar: p.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.email}`,
    bio: p.bio ?? '',
    phone: p.phone ?? '',
    location: p.location ?? 'Ibagué, Tolima',
    createdAt: p.created_at ?? new Date().toISOString(),
  };
}

function mapAuthUser(u: any): User {
  const meta = u.user_metadata ?? {};
  const role = (meta.role as UserRole) ?? 'customer';
  return {
    id: u.id,
    email: u.email ?? '',
    name: meta.name ?? meta.full_name ?? u.email?.split('@')[0] ?? 'Usuario',
    role,
    roles: [role],
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`,
    bio: '', phone: '', location: 'Ibagué, Tolima',
    createdAt: u.created_at ?? new Date().toISOString(),
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      activeRole: 'customer' as UserRole,

      loadSession: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) return;
          const { data: profile } = await supabase
            .from('profiles').select('*').eq('id', session.user.id).maybeSingle();
          const loaded = profile ? mapProfile(profile) : mapAuthUser(session.user);
          set({
            user: loaded,
            isAuthenticated: true,
            activeRole: get().activeRole in (loaded.roles ?? []) ? get().activeRole : loaded.roles[0] ?? loaded.role,
          });
        } catch (e) {
          console.error('loadSession:', e);
        }
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            if (error.message.includes('Email not confirmed'))
              throw new Error('Debes confirmar tu email. Revisa tu bandeja de entrada.');
            if (error.message.includes('Invalid login credentials'))
              throw new Error('Email o contraseña incorrectos.');
            throw new Error(error.message);
          }
          if (!data.user) throw new Error('No se pudo iniciar sesión.');

          const { data: profile } = await supabase
            .from('profiles').select('*').eq('id', data.user.id).maybeSingle();

          const user = profile ? mapProfile(profile) : mapAuthUser(data.user);
          console.log('Login OK, user:', user.id, user.email);
          set({ user, isAuthenticated: true, activeRole: user.roles[0] ?? user.role });
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
          if (!data.user) throw new Error('No se pudo crear la cuenta.');

          // Upsert profile
          await supabase.from('profiles').upsert({
            id: data.user.id, email, name, role,
            roles: [role],
            location: 'Ibagué, Tolima',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          }, { onConflict: 'id' });

          const { data: profile } = await supabase
            .from('profiles').select('*').eq('id', data.user.id).maybeSingle();

          const registered = profile ? mapProfile(profile) : mapAuthUser(data.user);
          set({
            user: registered,
            isAuthenticated: true,
            activeRole: registered.roles[0] ?? registered.role,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
        set({ user: null, isAuthenticated: false, activeRole: 'customer' });
      },

      updateProfile: (updates) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...updates } });
      },

      setActiveRole: (role) => {
        set({ activeRole: role });
      },
    }),
    {
      name: 'tolima-auth-v2',
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated, activeRole: s.activeRole }),
    }
  )
);

// Sync auth state
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
    console.error('onAuthStateChange:', e);
  }
});