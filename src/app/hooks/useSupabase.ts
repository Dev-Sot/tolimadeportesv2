import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

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
        .select('*, profiles:vendor_id (id, name, avatar, role)')
        .eq('is_active', true);
      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.search)   query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      if (filters?.minPrice) query = query.gte('price', filters.minPrice);
      if (filters?.maxPrice) query = query.lte('price', filters.maxPrice);
      if (filters?.sortBy === 'price-asc')  query = query.order('price', { ascending: true });
      else if (filters?.sortBy === 'price-desc') query = query.order('price', { ascending: false });
      else if (filters?.sortBy === 'rating')     query = query.order('rating', { ascending: false });
      else query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) { console.error('products error:', error.message); return []; }
      return data ?? [];
    },
    retry: 1,
    staleTime: 1000 * 60,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, profiles:vendor_id (id, name, avatar, rating)')
        .eq('id', id).single();
      if (error) { console.error('product error:', error.message); return null; }
      return data;
    },
  });
}

// ─── VENDOR: create/edit/delete products ─────────────────────────────────────
export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string; description: string; price: number; category: string;
      subcategory?: string; stock: number; images: string[]; tags: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión');
      const { data, error } = await supabase.from('products')
        .insert({ ...payload, vendor_id: user.id, is_active: true, featured: false })
        .select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Producto publicado'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, { id }) => { qc.invalidateQueries({ queryKey: ['products'] }); qc.invalidateQueries({ queryKey: ['product', id] }); toast.success('Producto actualizado'); },
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Producto eliminado'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMyProducts() {
  return useQuery({
    queryKey: ['my_products'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase.from('products').select('*').eq('vendor_id', user.id).order('created_at', { ascending: false });
      if (error) { console.error(error.message); return []; }
      return data ?? [];
    },
  });
}

// ─── COURTS ──────────────────────────────────────────────────────────────────
export function useCourts(filters?: { sport?: string; search?: string }) {
  return useQuery({
    queryKey: ['courts', filters],
    queryFn: async () => {
      let query = supabase.from('courts').select('*, profiles:owner_id (id, name, phone)').eq('is_active', true);
      if (filters?.sport)  query = query.eq('sport', filters.sport);
      if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
      query = query.order('featured', { ascending: false }).order('rating', { ascending: false });
      const { data, error } = await query;
      if (error) { console.error('courts error:', error.message); return []; }
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
      if (error) { console.error(error.message); return null; }
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
        .select('start_time, end_time').eq('court_id', courtId).eq('date', date).not('status', 'eq', 'cancelled');
      if (error) { console.error(error.message); return []; }
      return data ?? [];
    },
  });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { court_id: string; date: string; start_time: string; end_time: string; total_price: number; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión para reservar');
      const { data, error } = await supabase.from('reservations').insert({ ...payload, customer_id: user.id }).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reservations'] }); qc.invalidateQueries({ queryKey: ['court_reservations'] }); toast.success('¡Reserva creada!'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateCourt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; description: string; sport: string; address: string; city: string; price_per_hour: number; amenities: string[]; images: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión');
      const { data, error } = await supabase.from('courts').insert({ ...payload, owner_id: user.id, is_active: true, featured: false }).select().single();
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase.from('courts').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
      if (error) { console.error(error.message); return []; }
      return data ?? [];
    },
  });
}

// ─── TOURNAMENTS ─────────────────────────────────────────────────────────────
export function useTournaments(filters?: { sport?: string; status?: string; search?: string }) {
  return useQuery({
    queryKey: ['tournaments', filters],
    queryFn: async () => {
      let query = supabase.from('tournaments').select('*, profiles:organizer_id (id, name, avatar)');
      if (filters?.sport)  query = query.eq('sport', filters.sport);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      query = query.order('featured', { ascending: false }).order('start_date', { ascending: true });
      const { data, error } = await query;
      if (error) { console.error('tournaments error:', error.message); return []; }
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
        .select('*, profiles:organizer_id (id, name, avatar), tournament_participants (id, user_id, team_name, status, registered_at, profiles:user_id (id, name, avatar))')
        .eq('id', id).single();
      if (error) { console.error(error.message); return null; }
      return data;
    },
  });
}

export function useJoinTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tournamentId, teamName }: { tournamentId: string; teamName?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión');
      const { data, error } = await supabase.from('tournament_participants').insert({ tournament_id: tournamentId, user_id: user.id, team_name: teamName }).select().single();
      if (error) { if (error.code === '23505') throw new Error('Ya estás inscrito'); throw new Error(error.message); }
      return data;
    },
    onSuccess: (_, { tournamentId }) => { qc.invalidateQueries({ queryKey: ['tournament', tournamentId] }); toast.success('¡Inscripción exitosa!'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; description: string; sport: string; location: string; start_date: string; end_date: string; registration_deadline: string; max_participants: number; entry_fee: number; prizes: string[]; rules?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión');
      const { data, error } = await supabase.from('tournaments').insert({ ...payload, organizer_id: user.id, status: 'upcoming', featured: false, current_participants: 0 }).select().single();
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase.from('tournaments').select('*').eq('organizer_id', user.id).order('created_at', { ascending: false });
      if (error) { console.error(error.message); return []; }
      return data ?? [];
    },
  });
}

