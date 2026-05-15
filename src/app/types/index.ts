export type UserRole = 'customer' | 'vendor' | 'organizer' | 'court_owner' | 'coach' | 'admin';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;       // rol principal (compatibilidad)
  roles: UserRole[];    // todos los roles del usuario
  createdAt: string;
  phone?: string;
  location?: string;
  bio?: string;
}

// Supabase joined profile shape
export interface SupabaseProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  rating?: number;
  phone?: string;
  role?: UserRole;
  roles?: UserRole[];
}

// Product supports both camelCase (mockData) and snake_case (Supabase)
export interface Product {
  id: string;
  // camelCase (mockData)
  vendorId?: string;
  vendor?: { id: string; name: string; avatar?: string; rating: number };
  reviewCount?: number;
  createdAt?: string;
  updatedAt?: string;
  // snake_case (Supabase)
  vendor_id?: string;
  profiles?: SupabaseProfile;
  review_count?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  // shared
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  subcategory?: string;
  stock: number;
  rating: number;
  featured: boolean;
  tags: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Order {
  id: string;
  customerId?: string;
  customer_id?: string;
  items: Array<{ product: Product; quantity: number; price: number }>;
  total: number;
  status: OrderStatus;
  shippingAddress?: Address;
  shipping_address?: object;
  paymentMethod?: string;
  payment_method?: string;
  createdAt?: string;
  created_at?: string;
}

export interface Court {
  id: string;
  ownerId?: string;
  owner_id?: string;
  owner?: { id: string; name: string; phone: string };
  profiles?: SupabaseProfile;
  name: string;
  description: string;
  images: string[];
  sport: string;
  // camelCase location (mockData)
  location?: { address: string; city: string; coordinates: { lat: number; lng: number } };
  // snake_case (Supabase)
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  amenities: string[];
  pricePerHour?: number;
  price_per_hour?: number;
  availability?: CourtAvailability[];
  court_availability?: any[];
  rating: number;
  reviewCount?: number;
  review_count?: number;
  featured: boolean;
  is_active?: boolean;
  createdAt?: string;
  created_at?: string;
}

export interface CourtAvailability {
  dayOfWeek?: number;
  day_of_week?: number;
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
}

export interface Reservation {
  id: string;
  courtId?: string;
  court_id?: string;
  court?: Court;
  courts?: Court;
  customerId?: string;
  customer_id?: string;
  date: string;
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  status: ReservationStatus;
  totalPrice?: number;
  total_price?: number;
  notes?: string;
  createdAt?: string;
  created_at?: string;
}

export interface Tournament {
  id: string;
  organizerId?: string;
  organizer_id?: string;
  organizer?: { id: string; name: string; avatar?: string };
  profiles?: SupabaseProfile;
  name: string;
  description: string;
  sport: string;
  image?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  registrationDeadline?: string;
  registration_deadline?: string;
  location: string;
  maxParticipants?: number;
  max_participants?: number;
  currentParticipants?: number;
  current_participants?: number;
  entryFee?: number;
  entry_fee?: number;
  prizes: string[];
  rules?: string;
  status: TournamentStatus;
  featured: boolean;
  tournament_participants?: TournamentParticipant[];
  createdAt?: string;
  created_at?: string;
}

export interface TournamentParticipant {
  id: string;
  tournamentId?: string;
  tournament_id?: string;
  userId?: string;
  user_id?: string;
  user?: { id: string; name: string; avatar?: string };
  profiles?: SupabaseProfile;
  teamName?: string;
  team_name?: string;
  registeredAt?: string;
  registered_at?: string;
  status: 'registered' | 'confirmed' | 'withdrawn';
}

export interface Coach {
  id: string;
  userId?: string;
  user_id?: string;
  user?: User;
  profiles?: SupabaseProfile;
  specialties: string[];
  experience?: string;
  certifications: string[];
  bio?: string;
  hourlyRate?: number;
  hourly_rate?: number;
  availability?: string;
  rating: number;
  reviewCount?: number;
  review_count?: number;
  featured: boolean;
  is_active?: boolean;
  createdAt?: string;
  created_at?: string;
}

export interface Review {
  id: string;
  userId?: string;
  user_id?: string;
  user?: { id: string; name: string; avatar?: string };
  profiles?: SupabaseProfile;
  targetId?: string;
  target_id?: string;
  targetType?: 'product' | 'court' | 'coach' | 'tournament';
  target_type?: string;
  rating: number;
  comment: string;
  createdAt?: string;
  created_at?: string;
  helpful?: number;
}

export interface Post {
  id: string;
  userId?: string;
  user_id?: string;
  user?: { id: string; name: string; avatar?: string; role: UserRole };
  profiles?: SupabaseProfile & { role?: UserRole };
  content: string;
  images?: string[];
  likes: number;
  comments: number;
  createdAt?: string;
  created_at?: string;
  sport?: string;
}

export interface Notification {
  id: string;
  userId?: string;
  user_id?: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt?: string;
  created_at?: string;
}
