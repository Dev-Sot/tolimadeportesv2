import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

// Helper — gets current user ID from store (no network call)
function getUid(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

// Helper — gets current user ID from store, with session fallback
function requireUid(): string {
  const uid = getUid();
  if (uid) return uid;
  // If store doesn't have user, check if we're just loading
  throw new Error(
    'No hay sesión activa. Por favor cierra sesión, vuelve a iniciarla y reintenta.'
  );
}

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
export function useProducts(filters?: {
  category?: string; search?: string;
  minPrice?: number; maxPrice?: number;
  sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'rating';
}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, profiles:vendor_id (id, name, avatar)')
        .eq('is_active', true);
      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.search)   query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      if (filters?.minPrice) query = query.gte('price', filters.minPrice);
      if (filters?.maxPrice) query = query.lte('price', filters.maxPrice);
      if (filters?.sortBy === 'price-asc')   query = query.order('price', { ascending: true });
      else if (filters?.sortBy === 'price-desc') query = query.order('price', { ascending: false });
      else if (filters?.sortBy === 'rating')     query = query.order('rating', { ascending: false });
      else query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) { console.error('products:', error.message); return []; }
      return data ?? [];
    },
    retry: 1, staleTime: 30000,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('products')
        .select('*, profiles:vendor_id (id, name, avatar, rating)')
        .eq('id', id).single();
      if (error) { console.error('product:', error.message); return null; }
      return data;
    },
  });
}

export function useMyProducts() {
  return useQuery({
    queryKey: ['my_products'],
    queryFn: async () => {
      const uid = getUid();
      if (!uid) return [];
      const { data, error } = await supabase.from('products')
        .select('*').eq('vendor_id', uid).order('created_at', { ascending: false });
      if (error) { console.error('my_products:', error.message); return []; }
      return data ?? [];
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string; description: string; price: number; category: string;
      subcategory?: string; stock: number; images: string[]; tags: string[];
    }) => {
      const uid = requireUid();
      console.log('useCreateProduct: uid =', uid);

      const insert = {
        vendor_id:    uid,
        name:         payload.name,
        description:  payload.description || '',
        price:        Number(payload.price),
        category:     payload.category,
        subcategory:  payload.subcategory || null,
        stock:        Number(payload.stock),
        images:       payload.images || [],
        tags:         payload.tags || [],
        is_active:    true,
        featured:     false,
        rating:       0,
        review_count: 0,
      };

      console.log('Inserting:', JSON.stringify(insert));

      // Add explicit timeout so it doesn't hang forever
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: Supabase tardó más de 10 segundos. Verifica tu conexión.')), 10000)
      );

      const insertPromise = supabase
        .from('products')
        .insert(insert)
        .select()
        .single();

      const result = await Promise.race([insertPromise, timeout]) as any;
      const { data, error } = result;

      if (error) {
        console.error('INSERT ERROR:', JSON.stringify(error));
        throw new Error(
          error.code === '42501' ? 'Sin permisos: verifica que corriste fix_definitivo.sql en Supabase' :
          error.code === '23503' ? 'Tu perfil no existe en la base de datos. Cierra sesión y vuelve a entrar.' :
          error.code === '23505' ? 'Producto duplicado' :
          `Error ${error.code}: ${error.message}`
        );
      }

      console.log('INSERT OK:', data);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['my_products'] });
      toast.success('¡Producto publicado!');
    },
    onError: (e: Error) => {
      console.error('createProduct ERROR:', e.message);
      toast.error(e.message);
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from('products')
        .update(updates).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['my_products'] });
      toast.success('Producto actualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['my_products'] });
      toast.success('Producto eliminado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── COURTS ──────────────────────────────────────────────────────────────────
export function useCourts(filters?: { sport?: string; search?: string }) {
  return useQuery({
    queryKey: ['courts', filters],
    queryFn: async () => {
      let query = supabase.from('courts')
        .select('*, profiles:owner_id (id, name, phone)').eq('is_active', true);
      if (filters?.sport)  query = query.eq('sport', filters.sport);
      if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
      query = query.order('featured', { ascending: false }).order('rating', { ascending: false });
      const { data, error } = await query;
      if (error) { console.error('courts:', error.message); return []; }
      return data ?? [];
    },
    retry: 1,
  });
}

export function useCourt(id: string) {
  return useQuery({
    queryKey: ['court', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('courts')
        .select('*, profiles:owner_id (id, name, phone), court_availability (*)')
        .eq('id', id).single();
      if (error) { console.error('court:', error.message); return null; }
      return data;
    },
  });
}

export function useCourtReservations(courtId: string, date: string) {
  return useQuery({
    queryKey: ['court_reservations', courtId, date],
    enabled: !!courtId && !!date,
    queryFn: async () => {
      const { data, error } = await supabase.from('reservations')
        .select('start_time, end_time').eq('court_id', courtId).eq('date', date)
        .not('status', 'eq', 'cancelled');
      if (error) { console.error('court_res:', error.message); return []; }
      return data ?? [];
    },
  });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      court_id: string; date: string; start_time: string;
      end_time: string; total_price: number; notes?: string;
    }) => {
      const uid = requireUid();
      const { data, error } = await supabase.from('reservations')
        .insert({ ...payload, customer_id: uid }).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['court_reservations'] });
      toast.success('¡Reserva creada!');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateCourt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string; description: string; sport: string; address: string;
      city: string; price_per_hour: number; amenities: string[]; images: string[];
    }) => {
      const uid = requireUid();
      const { data, error } = await supabase.from('courts')
        .insert({ ...payload, owner_id: uid, is_active: true, featured: false, rating: 0, review_count: 0 })
        .select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courts'] }); toast.success('Cancha publicada'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMyCourts() {
  return useQuery({
    queryKey: ['my_courts'],
    queryFn: async () => {
      const uid = getUid();
      if (!uid) return [];
      const { data, error } = await supabase.from('courts')
        .select('*').eq('owner_id', uid).order('created_at', { ascending: false });
      if (error) { console.error('my_courts:', error.message); return []; }
      return data ?? [];
    },
  });
}

