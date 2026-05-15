import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Package, Calendar, Trophy, Heart, Bell, Settings, Edit3, Save, X, MapPin, Phone, Mail, ArrowLeft, ShieldCheck } from 'lucide-react';
import { ImageUpload } from '../components/shared/ImageUpload';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useAuthStore } from '../stores/authStore';
import { useMyOrders, useMyReservations, useDashboardStats, useNotifications, useMarkNotificationRead, useUpdateProfile, useCancelReservation } from '../hooks/useSupabase';
import { formatCurrency, formatDate, formatRelativeTime } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import type { UserRole } from '../types';

const TABS = [
  { id: 'overview', label: 'Resumen', icon: User },
  { id: 'orders', label: 'Pedidos', icon: Package },
  { id: 'reservations', label: 'Reservas', icon: Calendar },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'settings', label: 'Configuración', icon: Settings },
] as const;

type Tab = typeof TABS[number]['id'];

const ORDER_STATUS: Record<string, { label: string; variant: any }> = {
  pending:    { label: 'Pendiente',   variant: 'warning' },
  processing: { label: 'Procesando', variant: 'info' },
  shipped:    { label: 'Enviado',     variant: 'info' },
  delivered:  { label: 'Entregado',  variant: 'success' },
  cancelled:  { label: 'Cancelado',  variant: 'destructive' },
};

const RES_STATUS: Record<string, { label: string; variant: any }> = {
  pending:   { label: 'Pendiente',  variant: 'warning' },
  confirmed: { label: 'Confirmada', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
  completed: { label: 'Completada', variant: 'default' },
};

const ALL_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'customer',    label: 'Cliente',          description: 'Compra productos y reserva canchas' },
  { value: 'vendor',      label: 'Vendedor',         description: 'Publica y vende productos deportivos' },
  { value: 'organizer',   label: 'Organizador',      description: 'Crea y gestiona torneos' },
  { value: 'court_owner', label: 'Dueño de cancha',  description: 'Registra canchas y recibe reservas' },
  { value: 'coach',       label: 'Entrenador',       description: 'Ofrece sesiones de entrenamiento' },
];

