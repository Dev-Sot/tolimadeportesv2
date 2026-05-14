import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ShoppingCart, User, LogOut, Store, Calendar, Trophy, Users, MapPin, Bell, Settings, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNotifications } from '../../hooks/useSupabase';
import { useCartStore } from '../../stores/cartStore';
import { ThemeToggle } from '../ui/ThemeToggle';
import { cn } from '../../lib/utils';

const NAV = [
  { name: 'Marketplace', href: '/marketplace', icon: Store },
  { name: 'Canchas',     href: '/courts',      icon: MapPin },
  { name: 'Torneos',     href: '/tournaments', icon: Trophy },
  { name: 'Entrenadores',href: '/coaches',     icon: Users },
  { name: 'Comunidad',   href: '/community',   icon: Users },
];

const ROLE_LABELS: Record<string, string> = {
  customer: 'Cliente', vendor: 'Vendedor', admin: 'Administrador',
  organizer: 'Organizador', court_owner: 'Dueño de Cancha', coach: 'Entrenador',
};

export function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const { data: notifications = [] } = useNotifications();
  const unreadCount = isAuthenticated ? notifications.filter((n: any) => !n.read).length : 0;

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <nav className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/marketplace" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:block">Tolima Deportes</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV.map((item) => (
              <Link key={item.name} to={item.href}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/70 hover:text-foreground hover:bg-secondary/60'
                )}>
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Cart — always visible */}
            <Link to="/cart" className="relative p-2 rounded-lg hover:bg-secondary/60 transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated && user ? (
              <>
                {/* Notifications */}
                <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-secondary/60 transition-colors">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User menu */}
                <div className="relative">
                  <button onClick={() => setUserOpen(!userOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-secondary/60 transition-colors">
                    <img
                      src={user.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border-2 border-primary/20"
                    />
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium leading-tight">{user.name.split(' ')[0]}</p>
                      <p className="text-xs text-muted-foreground leading-tight">{ROLE_LABELS[user.role] ?? user.role}</p>
                    </div>
                    <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform hidden md:block', userOpen && 'rotate-180')} />
                  </button>

                  <AnimatePresence>
                    {userOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-60 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50"
                        onMouseLeave={() => setUserOpen(false)}
                      >
                        <div className="p-4 border-b border-border bg-secondary/20">
                          <div className="flex items-center gap-3">
                            <img src={user.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                              alt="" className="w-10 h-10 rounded-full" />
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{user.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                {ROLE_LABELS[user.role] ?? user.role}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="p-1.5">
                          {[
                            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                            { to: '/profile',   icon: User,            label: 'Mi Perfil' },
                          ].map(({ to, icon: Icon, label }) => (
                            <Link key={to} to={to}
                              onClick={() => setUserOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-secondary/60 transition-colors text-sm">
                              <Icon className="w-4 h-4 text-muted-foreground" />
                              {label}
                            </Link>
                          ))}
                          <div className="border-t border-border my-1" />
                          <button onClick={() => { logout(); setUserOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-destructive/10 text-destructive transition-colors text-sm">
                            <LogOut className="w-4 h-4" />
                            Cerrar sesión
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login"
                  className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-secondary/60 transition-colors">
                  Iniciar sesión
                </Link>
                <Link to="/register"
                  className="px-4 py-2 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  Registrarse
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-secondary/60 transition-colors">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-border overflow-hidden bg-background"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV.map((item) => (
                <Link key={item.name} to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                    isActive(item.href) ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/70 hover:bg-secondary/60'
                  )}>
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
              {!isAuthenticated && (
                <div className="pt-3 border-t border-border grid grid-cols-2 gap-2">
                  <Link to="/login" onClick={() => setMobileOpen(false)}
                    className="px-4 py-2.5 text-sm font-medium text-center border border-border rounded-xl hover:bg-secondary/60 transition-colors">
                    Iniciar sesión
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)}
                    className="px-4 py-2.5 text-sm font-medium text-center bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors">
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
