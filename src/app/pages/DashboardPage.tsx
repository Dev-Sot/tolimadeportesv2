import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Package, Calendar, Trophy, Heart, ShoppingBag, MapPin, Star, Bell, TrendingUp, Store, Megaphone, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';
import { useDashboardStats, useMyOrders, useMyReservations, useNotifications } from '../hooks/useSupabase';
import { formatCurrency, formatDate, formatRelativeTime } from '../lib/utils';

const ORDER_STATUS: Record<string, { label: string; variant: any }> = {
  pending:    { label: 'Pendiente',   variant: 'warning' },
  processing: { label: 'Procesando', variant: 'info' },
  shipped:    { label: 'Enviado',     variant: 'info' },
  delivered:  { label: 'Entregado',  variant: 'success' },
  cancelled:  { label: 'Cancelado',  variant: 'destructive' },
};

// Role-specific quick actions
const ROLE_ACTIONS: Record<string, Array<{ label: string; to: string; icon: any; color: string }>> = {
  vendor: [
    { label: 'Mis productos', to: '/vendor', icon: Store, color: 'text-primary' },
    { label: 'Marketplace', to: '/marketplace', icon: ShoppingBag, color: 'text-accent' },
    { label: 'Canchas', to: '/courts', icon: MapPin, color: 'text-blue-500' },
    { label: 'Comunidad', to: '/community', icon: Users, color: 'text-purple-500' },
  ],
  organizer: [
    { label: 'Mis torneos', to: '/organizer', icon: Trophy, color: 'text-accent' },
    { label: 'Ver torneos', to: '/tournaments', icon: Megaphone, color: 'text-primary' },
    { label: 'Marketplace', to: '/marketplace', icon: ShoppingBag, color: 'text-blue-500' },
    { label: 'Comunidad', to: '/community', icon: Users, color: 'text-purple-500' },
  ],
  court_owner: [
    { label: 'Mis canchas', to: '/court-owner', icon: MapPin, color: 'text-blue-500' },
    { label: 'Ver canchas', to: '/courts', icon: Calendar, color: 'text-primary' },
    { label: 'Torneos', to: '/tournaments', icon: Trophy, color: 'text-accent' },
    { label: 'Comunidad', to: '/community', icon: Users, color: 'text-purple-500' },
  ],
  coach: [
    { label: 'Mi perfil',    to: '/coach',       icon: Star,      color: 'text-purple-500' },
    { label: 'Entrenadores', to: '/coaches',      icon: Users,     color: 'text-primary' },
    { label: 'Torneos',      to: '/tournaments',  icon: Trophy,    color: 'text-accent' },
    { label: 'Comunidad',    to: '/community',    icon: Users,     color: 'text-blue-500' },
  ],
  customer: [
    { label: 'Marketplace', to: '/marketplace', icon: ShoppingBag, color: 'text-primary' },
    { label: 'Torneos', to: '/tournaments', icon: Trophy, color: 'text-accent' },
    { label: 'Canchas', to: '/courts', icon: MapPin, color: 'text-blue-500' },
    { label: 'Entrenadores', to: '/coaches', icon: Star, color: 'text-purple-500' },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  customer:    'Cliente',
  vendor:      'Vendedor',
  organizer:   'Organizador',
  court_owner: 'Dueño de cancha',
  coach:       'Entrenador',
  admin:       'Admin',
};

export function DashboardPage() {
  const { user, activeRole, setActiveRole } = useAuthStore();
  const { data: stats } = useDashboardStats();
  const { data: orders = [], isLoading: loadingOrders } = useMyOrders();
  const { data: reservations = [] } = useMyReservations();
  const { data: notifications = [] } = useNotifications();
  const unread = notifications.filter((n: any) => !n.read).length;

  const role = activeRole ?? user?.role ?? 'customer';
  const userRoles = user?.roles ?? [role];
  const quickActions = ROLE_ACTIONS[role] ?? ROLE_ACTIONS.customer;

  const STATS = [
    { label: 'Pedidos', value: stats?.total_orders ?? orders.length, icon: Package, color: 'bg-green-50 dark:bg-green-950 text-green-600' },
    { label: 'Reservas activas', value: stats?.active_reservations ?? reservations.length, icon: Calendar, color: 'bg-blue-50 dark:bg-blue-950 text-blue-600' },
    { label: 'Torneos', value: stats?.tournaments_joined ?? 0, icon: Trophy, color: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-600' },
    { label: 'Favoritos', value: stats?.total_favorites ?? 0, icon: Heart, color: 'bg-pink-50 dark:bg-pink-950 text-pink-600' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome banner */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/8 via-accent/5 to-transparent rounded-2xl p-6 mb-8 border border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-full border-4 border-background shadow-md overflow-hidden flex-shrink-0 bg-secondary">
              <img src={user?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                alt={user?.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">¡Hola, {user?.name?.split(' ')[0]}! 👋</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              {userRoles.length > 1 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {userRoles.map((r) => (
                    <button
                      key={r}
                      onClick={() => setActiveRole(r)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                        r === role
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary text-muted-foreground border-border hover:border-primary hover:text-primary'
                      }`}
                    >
                      {ROLE_LABELS[r] ?? r}
                    </button>
                  ))}
                </div>
              ) : (
                <Badge variant="primary" size="sm" className="mt-2">{ROLE_LABELS[role] ?? role}</Badge>
              )}
            </div>
            {unread > 0 && (
              <Link to="/notifications">
                <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-xl text-sm font-medium hover:bg-destructive/20 transition-colors">
                  <Bell className="w-4 h-4" />
                  {unread} sin leer
                </div>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Role-specific CTA for vendors/organizers */}
        {(role === 'vendor' || role === 'organizer' || role === 'court_owner' || role === 'coach') && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mb-8 p-5 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold">
                {role === 'vendor' ? '¿Listo para vender?' :
                 role === 'organizer' ? '¿Listo para organizar?' :
                 role === 'coach' ? '¿Listo para entrenar?' :
                 '¿Listo para recibir reservas?'}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {role === 'vendor' ? 'Publica productos y llega a toda la comunidad deportiva del Tolima' :
                 role === 'organizer' ? 'Crea torneos y conecta con equipos de los 47 municipios del Tolima' :
                 role === 'coach' ? 'Completa tu perfil y empieza a recibir solicitudes de atletas' :
                 'Registra tus canchas y empieza a recibir reservas digitales hoy'}
              </p>
            </div>
            <Link to={role === 'vendor' ? '/vendor' : role === 'organizer' ? '/organizer' : role === 'coach' ? '/coach' : '/court-owner'} className="shrink-0 w-full sm:w-auto">
              <Button>
                {role === 'vendor' ? 'Gestionar productos' :
                 role === 'organizer' ? 'Gestionar torneos' :
                 role === 'coach' ? 'Mi perfil de entrenador' :
                 'Gestionar canchas'}
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STATS.map(({ label, value, icon: Icon, color }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Recent orders */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pedidos recientes</CardTitle>
                  <Link to="/profile"><Button variant="ghost" size="sm">Ver todos →</Button></Link>
                </div>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-14 bg-secondary animate-pulse rounded-lg" />)}</div>
                ) : orders.slice(0, 4).length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">Aún no tienes pedidos</p>
                    <Link to="/marketplace"><Button size="sm">Ir al Marketplace</Button></Link>
                  </div>
                ) : orders.slice(0, 4).map((order: any) => {
                  const s = ORDER_STATUS[order.status] ?? { label: order.status, variant: 'default' };
                  const first = order.order_items?.[0]?.products;
                  return (
                    <div key={order.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {first?.images?.[0] ? <img src={first.images[0]} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{first?.name ?? `Pedido #${order.id.slice(-6).toUpperCase()}`}</p>
                        <p className="text-xs text-muted-foreground">{formatRelativeTime(order.created_at)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-primary">{formatCurrency(order.total)}</p>
                        <Badge variant={s.variant} size="sm">{s.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Upcoming reservations */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Próximas reservas</CardTitle>
                  <Link to="/courts"><Button variant="ghost" size="sm">Reservar →</Button></Link>
                </div>
              </CardHeader>
              <CardContent>
                {reservations.slice(0, 3).length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">Sin reservas próximas</p>
                    <Link to="/courts"><Button size="sm">Reservar cancha</Button></Link>
                  </div>
                ) : reservations.slice(0, 3).map((r: any) => (
                  <div key={r.id} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.courts?.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(r.date)} · {r.start_time?.slice(0,5)} – {r.end_time?.slice(0,5)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-primary">{formatCurrency(r.total_price)}</p>
                      <Badge variant="success" size="sm">Confirmada</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <Card>
              <CardHeader><CardTitle className="text-sm">Acciones rápidas</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {quickActions.map(({ label, to, icon: Icon, color }) => (
                  <Link key={label} to={to}>
                    <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors text-center cursor-pointer">
                      <Icon className={`w-6 h-6 ${color}`} />
                      <span className="text-xs font-medium leading-tight">{label}</span>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Resumen financiero</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Total gastado', value: formatCurrency(stats?.total_spent ?? 0) },
                  { label: 'Pedidos completados', value: orders.filter((o: any) => o.status === 'delivered').length },
                  { label: 'Notificaciones', value: unread > 0 ? `${unread} sin leer` : 'Al día' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
                <Link to="/profile">
                  <Button fullWidth variant="outline" size="sm" className="mt-2">Ver perfil completo</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
