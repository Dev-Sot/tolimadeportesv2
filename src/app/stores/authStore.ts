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

interface RawUserFields {
  id: string;
  email?: string | null;
  name?: string | null;
  role: UserRole;
  roles?: UserRole[];
  avatar?: string | null;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  createdAt?: string | null;
}

// Aplica una sola vez los valores por defecto compartidos (avatar dicebear,
// nombre desde el email, ubicación, fecha de creación). mapProfile y
// mapAuthUser solo se encargan de extraer los campos de su forma de origen
// distinta (fila de `profiles` vs. `session.user` de Supabase Auth) — antes
// cada uno reimplementaba estos mismos defaults por separado.
function buildUser(fields: RawUserFields): User {
  const roles = fields.roles && fields.roles.length > 0 ? fields.roles : [fields.role];
  return {
    id: fields.id,
    email: fields.email ?? '',
    name: fields.name ?? fields.email?.split('@')[0] ?? 'Usuario',
    role: fields.role,
    roles,
    avatar: fields.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${fields.email}`,
    bio: fields.bio ?? '',
    phone: fields.phone ?? '',
    location: fields.location ?? 'Ibagué, Tolima',
    createdAt: fields.createdAt ?? new Date().toISOString(),
  };
}

function mapProfile(p: any): User {
  return buildUser({
    id: p.id,
    email: p.email,
    name: p.name,
    role: (p.role as UserRole) ?? 'customer',
    roles: Array.isArray(p.roles) ? (p.roles as UserRole[]) : undefined,
    avatar: p.avatar,
    bio: p.bio,
    phone: p.phone,
    location: p.location,
    createdAt: p.created_at,
  });
}

function mapAuthUser(u: any): User {
  const meta = u.user_metadata ?? {};
  return buildUser({
    id: u.id,
    email: u.email,
    name: meta.name ?? meta.full_name,
    role: (meta.role as UserRole) ?? 'customer',
    createdAt: u.created_at,
  });
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
            activeRole: (loaded.roles ?? []).includes(get().activeRole) ? get().activeRole : loaded.roles[0] ?? loaded.role,
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
        // Sign out from Supabase FIRST so the server session is invalidated
        // before clearing local state. This avoids a TOKEN_REFRESHED event
        // arriving after logout and re-setting isAuthenticated = true.
        try { await supabase.auth.signOut(); } catch { /* ignore network errors */ }
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
      useAuthStore.setState({ user: null, isAuthenticated: false, activeRole: 'customer' });
      return;
    }
    if (event === 'SIGNED_IN' && session?.user) {
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      useAuthStore.setState({
        user: profile ? mapProfile(profile) : mapAuthUser(session.user),
        isAuthenticated: true,
      });
      return;
    }
    // TOKEN_REFRESHED: only sync if we are already authenticated to avoid
    // re-setting state after a logout (signOut fires SIGNED_OUT, but a
    // concurrent TOKEN_REFRESHED can arrive milliseconds later).
    if (event === 'TOKEN_REFRESHED' && session?.user) {
      const current = useAuthStore.getState();
      if (!current.isAuthenticated) return;
      // Un token refresh nunca debería traer un usuario distinto al que ya
      // teníamos en memoria; si pasa, cerramos sesión por seguridad en vez
      // de mezclar datos de dos cuentas.
      if (current.user && session.user.id !== current.user.id) {
        await useAuthStore.getState().logout();
        return;
      }
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