// ─── TOURNAMENTS ─────────────────────────────────────────────────────────────
export function useTournaments(filters?: { sport?: string; status?: string; search?: string }) {
  return useQuery({
    queryKey: ['tournaments', filters],
    queryFn: async () => {
      let query = supabase.from('tournaments')
        .select('*, profiles:organizer_id (id, name, avatar)');
      if (filters?.sport)  query = query.eq('sport', filters.sport);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      query = query.order('featured', { ascending: false }).order('start_date', { ascending: true });
      const { data, error } = await query;
      if (error) { console.error('tournaments:', error.message); return []; }
      return data ?? [];
    },
    retry: 1,
  });
}

export function useTournament(id: string) {
  return useQuery({
    queryKey: ['tournament', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('tournaments')
        .select('*, profiles:organizer_id (id, name, avatar), tournament_participants (id, user_id, team_name, status, profiles:user_id (id, name, avatar))')
        .eq('id', id).single();
      if (error) { console.error('tournament:', error.message); return null; }
      return data;
    },
  });
}

export function useJoinTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tournamentId, teamName }: { tournamentId: string; teamName?: string }) => {
      const uid = requireUid();
      const { data, error } = await supabase.from('tournament_participants')
        .insert({ tournament_id: tournamentId, user_id: uid, team_name: teamName ?? null })
        .select().single();
      if (error) {
        if (error.code === '23505') throw new Error('Ya estás inscrito en este torneo');
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: (_, { tournamentId }) => {
      qc.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      qc.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success('¡Inscripción exitosa!');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string; description: string; sport: string; location: string;
      start_date: string; end_date: string; registration_deadline: string;
      max_participants: number; entry_fee: number; prizes: string[]; rules?: string;
    }) => {
      const uid = requireUid();
      const { data, error } = await supabase.from('tournaments')
        .insert({ ...payload, organizer_id: uid, status: 'upcoming', featured: false, current_participants: 0 })
        .select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tournaments'] }); toast.success('Torneo creado'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMyTournaments() {
  return useQuery({
    queryKey: ['my_tournaments'],
    queryFn: async () => {
      const uid = getUid();
      if (!uid) return [];
      const { data, error } = await supabase.from('tournaments')
        .select('*').eq('organizer_id', uid).order('created_at', { ascending: false });
      if (error) { console.error('my_tournaments:', error.message); return []; }
      return data ?? [];
    },
  });
}

// ─── COACHES ─────────────────────────────────────────────────────────────────
export function useCoaches(filters?: { specialty?: string; search?: string }) {
  return useQuery({
    queryKey: ['coaches', filters],
    queryFn: async () => {
      let query = supabase.from('coaches')
        .select('*, profiles:user_id (id, name, email, avatar, location, bio)')
        .eq('is_active', true);
      if (filters?.search) query = query.ilike('bio', `%${filters.search}%`);
      query = query.order('featured', { ascending: false }).order('rating', { ascending: false });
      const { data, error } = await query;
      if (error) { console.error('coaches:', error.message); return []; }
      let result = data ?? [];
      if (filters?.specialty)
        result = result.filter((c: any) => c.specialties?.includes(filters.specialty));
      return result;
    },
    retry: 1,
  });
}

export function useCoach(id: string) {
  return useQuery({
    queryKey: ['coach', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('coaches')
        .select('*, profiles:user_id (id, name, email, avatar, location, bio, phone)')
        .eq('id', id).single();
      if (error) { console.error('coach:', error.message); return null; }
      return data;
    },
  });
}

// ─── REVIEWS ─────────────────────────────────────────────────────────────────
export function useReviews(targetId: string, targetType: string) {
  return useQuery({
    queryKey: ['reviews', targetId, targetType],
    enabled: !!targetId,
    queryFn: async () => {
      const { data, error } = await supabase.from('reviews')
        .select('*, profiles:user_id (id, name, avatar)')
        .eq('target_id', targetId).eq('target_type', targetType)
        .order('created_at', { ascending: false });
      if (error) { console.error('reviews:', error.message); return []; }
      return data ?? [];
    },
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { target_id: string; target_type: string; rating: number; comment: string }) => {
      const uid = requireUid();
      const { data, error } = await supabase.from('reviews')
        .insert({ ...payload, user_id: uid }).select().single();
      if (error) {
        if (error.code === '23505') throw new Error('Ya dejaste una reseña');
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: (_, { target_id, target_type }) => {
      qc.invalidateQueries({ queryKey: ['reviews', target_id, target_type] });
      toast.success('Reseña publicada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── COMMUNITY ───────────────────────────────────────────────────────────────
export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('posts')
        .select('*, profiles:user_id (id, name, avatar, role)')
        .order('created_at', { ascending: false }).limit(30);
      if (error) { console.error('posts:', error.message); return []; }
      return data ?? [];
    },
    retry: 1,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { content: string; sport?: string }) => {
      const uid = requireUid();
      const { data, error } = await supabase.from('posts')
        .insert({ ...payload, user_id: uid }).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['posts'] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      const uid = requireUid();
      if (liked) {
        await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', uid);
      } else {
        const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: uid });
        if (error && error.code !== '23505') throw new Error(error.message);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
    onError: (e: Error) => console.error('toggleLike:', e.message),
  });
}

// ─── ORDERS ──────────────────────────────────────────────────────────────────
export function useMyOrders() {
  return useQuery({
    queryKey: ['my_orders'],
    queryFn: async () => {
      const uid = getUid();
      if (!uid) return [];
      const { data, error } = await supabase.from('orders')
        .select('*, order_items (*, products:product_id (id, name, images, price))')
        .eq('customer_id', uid).order('created_at', { ascending: false });
      if (error) { console.error('my_orders:', error.message); return []; }
      return data ?? [];
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      items: Array<{ product_id: string; quantity: number; unit_price: number }>;
      total: number; shipping_address: object; payment_method: string;
    }) => {
      const uid = requireUid();
      const { data: order, error: oErr } = await supabase.from('orders')
        .insert({ customer_id: uid, total: payload.total, shipping_address: payload.shipping_address, payment_method: payload.payment_method, status: 'pending' })
        .select().single();
      if (oErr) throw new Error(oErr.message);
      const { error: iErr } = await supabase.from('order_items')
        .insert(payload.items.map(i => ({ ...i, order_id: order.id })));
      if (iErr) throw new Error(iErr.message);
      return order;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my_orders'] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const uid = getUid();
      if (!uid) return [];
      const { data, error } = await supabase.from('notifications')
        .select('*').eq('user_id', uid)
        .order('created_at', { ascending: false }).limit(20);
      if (error) { console.error('notifications:', error.message); return []; }
      return data ?? [];
    },
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const uid = getUid();
      if (!uid) return;
      await supabase.from('notifications').update({ read: true }).eq('user_id', uid).eq('read', false);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Todas marcadas como leídas');
    },
  });
}

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: async () => {
      const uid = getUid();
      if (!uid) return { total_orders: 0, active_reservations: 0, tournaments_joined: 0, total_favorites: 0, total_spent: 0, unread_notifications: 0 };
      const { data, error } = await supabase.rpc('get_user_dashboard_stats');
      if (error) {
        console.error('dashboard_stats:', error.message);
        return { total_orders: 0, active_reservations: 0, tournaments_joined: 0, total_favorites: 0, total_spent: 0, unread_notifications: 0 };
      }
      return data;
    },
  });
}

