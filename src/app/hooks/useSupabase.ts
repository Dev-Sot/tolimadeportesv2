import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

export function useProducts(filters?: {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'rating';
}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`*, profiles:vendor_id (id, name, avatar, role)`)
        .eq('is_active', true);

      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.search)
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      if (filters?.minPrice) query = query.gte('price', filters.minPrice);
      if (filters?.maxPrice) query = query.lte('price', filters.maxPrice);

      if (filters?.sortBy === 'price-asc') query = query.order('price', { ascending: true });
      else if (filters?.sortBy === 'price-desc') query = query.order('price', { ascending: false });
      else if (filters?.sortBy === 'rating') query = query.order('rating', { ascending: false });
      else query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`*, profiles:vendor_id (id, name, avatar, rating)`)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

// ─── COURTS ──────────────────────────────────────────────────────────────────

export function useCourts(filters?: { sport?: string; search?: string }) {
  return useQuery({
    queryKey: ['courts', filters],
    queryFn: async () => {
      let query = supabase
        .from('courts')
        .select(`*, profiles:owner_id (id, name, phone)`)
        .eq('is_active', true);

      if (filters?.sport) query = query.eq('sport', filters.sport);
      if (filters?.search)
        query = query.or(`name.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);

      query = query.order('featured', { ascending: false }).order('rating', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCourt(id: string) {
  return useQuery({
    queryKey: ['court', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courts')
        .select(`*, profiles:owner_id (id, name, phone), court_availability (*)`)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCourtReservations(courtId: string, date: string) {
  return useQuery({
    queryKey: ['court_reservations', courtId, date],
    enabled: !!courtId && !!date,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('start_time, end_time')
        .eq('court_id', courtId)
        .eq('date', date)
        .not('status', 'eq', 'cancelled');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      court_id: string;
      date: string;
      start_time: string;
      end_time: string;
      total_price: number;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión para reservar');
      const { data, error } = await supabase
        .from('reservations')
        .insert({ ...payload, customer_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['court_reservations'] });
      toast.success('¡Reserva creada exitosamente!');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── TOURNAMENTS ─────────────────────────────────────────────────────────────

export function useTournaments(filters?: { sport?: string; status?: string; search?: string }) {
  return useQuery({
    queryKey: ['tournaments', filters],
    queryFn: async () => {
      let query = supabase
        .from('tournaments')
        .select(`*, profiles:organizer_id (id, name, avatar)`);

      if (filters?.sport) query = query.eq('sport', filters.sport);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.search)
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);

      query = query.order('featured', { ascending: false }).order('start_date', { ascending: true });
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTournament(id: string) {
  return useQuery({
    queryKey: ['tournament', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select(`*, profiles:organizer_id (id, name, avatar),
          tournament_participants (id, user_id, team_name, status, registered_at,
            profiles:user_id (id, name, avatar))`)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useJoinTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tournamentId, teamName }: { tournamentId: string; teamName?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión para inscribirte');
      const { data, error } = await supabase
        .from('tournament_participants')
        .insert({ tournament_id: tournamentId, user_id: user.id, team_name: teamName })
        .select()
        .single();
      if (error) {
        if (error.code === '23505') throw new Error('Ya estás inscrito en este torneo');
        throw error;
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

// ─── COACHES ─────────────────────────────────────────────────────────────────

export function useCoaches(filters?: { specialty?: string; search?: string }) {
  return useQuery({
    queryKey: ['coaches', filters],
    queryFn: async () => {
      let query = supabase
        .from('coaches')
        .select(`*, profiles:user_id (id, name, email, avatar, location, bio)`)
        .eq('is_active', true);

      if (filters?.search)
        query = query.or(
          `bio.ilike.%${filters.search}%`
        );

      query = query.order('featured', { ascending: false }).order('rating', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;

      // Filter by specialty client-side (array field)
      let result = data ?? [];
      if (filters?.specialty)
        result = result.filter((c: any) => c.specialties?.includes(filters.specialty));
      return result;
    },
  });
}

export function useCoach(id: string) {
  return useQuery({
    queryKey: ['coach', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coaches')
        .select(`*, profiles:user_id (id, name, email, avatar, location, bio, phone)`)
        .eq('id', id)
        .single();
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('reviews')
        .select(`*, profiles:user_id (id, name, avatar)`)
        .eq('target_id', targetId)
        .eq('target_type', targetType)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      target_id: string;
      target_type: string;
      rating: number;
      comment: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión');
      const { data, error } = await supabase
        .from('reviews')
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();
      if (error) {
        if (error.code === '23505') throw new Error('Ya dejaste una reseña para este elemento');
        throw error;
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
      const { data, error } = await supabase
        .from('posts')
        .select(`*, profiles:user_id (id, name, avatar, role)`)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { content: string; sport?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión para publicar');
      const { data, error } = await supabase
        .from('posts')
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Publicación creada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Inicia sesión para dar like');
      if (liked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

// ─── ORDERS ──────────────────────────────────────────────────────────────────

export function useMyOrders() {
  return useQuery({
    queryKey: ['my_orders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items (*, products:product_id (id, name, images, price))`)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      items: Array<{ product_id: string; quantity: number; unit_price: number }>;
      total: number;
      shipping_address: object;
      payment_method: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión');

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          total: payload.total,
          shipping_address: payload.shipping_address,
          payment_method: payload.payment_method,
          status: 'pending',
        })
        .select()
        .single();
      if (orderError) throw orderError;

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(payload.items.map((i) => ({ ...i, order_id: order.id })));
      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my_orders'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_dashboard_stats');
      if (error) throw error;
      return data as {
        total_orders: number;
        active_reservations: number;
        tournaments_joined: number;
        total_favorites: number;
        total_spent: number;
        unread_notifications: number;
      };
    },
  });
}

export function useMyReservations() {
  return useQuery({
    queryKey: ['my_reservations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('reservations')
        .select(`*, courts (id, name, address, city, sport, images)`)
        .eq('customer_id', user.id)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      targetId,
      targetType,
      isFav,
    }: {
      targetId: string;
      targetType: string;
      isFav: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Inicia sesión para guardar favoritos');
      if (isFav) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('target_id', targetId)
          .eq('target_type', targetType);
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, target_id: targetId, target_type: targetType });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30000, // poll every 30s
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────

export function useUpdateProfile() {
  const { updateProfile } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: {
      name?: string;
      bio?: string;
      phone?: string;
      location?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
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
