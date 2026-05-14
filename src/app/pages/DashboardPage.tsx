import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Package, Calendar, Trophy, Heart, TrendingUp, ShoppingBag, MapPin, Star, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';
import { useDashboardStats, useMyOrders, useMyReservations } from '../hooks/useSupabase';
import { formatCurrency, formatDate, formatRelativeTime } from '../lib/utils';

const ORDER_STATUS: Record<string, { label: string; variant: any }> = {
  pending:    { label: 'Pendiente',   variant: 'warning' },
  processing: { label: 'Procesando', variant: 'info' },
  shipped:    { label: 'Enviado',     variant: 'info' },
  delivered:  { label: 'Entregado',  variant: 'success' },
  cancelled:  { label: 'Cancelado',  variant: 'destructive' },
};

export function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const { data: orders = [], isLoading: loadingOrders } = useMyOrders();
  const { data: reservations = [] } = useMyReservations();

  const STAT_CARDS = [
    { label: 'Pedidos totales', value: stats?.total_orders ?? 0, icon: Package, color: 'bg-green-50 text-green-600', trend: '+2 este mes' },
    { label: 'Reservas activas', value: stats?.active_reservations ?? 0, icon: Calendar, color: 'bg-blue-50 text-blue-600', trend: 'Próximas' },
    { label: 'Torneos inscritos', value: stats?.tournaments_joined ?? 0, icon: Trophy, color: 'bg-yellow-50 text-yellow-600', trend: 'En curso' },
    { label: 'Favoritos', value: stats?.total_favorites ?? 0, icon: Heart, color: 'bg-pink-50 text-pink-600', trend: 'Guardados' },
  ];

  const QUICK = [
    { label: 'Marketplace', icon: ShoppingBag, to: '/marketplace', color: 'text-primary' },
    { label: 'Torneos', icon: Trophy, to: '/tournaments', color: 'text-accent' },
    { label: 'Canchas', icon: MapPin, to: '/courts', color: 'text-blue-500' },
    { label: 'Entrenadores', icon: Star, to: '/coaches', color: 'text-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/5 via-accent/5 to-transparent rounded-2xl p-6 mb-8 border border-border">
          <div className="flex items-center gap-4">
            <img src={user?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
              alt={user?.name} className="w-16 h-16 rounded-full border-4 border-background shadow" />
            <div>
              <h1 className="text-2xl font-bold">¡Hola, {user?.name?.split(' ')[0]}! 👋</h1>
              <p className="text-muted-foreground text-sm">
                Bienvenido a tu dashboard deportivo · {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            {(stats?.unread_notifications ?? 0) > 0 && (
              <Link to="/profile" className="ml-auto">
                <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-2 rounded-xl text-sm font-medium">
                  <Bell className="w-4 h-4" />
                  {stats!.unread_notifications} sin leer
                </div>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map(({ label, value, icon: Icon, color, trend }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}>
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />{trend}
                  </span>
                </div>
                {loadingStats ? (
                  <div className="h-7 w-12 bg-secondary animate-pulse rounded mb-1" />
                ) : (
                  <p className="text-3xl font-bold">{value}</p>
                )}
                <p className="text-xs text-muted-foreground">{label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Orders */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pedidos recientes</CardTitle>
                  <Link to="/profile"><Button variant="ghost" size="sm">Ver todos →</Button></Link>
                </div>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-14 bg-secondary animate-pulse rounded-lg"/>)}</div>
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
                        {first?.images?.[0] ? (
                          <img src={first.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : <Package className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {first?.name ?? `Pedido #${order.id.slice(-6).toUpperCase()}`}
                        </p>
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

            {/* Reservations */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Próximas reservas</CardTitle>
                  <Link to="/courts"><Button variant="ghost" size="sm">Nueva reserva →</Button></Link>
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
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.courts?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(r.date)} · {r.start_time?.slice(0,5)} – {r.end_time?.slice(0,5)}
                      </p>
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
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Acciones rápidas</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {QUICK.map(({ label, icon: Icon, to, color }) => (
                  <Link key={label} to={to}>
                    <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors cursor-pointer text-center">
                      <Icon className={`w-6 h-6 ${color}`} />
                      <span className="text-xs font-medium">{label}</span>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Mi perfil</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <img src={user?.avatar} alt="" className="w-10 h-10 rounded-full" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  {[
                    { label: 'Rol', value: user?.role },
                    { label: 'Ubicación', value: user?.location ?? 'No especificada' },
                    { label: 'Total gastado', value: formatCurrency(stats?.total_spent ?? 0) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium capitalize">{value}</span>
                    </div>
                  ))}
                </div>
                <Link to="/profile">
                  <Button fullWidth variant="outline" size="sm">Ver perfil completo</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