// ─── COACHES ─────────────────────────────────────────────────────────────────
export function useCoaches(filters?: { specialty?: string; search?: string }) {
  return useQuery({
    queryKey: ['coaches', filters],
    queryFn: async () => {
      let query = supabase.from('coaches').select('*, profiles:user_id (id, name, email, avatar, location, bio)').eq('is_active', true);
      if (filters?.search) query = query.ilike('bio', `%${filters.search}%`);
      query = query.order('featured', { ascending: false }).order('rating', { ascending: false });
      const { data, error } = await query;
      if (error) { console.error('coaches error:', error.message); return []; }
      let result = data ?? [];
      if (filters?.specialty) result = result.filter((c: any) => c.specialties?.includes(filters.specialty));
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
      const { data, error } = await supabase.from('coaches').select('*, profiles:user_id (id, name, email, avatar, location, bio, phone)').eq('id', id).single();
      if (error) { console.error(error.message); return null; }
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
      const { data, error } = await supabase.from('reviews').select('*, profiles:user_id (id, name, avatar)').eq('target_id', targetId).eq('target_type', targetType).order('created_at', { ascending: false });
      if (error) { console.error(error.message); return []; }
      return data ?? [];
    },
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { target_id: string; target_type: string; rating: number; comment: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión');
      const { data, error } = await supabase.from('reviews').insert({ ...payload, user_id: user.id }).select().single();
      if (error) { if (error.code === '23505') throw new Error('Ya dejaste una reseña'); throw new Error(error.message); }
      return data;
    },
    onSuccess: (_, { target_id, target_type }) => { qc.invalidateQueries({ queryKey: ['reviews', target_id, target_type] }); toast.success('Reseña publicada'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── COMMUNITY ───────────────────────────────────────────────────────────────
export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('posts').select('*, profiles:user_id (id, name, avatar, role)').order('created_at', { ascending: false }).limit(30);
      if (error) { console.error('posts error:', error.message); return []; }
      return data ?? [];
    },
    retry: 1,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { content: string; sport?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión');
      const { data, error } = await supabase.from('posts').insert({ ...payload, user_id: user.id }).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['posts'] }); toast.success('Publicación creada'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Inicia sesión para dar like');
      if (liked) await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      else await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── ORDERS ──────────────────────────────────────────────────────────────────
export function useMyOrders() {
  return useQuery({
    queryKey: ['my_orders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase.from('orders').select('*, order_items (*, products:product_id (id, name, images, price))').eq('customer_id', user.id).order('created_at', { ascending: false });
      if (error) { console.error(error.message); return []; }
      return data ?? [];
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { items: Array<{ product_id: string; quantity: number; unit_price: number }>; total: number; shipping_address: object; payment_method: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión');
      const { data: order, error: orderError } = await supabase.from('orders').insert({ customer_id: user.id, total: payload.total, shipping_address: payload.shipping_address, payment_method: payload.payment_method, status: 'pending' }).select().single();
      if (orderError) throw new Error(orderError.message);
      const { error: itemsError } = await supabase.from('order_items').insert(payload.items.map(i => ({ ...i, order_id: order.id })));
      if (itemsError) throw new Error(itemsError.message);
      return order;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my_orders'] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── VENDOR ORDERS ───────────────────────────────────────────────────────────
export function useVendorOrders() {
  return useQuery({
    queryKey: ['vendor_orders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('order_items')
        .select('*, orders (id, status, total, created_at, customer_id, profiles:customer_id (name, email)), products (id, name, images, price)')
        .eq('products.vendor_id', user.id)
        .order('created_at', { ascending: false });
      if (error) { console.error(error.message); return []; }
      return data ?? [];
    },
  });
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
      if (error) { console.error(error.message); return []; }
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('Todas marcadas como leídas'); },
  });
}

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_dashboard_stats');
      if (error) { console.error(error.message); return { total_orders: 0, active_reservations: 0, tournaments_joined: 0, total_favorites: 0, total_spent: 0, unread_notifications: 0 }; }
      return data;
    },
  });
}

export function useMyReservations() {
  return useQuery({
    queryKey: ['my_reservations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase.from('reservations').select('*, courts (id, name, address, city, sport, images)').eq('customer_id', user.id).gte('date', new Date().toISOString().split('T')[0]).order('date', { ascending: true });
      if (error) { console.error(error.message); return []; }
      return data ?? [];
    },
  });
}

// ─── FAVORITES ───────────────────────────────────────────────────────────────
export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase.from('favorites').select('*').eq('user_id', user.id);
      if (error) { console.error(error.message); return []; }
      return data ?? [];
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetId, targetType, isFav }: { targetId: string; targetType: string; isFav: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Inicia sesión para guardar favoritos');
      if (isFav) await supabase.from('favorites').delete().eq('user_id', user.id).eq('target_id', targetId);
      else await supabase.from('favorites').insert({ user_id: user.id, target_id: targetId, target_type: targetType });
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single();
      if (error) throw new Error(error.message);
      updateProfile(data);
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); toast.success('Perfil actualizado'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useImageUpload() {
  return useMutation({
    mutationFn: async ({ file, bucket, path }: { file: File; bucket: string; path: string }) => {
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) throw new Error(error.message);
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return publicUrl;
    },
    onError: (e: Error) => toast.error(`Error subiendo imagen: ${e.message}`),
  });
}