export function ProfilePage() {
  const { user, updateProfile: updateStoreProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '', location: user?.location ?? '', bio: user?.bio ?? '', avatar: user?.avatar ?? '' });
  const [savingRoles, setSavingRoles] = useState(false);

  const { data: stats } = useDashboardStats();
  const { data: orders = [], isLoading: loadingOrders } = useMyOrders();
  const { data: reservations = [], isLoading: loadingRes } = useMyReservations();
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const updateProfile = useUpdateProfile();
  const cancelReservation = useCancelReservation();

  const unread = notifications.filter((n: any) => !n.read).length;

  async function handleSave() {
    await updateProfile.mutateAsync(form);
    setEditing(false);
  }

  async function handleToggleRole(role: UserRole) {
    if (!user) return;
    const current = user.roles ?? [user.role];
    const hasRole = current.includes(role);
    if (hasRole && current.length === 1) {
      toast.error('Debes tener al menos un rol activo');
      return;
    }
    const updated = hasRole ? current.filter((r) => r !== role) : [...current, role];
    setSavingRoles(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ roles: updated })
        .eq('id', user.id);
      if (error) throw new Error(error.message);
      updateStoreProfile({ roles: updated });
      toast.success(hasRole ? `Rol "${role}" eliminado` : `Rol "${role}" activado`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingRoles(false);
    }
  }

  // Back button is in the header section
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Cargando perfil...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-transparent border-b border-border py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"><ArrowLeft className="w-4 h-4" /> Volver al dashboard</Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              <img src={user.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                alt={user?.name ?? ""} className="w-24 h-24 rounded-full border-4 border-background shadow-lg object-cover" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full border-2 border-background" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold">{user?.name}</h1>
                {(user?.roles ?? [user?.role]).map((r) => (
                  <Badge key={r} variant="primary" size="sm">
                    {ALL_ROLES.find((x) => x.value === r)?.label ?? r}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                <Mail className="w-3 h-3" />{user?.email}
              </p>
              {user?.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{user?.location}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar nav */}
          <aside>
            <nav className="space-y-1">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                    ${activeTab === id ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary/50 text-muted-foreground'}`}>
                  <Icon className="w-4 h-4" />
                  {label}
                  {id === 'notifications' && unread > 0 && (
                    <span className="ml-auto text-xs bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5">{unread}</span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* ── OVERVIEW ── */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Pedidos', value: stats?.total_orders ?? orders.length, icon: Package, color: 'text-primary' },
                    { label: 'Reservas activas', value: stats?.active_reservations ?? 0, icon: Calendar, color: 'text-blue-500' },
                    { label: 'Torneos', value: stats?.tournaments_joined ?? 0, icon: Trophy, color: 'text-accent' },
                    { label: 'Favoritos', value: stats?.total_favorites ?? 0, icon: Heart, color: 'text-pink-500' },
                    { label: 'Total gastado', value: formatCurrency(stats?.total_spent ?? 0), icon: Package, color: 'text-green-500' },
                    { label: 'Sin leer', value: unread, icon: Bell, color: 'text-yellow-500' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label} className="p-4">
                      <Icon className={`w-5 h-5 mb-2 ${color}`} />
                      <p className="text-2xl font-bold">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </Card>
                  ))}
                </div>

                {/* Recent orders */}
                <Card>
                  <CardHeader><CardTitle>Pedidos recientes</CardTitle></CardHeader>
                  <CardContent>
                    {loadingOrders ? (
                      <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-12 bg-secondary animate-pulse rounded" />)}</div>
                    ) : orders.slice(0, 3).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Sin pedidos aún</p>
                    ) : orders.slice(0, 3).map((order: any) => {
                      const s = ORDER_STATUS[order.status] ?? { label: order.status, variant: 'default' };
                      return (
                        <div key={order.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                          <div>
                            <p className="text-sm font-medium">Pedido #{order.id.slice(-6).toUpperCase()}</p>
                            <p className="text-xs text-muted-foreground">{formatRelativeTime(order.created_at)}</p>
                          </div>
                          <div className="text-right">
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
                  <CardHeader><CardTitle>Próximas reservas</CardTitle></CardHeader>
                  <CardContent>
                    {loadingRes ? (
                      <div className="h-12 bg-secondary animate-pulse rounded" />
                    ) : reservations.slice(0, 2).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Sin reservas próximas</p>
                    ) : reservations.slice(0, 2).map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div>
                          <p className="text-sm font-medium">{r.courts?.name}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(r.date)} · {r.start_time?.slice(0,5)} – {r.end_time?.slice(0,5)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-primary">{formatCurrency(r.total_price)}</p>
                          <Badge variant={RES_STATUS[r.status]?.variant ?? 'default'} size="sm">{RES_STATUS[r.status]?.label ?? r.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ── ORDERS ── */}
            {activeTab === 'orders' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader><CardTitle>Mis Pedidos ({orders.length})</CardTitle></CardHeader>
                  <CardContent>
                    {loadingOrders ? (
                      <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-secondary animate-pulse rounded" />)}</div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No tienes pedidos aún</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order: any) => {
                          const s = ORDER_STATUS[order.status] ?? { label: order.status, variant: 'default' };
                          return (
                            <div key={order.id} className="border border-border rounded-xl p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <p className="font-medium">Pedido #{order.id.slice(-6).toUpperCase()}</p>
                                  <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                                </div>
                                <div className="text-right">
                                  <Badge variant={s.variant}>{s.label}</Badge>
                                  <p className="text-sm font-bold text-primary mt-1">{formatCurrency(order.total)}</p>
                                </div>
                              </div>
                              {(order.order_items ?? []).map((item: any) => (
                                <div key={item.id} className="flex items-center gap-3 py-2 border-t border-border">
                                  <img src={item.products?.images?.[0] ?? 'https://placehold.co/40x40'} alt=""
                                    className="w-10 h-10 rounded-lg object-cover bg-secondary" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate">{item.products?.name}</p>
                                    <p className="text-xs text-muted-foreground">x{item.quantity} · {formatCurrency(item.unit_price)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ── RESERVATIONS ── */}
            {activeTab === 'reservations' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader><CardTitle>Mis Reservas</CardTitle></CardHeader>
                  <CardContent>
                    {loadingRes ? (
                      <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-secondary animate-pulse rounded" />)}</div>
                    ) : reservations.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No tienes reservas próximas</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reservations.map((r: any) => {
                          const s = RES_STATUS[r.status] ?? { label: r.status, variant: 'default' };
                          return (
                            <div key={r.id} className="flex items-center gap-4 p-4 border border-border rounded-xl">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{r.courts?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(r.date)} · {r.start_time?.slice(0,5)} – {r.end_time?.slice(0,5)}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3" />{r.courts?.city}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0 space-y-1">
                                <p className="font-semibold text-primary">{formatCurrency(r.total_price)}</p>
                                <Badge variant={s.variant} size="sm">{s.label}</Badge>
                                {(r.status === 'pending' || r.status === 'confirmed') && r.date >= new Date().toISOString().split('T')[0] && (
                                  <button
                                    onClick={() => {
                                      if (confirm('¿Cancelar esta reserva?')) cancelReservation.mutate(r.id);
                                    }}
                                    disabled={cancelReservation.isPending}
                                    className="flex items-center gap-1 text-xs text-destructive hover:underline disabled:opacity-50 mt-1"
                                  >
                                    <X className="w-3 h-3" /> Cancelar
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeTab === 'notifications' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Notificaciones</CardTitle>
                      {unread > 0 && (
                        <Button size="sm" variant="ghost"
                          onClick={() => notifications.filter((n: any) => !n.read).forEach((n: any) => markRead.mutate(n.id))}>
                          Marcar todas como leídas
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {notifications.length === 0 ? (
                      <div className="text-center py-12">
                        <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">Sin notificaciones</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((n: any) => (
                          <div key={n.id}
                            onClick={() => !n.read && markRead.mutate(n.id)}
                            className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors
                              ${n.read ? 'opacity-60' : 'bg-primary/5 hover:bg-primary/10'}`}>
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.read ? 'bg-muted-foreground/30' : 'bg-primary'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{n.title}</p>
                              <p className="text-xs text-muted-foreground">{n.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(n.created_at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ── SETTINGS ── */}
            {activeTab === 'settings' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Configuración del perfil</CardTitle>
                      {!editing ? (
                        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                          <Edit3 className="w-4 h-4" /> Editar
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                            <X className="w-4 h-4" /> Cancelar
                          </Button>
                          <Button size="sm" loading={updateProfile.isPending} onClick={handleSave}>
                            <Save className="w-4 h-4" /> Guardar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Foto de perfil</label>
                      {editing ? (
                        <ImageUpload
                          value={form.avatar ? [form.avatar] : []}
                          onChange={(urls) => setForm({ ...form, avatar: urls[0] ?? '' })}
                          single
                        />
                      ) : (
                        <img
                          src={user.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                          alt={user.name}
                          className="w-16 h-16 rounded-full border-2 border-border object-cover"
                        />
                      )}
                    </div>

                    {[
                      { label: 'Nombre completo', key: 'name', type: 'text', icon: User },
                      { label: 'Teléfono', key: 'phone', type: 'tel', icon: Phone },
                      { label: 'Ubicación', key: 'location', type: 'text', icon: MapPin },
                    ].map(({ label, key, type, icon: Icon }) => (
                      <div key={key}>
                        <label className="text-sm font-medium mb-1 flex items-center gap-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />{label}
                        </label>
                        {editing ? (
                          <input type={type} value={(form as any)[key]}
                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                        ) : (
                          <p className="text-sm text-muted-foreground px-3 py-2 bg-secondary/30 rounded-lg">
                            {((user as any)?.[key]) || <span className="italic">No especificado</span>}
                          </p>
                        )}
                      </div>
                    ))}
                    <div>
                      <label className="text-sm font-medium mb-1 block">Biografía</label>
                      {editing ? (
                        <textarea value={form.bio} rows={3}
                          onChange={(e) => setForm({ ...form, bio: e.target.value })}
                          className="w-full px-3 py-2 border border-input rounded-lg bg-input-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
                      ) : (
                        <p className="text-sm text-muted-foreground px-3 py-2 bg-secondary/30 rounded-lg">
                          {user.bio || <span className="italic">Sin bio</span>}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-border pt-4">
                      <p className="text-sm font-medium flex items-center gap-2 mb-3">
                        <ShieldCheck className="w-4 h-4 text-muted-foreground" /> Mis roles
                      </p>
                      <div className="space-y-2">
                        {ALL_ROLES.map(({ value, label, description }) => {
                          const active = (user?.roles ?? [user?.role]).includes(value);
                          return (
                            <div key={value}
                              className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                                active ? 'border-primary/40 bg-primary/5' : 'border-border'
                              }`}>
                              <div>
                                <p className="text-sm font-medium">{label}</p>
                                <p className="text-xs text-muted-foreground">{description}</p>
                              </div>
                              <button
                                disabled={savingRoles}
                                onClick={() => handleToggleRole(value)}
                                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 overflow-hidden ${
                                  active ? 'bg-primary' : 'bg-secondary border border-border'
                                } disabled:opacity-50`}
                              >
                                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                                  active ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                        <Mail className="w-3 h-3" /> Email (no editable)
                      </p>
                      <p className="text-sm">{user?.email}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
