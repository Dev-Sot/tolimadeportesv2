export type UserRole = 'customer' | 'vendor' | 'organizer' | 'court_owner' | 'coach' | 'admin';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
  phone?: string;
  location?: string;
  bio?: string;
}

export interface Product {
  id: string;
  vendorId: string;
  vendor: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
  };
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  subcategory?: string;
  stock: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: Array<{
    product: Product;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: OrderStatus;
  shippingAddress: Address;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Court {
  id: string;
  ownerId: string;
  owner: {
    id: string;
    name: string;
    phone: string;
  };
  name: string;
  description: string;
  images: string[];
  sport: string;
  location: {
    address: string;
    city: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  amenities: string[];
  pricePerHour: number;
  availability: CourtAvailability[];
  rating: number;
  reviewCount: number;
  featured: boolean;
  createdAt: string;
}

export interface CourtAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Reservation {
  id: string;
  courtId: string;
  court: Court;
  customerId: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  totalPrice: number;
  notes?: string;
  createdAt: string;
}

export interface Tournament {
  id: string;
  organizerId: string;
  organizer: {
    id: string;
    name: string;
    avatar?: string;
  };
  name: string;
  description: string;
  sport: string;
  image: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  entryFee: number;
  prizes: string[];
  rules: string;
  status: TournamentStatus;
  featured: boolean;
  createdAt: string;
}

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  teamName?: string;
  registeredAt: string;
  status: 'registered' | 'confirmed' | 'withdrawn';
}

export interface Coach {
  id: string;
  userId: string;
  user: User;
  specialties: string[];
  experience: string;
  certifications: string[];
  bio: string;
  hourlyRate: number;
  availability: string;
  rating: number;
  reviewCount: number;
  featured: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  targetId: string;
  targetType: 'product' | 'court' | 'coach' | 'tournament';
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
}

export interface Post {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  content: string;
  images?: string[];
  likes: number;
  comments: number;
  createdAt: string;
  sport?: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'reservation' | 'tournament' | 'review' | 'comment' | 'like' | 'follow';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueGrowth: number;
  ordersGrowth: number;
  topProducts: Array<{
    product: Product;
    sales: number;
    revenue: number;
  }>;
  recentOrders: Order[];
}