export function useMyReservations() {
  return useQuery({
    queryKey: ['my_reservations'],
    queryFn: async () => {
      const uid = getUid();
      if (!uid) return [];
      const { data, error } = await supabase.from('reservations')
        .select('*, courts (id, name, address, city, sport, images)')
        .eq('customer_id', uid).gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });
      if (error) { console.error('my_reservations:', error.message); return []; }
      return data ?? [];
    },
  });
}

// ─── FAVORITES ───────────────────────────────────────────────────────────────
export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const uid = getUid();
      if (!uid) return [];
      const { data, error } = await supabase.from('favorites').select('*').eq('user_id', uid);
      if (error) { console.error('favorites:', error.message); return []; }
      return data ?? [];
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetId, targetType, isFav }: { targetId: string; targetType: string; isFav: boolean }) => {
      const uid = requireUid();
      if (isFav) {
        await supabase.from('favorites').delete().eq('user_id', uid).eq('target_id', targetId);
      } else {
        await supabase.from('favorites').insert({ user_id: uid, target_id: targetId, target_type: targetType });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
export function useUpdateProfile() {
  const { updateProfile } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { name?: string; bio?: string; phone?: string; location?: string }) => {
      const uid = requireUid();
      const { data, error } = await supabase.from('profiles')
        .update(updates).eq('id', uid).select().single();
      if (error) throw new Error(error.message);
      updateProfile(data);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Perfil actualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}