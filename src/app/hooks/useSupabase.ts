import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { generateBracket, recordMatchResult, type BracketMatch, type BracketParticipant } from '../lib/bracket';
import { toast } from 'sonner';

// ─── HELPER: crear notificación ───────────────────────────────────────────────
async function insertNotification(
  userId: string, type: string, title: string, message: string, link?: string
) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, type, title, message, link, read: false });
    if (error) console.error('[insertNotification]', error.message);
  } catch (e) {
    console.error('[insertNotification]', e);
  }
}

// Non-reactive read — use only inside queryFn / mutationFn callbacks, NOT in queryKey
function getUid(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

// Always reads from the LIVE Supabase session so the uid we send to the DB
// matches auth.uid() in RLS policies — even after a silent token refresh.
async function requireUid(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id ?? null;
  if (uid) return uid;
  throw new Error('No hay sesión activa. Por favor cierra sesión, vuelve a iniciarla y reintenta.');
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
      if (filters?.sortBy === 'price-asc')       query = query.order('price', { ascending: true });
      else if (filters?.sortBy === 'price-desc') query = query.order('price', { ascending: false });
      else if (filters?.sortBy === 'rating')     query = query.order('rating', { ascending: false });
      else query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) { console.error('products:', error.message); throw new Error(error.message); }
      return data ?? [];
    },
    retry: 1,
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev: any) => prev,
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
  const uid = useAuthStore((s) => s.user?.id) ?? null;
  return useQuery({
    queryKey: ['my_products', uid],
    enabled: !!uid,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
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
      const uid = await requireUid();

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

      // Direct await — withTimeout was causing false 12-second timeouts on
      // Supabase Free Tier cold starts which can take 15-25s naturally.
      // The browser's native fetch handles actual network failures.
      const { data, error } = await supabase
        .from('products')
        .insert(insert)
        .select()
        .single();

      if (error) {
        throw new Error(
          error.code === '42501'
            ? 'Sin permisos para publicar. Asegúrate de haber ejecutado el SQL de políticas RLS en Supabase.'
            : error.code === '23503'
            ? 'Tu perfil no existe en la base de datos. Cierra sesión, vuelve a entrar e intenta de nuevo.'
            : error.code === '23505'
            ? 'Ya existe un producto con esos datos.'
            : error.code === 'PGRST301'
            ? 'Sesión expirada. Cierra sesión y vuelve a entrar.'
            : `Error al publicar (${error.code ?? 'desconocido'}): ${error.message}`
        );
      }

      if (!data) throw new Error('El servidor no respondió. Intenta de nuevo en unos segundos.');
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
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      if (!data) throw new Error('No se pudo actualizar el producto. Verifica tus permisos.');
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
      end_time: string; notes?: string;
    }) => {
      // create_reservation recalcula el precio en servidor (horas × tarifa real
      // de la cancha) y bloquea la cancha durante la transacción para que dos
      // reservas simultáneas no se cuelen en el mismo horario. Antes esto se
      // calculaba en el navegador y la validación de choque era solo visual.
      const { data, error } = await supabase.rpc('create_reservation', {
        p_court_id: payload.court_id,
        p_date: payload.date,
        p_start_time: payload.start_time,
        p_end_time: payload.end_time,
        p_notes: payload.notes ?? null,
      });
      if (error) throw new Error(error.message);

      const uid = getUid();
      // Notificar al dueño de la cancha
      const { data: court } = await supabase.from('courts')
        .select('owner_id, name').eq('id', payload.court_id).single();
      if (court?.owner_id && court.owner_id !== uid) {
        await insertNotification(court.owner_id, 'reservation',
          'Nueva reserva recibida',
          `Alguien reservó "${court.name}" para el ${payload.date} de ${payload.start_time.slice(0,5)} a ${payload.end_time.slice(0,5)}`,
          '/court-owner');
      }
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
      const uid = await requireUid();
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

export function useUpdateCourt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('courts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      if (!data) throw new Error('No se pudo actualizar la cancha. Verifica tus permisos.');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courts'] });
      qc.invalidateQueries({ queryKey: ['my_courts'] });
      toast.success('Cancha actualizada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCourt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('courts').update({ is_active: false }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courts'] });
      qc.invalidateQueries({ queryKey: ['my_courts'] });
      toast.success('Cancha eliminada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMyCourts() {
  const uid = useAuthStore((s) => s.user?.id) ?? null;
  return useQuery({
    queryKey: ['my_courts', uid],
    enabled: !!uid,
    queryFn: async () => {
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
        .select('*, profiles:organizer_id (id, name, avatar), tournament_participants (id, user_id, team_name, status, profiles:user_id (id, name, avatar)), tournament_matches (*)')
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
      const uid = await requireUid();
      const { data, error } = await supabase.from('tournament_participants')
        .insert({ tournament_id: tournamentId, user_id: uid, team_name: teamName ?? null })
        .select().single();
      if (error) {
        if (error.code === '23505') throw new Error('Ya estás inscrito en este torneo');
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: async (_, { tournamentId }) => {
      qc.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      qc.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success('¡Inscripción exitosa!');
      // Notificar al organizador
      const uid = getUid();
      const { data: t } = await supabase.from('tournaments')
        .select('organizer_id, name').eq('id', tournamentId).single();
      if (t?.organizer_id && t.organizer_id !== uid) {
        await insertNotification(t.organizer_id, 'tournament',
          'Nueva inscripción en tu torneo',
          `Un participante se inscribió en "${t.name}"`,
          '/organizer');
      }
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
      const uid = await requireUid();
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

export function useUpdateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from('tournaments')
        .update(updates).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournaments'] });
      qc.invalidateQueries({ queryKey: ['my_tournaments'] });
      toast.success('Torneo actualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tournaments')
        .update({ status: 'cancelled' }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournaments'] });
      qc.invalidateQueries({ queryKey: ['my_tournaments'] });
      toast.success('Torneo cancelado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── BRACKET DE TORNEO ───────────────────────────────────────────────────────
// El algoritmo de emparejamiento vive en lib/bracket.ts (función pura, con
// tests). Estos hooks solo persisten su resultado — nunca reimplementan la
// lógica de avance en SQL ni en el cliente.

export function useGenerateBracket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tournamentId, participants }: {
      tournamentId: string;
      participants: BracketParticipant[];
    }) => {
      const bracket = generateBracket(participants);
      if (bracket.length === 0) {
        throw new Error('Se necesitan al menos 2 participantes inscritos para generar el bracket.');
      }

      // Idempotente: si ya existía un bracket (ej. se agregó gente y se
      // regenera antes de que arranque el torneo), se reemplaza por completo.
      await supabase.from('tournament_matches').delete().eq('tournament_id', tournamentId);

      const rows = bracket.map((m) => ({
        tournament_id: tournamentId,
        round: m.round,
        match_index: m.matchIndex,
        participant_a_id: m.participantA?.id ?? null,
        participant_b_id: m.participantB?.id ?? null,
        winner_id: m.winnerId ?? null,
      }));

      const { error } = await supabase.from('tournament_matches').insert(rows);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_r, { tournamentId }) => {
      qc.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      qc.invalidateQueries({ queryKey: ['my_tournaments'] });
      toast.success('Bracket generado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRecordMatchResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tournamentId, matches, round, matchIndex, winnerId }: {
      tournamentId: string;
      /** Estado actual del bracket, ya convertido a BracketMatch[]. */
      matches: BracketMatch[];
      round: number;
      matchIndex: number;
      winnerId: string;
    }) => {
      const updated = recordMatchResult(matches, round, matchIndex, winnerId);

      // Solo escribimos lo que cambió: el partido decidido y, si el ganador
      // avanzó, el partido de la siguiente ronda. El resto del árbol no se toca.
      const decided = updated.find((m) => m.round === round && m.matchIndex === matchIndex)!;
      const next = updated.find(
        (m) => m.round === round + 1 && m.matchIndex === Math.floor(matchIndex / 2)
      );

      const { error: e1 } = await supabase.from('tournament_matches')
        .update({ winner_id: decided.winnerId })
        .eq('tournament_id', tournamentId).eq('round', round).eq('match_index', matchIndex);
      if (e1) throw new Error(e1.message);

      if (next) {
        const { error: e2 } = await supabase.from('tournament_matches')
          .update({
            participant_a_id: next.participantA?.id ?? null,
            participant_b_id: next.participantB?.id ?? null,
          })
          .eq('tournament_id', tournamentId).eq('round', next.round).eq('match_index', next.matchIndex);
        if (e2) throw new Error(e2.message);
      }
    },
    onSuccess: (_r, { tournamentId }) => {
      qc.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      qc.invalidateQueries({ queryKey: ['my_tournaments'] });
      toast.success('Resultado registrado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMyTournaments() {
  const uid = useAuthStore((s) => s.user?.id) ?? null;
  return useQuery({
    queryKey: ['my_tournaments', uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return [];
      const { data, error } = await supabase.from('tournaments')
        .select('*, tournament_participants (id, user_id, team_name, status, profiles:user_id (id, name, avatar)), tournament_matches (*)')
        .eq('organizer_id', uid).order('created_at', { ascending: false });
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
      if (filters?.specialty) query = query.contains('specialties', [filters.specialty]);
      query = query.order('featured', { ascending: false }).order('rating', { ascending: false });
      const { data, error } = await query;
      if (error) { console.error('coaches:', error.message); return []; }
      return data ?? [];
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

export function useMyCoach() {
  const uid = useAuthStore((s) => s.user?.id) ?? null;
  return useQuery({
    queryKey: ['my_coach', uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return null;
      const { data } = await supabase.from('coaches')
        .select('*').eq('user_id', uid).maybeSingle();
      return data ?? null;
    },
  });
}

export function useUpsertCoach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      specialties: string[]; experience: string; certifications: string[];
      bio: string; hourly_rate: number; availability: string;
    }) => {
      const uid = await requireUid();
      const { data: existing } = await supabase.from('coaches')
        .select('id').eq('user_id', uid).maybeSingle();
      if (existing) {
        const { data, error } = await supabase.from('coaches')
          .update(payload).eq('user_id', uid).select().single();
        if (error) throw new Error(error.message);
        return data;
      } else {
        const { data, error } = await supabase.from('coaches')
          .insert({ ...payload, user_id: uid, rating: 0, review_count: 0, featured: false, is_active: true })
          .select().single();
        if (error) throw new Error(error.message);
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coaches'] });
      qc.invalidateQueries({ queryKey: ['my_coach'] });
      toast.success('Perfil de entrenador guardado');
    },
    onError: (e: Error) => toast.error(e.message),
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
      const uid = await requireUid();
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
    mutationFn: async (payload: { content: string; sport?: string; images?: string[] }) => {
      const uid = await requireUid();
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
      const uid = await requireUid();
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
  const uid = useAuthStore((s) => s.user?.id) ?? null;
  return useQuery({
    queryKey: ['my_orders', uid],
    enabled: !!uid,
    queryFn: async () => {
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
      items: Array<{ product_id: string; quantity: number }>;
      /** Solo para mostrar en la UI antes de pagar (ej. monto del widget de Wompi).
       *  El total que se guarda en la orden lo recalcula la función de Postgres
       *  `create_order_with_items` a partir del precio real — nunca se confía
       *  en este valor. Ver supabase/sql/002_create_order_with_items.sql */
      total: number;
      shipping_address: Record<string, string>;
      payment_method: string;
      payment_reference?: string;
    }) => {
      // create_order_with_items recalcula el total en servidor, valida stock
      // y descuenta inventario en una sola transacción — reemplaza los dos
      // inserts separados (orders + order_items) que antes podían dejar una
      // orden huérfana o confiar en un total manipulable desde el cliente.
      const { data: order, error } = await supabase.rpc('create_order_with_items', {
        p_items: payload.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        p_shipping_address: payload.shipping_address,
        p_payment_method: payload.payment_method,
        p_payment_reference: payload.payment_reference ?? null,
      });

      if (error) throw new Error(error.message);
      if (!order) throw new Error('El servidor no devolvió la orden. Intenta de nuevo.');

      return order;
    },
    onSuccess: async (_order, payload) => {
      qc.invalidateQueries({ queryKey: ['my_orders'] });
      qc.invalidateQueries({ queryKey: ['vendor_orders'] });
      // Only toast for cash payments; Wompi/PSE show their own success toast after
      // the payment widget confirms the transaction, preventing a premature celebration.
      if (payload.payment_method === 'cash') {
        toast.success('¡Pedido realizado!');
      }
      // Notificar a cada vendedor afectado
      const productIds = payload.items.map(i => i.product_id);
      const { data: products } = await supabase.from('products')
        .select('vendor_id, name').in('id', productIds);
      const vendorsSeen = new Set<string>();
      for (const p of products ?? []) {
        if (p.vendor_id && !vendorsSeen.has(p.vendor_id)) {
          vendorsSeen.add(p.vendor_id);
          await insertNotification(p.vendor_id, 'order',
            'Nuevo pedido recibido',
            `Tienes un nuevo pedido que incluye "${p.name}"`,
            '/vendor');
        }
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
      /** Wompi transaction ID for audit trail. Requires DB column:
       *  ALTER TABLE orders ADD COLUMN IF NOT EXISTS wompi_transaction_id TEXT; */
      wompi_transaction_id?: string;
    }) => {
      const updates: Record<string, unknown> = { status: payload.status };
      if (payload.wompi_transaction_id) {
        updates.wompi_transaction_id = payload.wompi_transaction_id;
      }

      const { error } = await supabase.from('orders').update(updates).eq('id', payload.id);

      // Graceful fallback: wompi_transaction_id column might not exist yet —
      // retry with just status so the order is still marked as paid/processing.
      if (error?.code === '42703') {
        const { error: e2 } = await supabase
          .from('orders')
          .update({ status: payload.status })
          .eq('id', payload.id);
        if (e2) throw new Error(e2.message);
        return;
      }

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my_orders'] });
      qc.invalidateQueries({ queryKey: ['vendor_orders'] });
    },
    onError: (e: Error) => console.error('updateOrder:', e.message),
  });
}

export function useVendorOrders() {
  const uid = useAuthStore((s) => s.user?.id) ?? null;
  return useQuery({
    queryKey: ['vendor_orders', uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return [];
      const { data: myProducts } = await supabase.from('products')
        .select('id').eq('vendor_id', uid);
      if (!myProducts?.length) return [];
      const ids = myProducts.map(p => p.id);
      const { data, error } = await supabase.from('order_items')
        .select('*, orders:order_id (id, created_at, status, total, profiles:customer_id (name, email, avatar)), products:product_id (id, name, images, price)')
        .in('product_id', ids)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) { console.error('vendor_orders:', error.message); return []; }
      return data ?? [];
    },
  });
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export function useNotifications() {
  const qc = useQueryClient();
  // Reactive selector — updates when auth state changes, unlike getState()
  const uid = useAuthStore((s) => s.user?.id) ?? null;

  useEffect(() => {
    if (!uid) return;

    // Unique channel name per effect execution prevents the error:
    // "cannot add postgres_changes callbacks after subscribe()"
    //
    // Root cause: React Strict Mode runs mount→cleanup→re-mount in rapid succession.
    // supabase.removeChannel() is async, so on the second mount the Supabase client
    // may return the SAME already-SUBSCRIBED channel object for the same name,
    // and calling .on() on a SUBSCRIBED channel throws the error.
    //
    // Fix: unique name per mount guarantees a fresh channel every time.
    const channelName = `user-notifications:${uid}:${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        // Use the exact queryKey including uid so TanStack Query hits the correct cache entry
        () => qc.invalidateQueries({ queryKey: ['notifications', uid] })
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [uid, qc]);

  return useQuery({
    queryKey: ['notifications', uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return [];
      const { data, error } = await supabase.from('notifications')
        .select('*').eq('user_id', uid)
        .order('created_at', { ascending: false }).limit(50);
      if (error) { console.error('notifications:', error.message); return []; }
      return data ?? [];
    },
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const qc  = useQueryClient();
  const uid = useAuthStore((s) => s.user?.id) ?? null;
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', uid] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc  = useQueryClient();
  const uid = useAuthStore((s) => s.user?.id) ?? null;
  return useMutation({
    mutationFn: async () => {
      if (!uid) return;
      await supabase.from('notifications').update({ read: true }).eq('user_id', uid).eq('read', false);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', uid] });
      toast.success('Todas marcadas como leídas');
    },
  });
}

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
export function useDashboardStats() {
  const uid = useAuthStore((s) => s.user?.id) ?? null;
  return useQuery({
    queryKey: ['dashboard_stats', uid],
    enabled: !!uid,
    queryFn: async () => {
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

export function useCourtOwnerReservations() {
  const uid = useAuthStore((s) => s.user?.id) ?? null;
  return useQuery({
    queryKey: ['court_owner_reservations', uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return [];
      const { data: courts } = await supabase.from('courts').select('id').eq('owner_id', uid);
      if (!courts?.length) return [];
      const ids = courts.map(c => c.id);
      const { data, error } = await supabase.from('reservations')
        .select('*, courts (id, name, sport), profiles:customer_id (id, name, email, phone, avatar)')
        .in('court_id', ids)
        .order('date', { ascending: false })
        .limit(50);
      if (error) { console.error('court_owner_res:', error.message); return []; }
      return data ?? [];
    },
  });
}

export function useUpdateReservationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'confirmed' | 'cancelled' }) => {
      const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['court_owner_reservations'] });
      toast.success(status === 'confirmed' ? 'Reserva confirmada' : 'Reserva cancelada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reservations')
        .update({ status: 'cancelled' }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my_reservations'] });
      qc.invalidateQueries({ queryKey: ['court_owner_reservations'] });
      qc.invalidateQueries({ queryKey: ['court_reservations'] });
      toast.success('Reserva cancelada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMyReservations() {
  const uid = useAuthStore((s) => s.user?.id) ?? null;
  return useQuery({
    queryKey: ['my_reservations', uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return [];
      const { data, error } = await supabase.from('reservations')
        .select('*, courts (id, name, address, city, sport, images)')
        // Use Colombia's local date (UTC-5) — toISOString() returns UTC which can
        // be tomorrow in Colombia after 7 PM, causing today's reservations to vanish.
        .eq('customer_id', uid)
        .gte('date', new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }))
        .order('date', { ascending: true });
      if (error) { console.error('my_reservations:', error.message); return []; }
      return data ?? [];
    },
  });
}

// ─── FAVORITES ───────────────────────────────────────────────────────────────
export function useFavorites() {
  const uid = useAuthStore((s) => s.user?.id) ?? null;
  return useQuery({
    queryKey: ['favorites', uid],
    enabled: !!uid,
    queryFn: async () => {
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
      const uid = await requireUid();
      if (isFav) {
        await supabase.from('favorites').delete().eq('user_id', uid).eq('target_id', targetId);
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: uid, target_id: targetId, target_type: targetType });
        // 23505 = unique_violation — ya estaba marcado como favorito (doble clic
        // o pestañas duplicadas); no es un error real, se ignora.
        if (error && error.code !== '23505') throw new Error(error.message);
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
    mutationFn: async (updates: { name?: string; bio?: string; phone?: string; location?: string; avatar?: string }) => {
      const uid = await requireUid();
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

// ─── SUSCRIPCIÓN / PLAN PRO ──────────────────────────────────────────────────
export function useMySubscription() {
  const uid = useAuthStore((s) => s.user?.id) ?? null;
  return useQuery({
    queryKey: ['subscription', uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return null;
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();
      if (error) { console.error('subscription:', error.message); return null; }
      return data;
    },
  });
}

/** true si el plan Pro está activo y no ha vencido. */
export function useIsPro() {
  const { data } = useMySubscription();
  if (!data || data.plan !== 'pro' || data.status !== 'active') return false;
  if (data.current_period_end && new Date(data.current_period_end) < new Date()) return false;
  return true;
}

export function useActivateProPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { wompi_reference: string }) => {
      const uid = await requireUid();
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30);

      const { data, error } = await supabase
        .from('subscriptions')
        .upsert(
          {
            user_id: uid,
            plan: 'pro',
            status: 'active',
            current_period_end: periodEnd.toISOString(),
            wompi_reference: payload.wompi_reference,
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription'] });
      toast.success('¡Listo! Tu plan Pro está activo por 30 días.');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── LIQUIDACIONES (PAYOUTS) ─────────────────────────────────────────────────
// Alcance: solo vendedores del marketplace, porque son las únicas líneas con
// comisión registrada (order_items.commission_amount, desde v1.5). Dueños de
// cancha quedan fuera hasta que las reservas tengan el mismo tracking.

export function useVendorBalance() {
  const uid = useAuthStore((s) => s.user?.id) ?? null;
  return useQuery({
    queryKey: ['vendor_balance', uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return null;
      const { data, error } = await supabase.rpc('get_vendor_balance', { p_vendor_id: uid });
      if (error) { console.error('vendor_balance:', error.message); return null; }
      return data?.[0] ?? null;
    },
  });
}

export function useVendorPayouts() {
  const uid = useAuthStore((s) => s.user?.id) ?? null;
  return useQuery({
    queryKey: ['vendor_payouts', uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return [];
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .eq('vendor_id', uid)
        .order('created_at', { ascending: false });
      if (error) { console.error('vendor_payouts:', error.message); return []; }
      return data ?? [];
    },
  });
}

/** Solo para el panel de administración: cada vendedor con su saldo pendiente. */
export function useVendorsWithBalance() {
  return useQuery({
    queryKey: ['admin_vendor_balances'],
    queryFn: async () => {
      const { data: vendors, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .contains('roles', ['vendor']);
      if (error) { console.error('admin_vendor_balances:', error.message); return []; }

      const withBalance = await Promise.all(
        (vendors ?? []).map(async (v: any) => {
          const { data } = await supabase.rpc('get_vendor_balance', { p_vendor_id: v.id });
          return { ...v, balance: data?.[0] ?? { gross_amount: 0, commission_amount: 0, net_amount: 0, order_count: 0 } };
        })
      );
      return withBalance;
    },
  });
}

/** Solo para el panel de administración: todas las liquidaciones pendientes de pago. */
export function useAdminPendingPayouts() {
  return useQuery({
    queryKey: ['admin_pending_payouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payouts')
        .select('*, profiles:vendor_id (name, email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) { console.error('admin_pending_payouts:', error.message); return []; }
      return data ?? [];
    },
  });
}

export function useGeneratePayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vendorId: string) => {
      const { data, error } = await supabase.rpc('generate_payout', { p_vendor_id: vendorId });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_vendor_balances'] });
      qc.invalidateQueries({ queryKey: ['admin_pending_payouts'] });
      qc.invalidateQueries({ queryKey: ['vendor_balance'] });
      qc.invalidateQueries({ queryKey: ['vendor_payouts'] });
      toast.success('Liquidación generada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMarkPayoutPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payoutId: string) => {
      const { data, error } = await supabase.rpc('mark_payout_paid', { p_payout_id: payoutId });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_vendor_balances'] });
      qc.invalidateQueries({ queryKey: ['admin_pending_payouts'] });
      qc.invalidateQueries({ queryKey: ['vendor_payouts'] });
      toast.success('Liquidación marcada como pagada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── VERIFICACIÓN DE ENTRENADORES ────────────────────────────────────────────
export function useAdminCoaches() {
  return useQuery({
    queryKey: ['admin_coaches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coaches')
        .select('*, profiles:user_id (id, name, email, avatar)')
        .order('created_at', { ascending: false });
      if (error) { console.error('admin_coaches:', error.message); return []; }
      return data ?? [];
    },
  });
}

export function useVerifyCoach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ coachId, verified }: { coachId: string; verified: boolean }) => {
      const { data, error } = await supabase
        .from('coaches')
        .update({ verified, verified_at: verified ? new Date().toISOString() : null })
        .eq('id', coachId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coaches'] });
      qc.invalidateQueries({ queryKey: ['admin_coaches'] });
      toast.success('Estado de verificación actualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}