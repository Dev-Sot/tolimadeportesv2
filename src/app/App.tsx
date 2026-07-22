import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, lazy, Suspense, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { useAuthStore } from './stores/authStore';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { isSupabaseConfigured } from './lib/supabase';
import { SetupScreen } from './components/shared/SetupScreen';

// Cada página en su propio chunk — evita que todo el catálogo de páginas
// (dashboards de 4 roles, panel admin, páginas legales, etc.) viaje en el
// bundle inicial cuando la mayoría de una visita solo toca 2 o 3 rutas.
const MarketplacePage = lazy(() => import('./pages/MarketplacePage').then((m) => ({ default: m.MarketplacePage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const CourtsPage = lazy(() => import('./pages/CourtsPage').then((m) => ({ default: m.CourtsPage })));
const CourtDetailPage = lazy(() => import('./pages/CourtDetailPage').then((m) => ({ default: m.CourtDetailPage })));
const TournamentsPage = lazy(() => import('./pages/TournamentsPage').then((m) => ({ default: m.TournamentsPage })));
const TournamentDetailPage = lazy(() => import('./pages/TournamentDetailPage').then((m) => ({ default: m.TournamentDetailPage })));
const CoachesPage = lazy(() => import('./pages/CoachesPage').then((m) => ({ default: m.CoachesPage })));
const CoachDetailPage = lazy(() => import('./pages/CoachDetailPage').then((m) => ({ default: m.CoachDetailPage })));
const CommunityPage = lazy(() => import('./pages/CommunityPage').then((m) => ({ default: m.CommunityPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const VendorDashboardPage = lazy(() => import('./pages/VendorDashboardPage').then((m) => ({ default: m.VendorDashboardPage })));
const OrganizerDashboardPage = lazy(() => import('./pages/OrganizerDashboardPage').then((m) => ({ default: m.OrganizerDashboardPage })));
const CourtOwnerDashboardPage = lazy(() => import('./pages/CourtOwnerDashboardPage').then((m) => ({ default: m.CourtOwnerDashboardPage })));
const CoachDashboardPage = lazy(() => import('./pages/CoachDashboardPage').then((m) => ({ default: m.CoachDashboardPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const FAQPage = lazy(() => import('./pages/FAQPage').then((m) => ({ default: m.FAQPage })));
const BlogPage = lazy(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const ReturnsPage = lazy(() => import('./pages/ReturnsPage').then((m) => ({ default: m.ReturnsPage })));
const PricingPage = lazy(() => import('./pages/PricingPage').then((m) => ({ default: m.PricingPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));

function RouteLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-label="Cargando" />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const qc = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 1000 * 60 * 2 } },
});

function PrivateRoute({ children }: { children: ReactNode }) {
  const ok = useAuthStore((s) => s.isAuthenticated);
  return ok ? <>{children}</> : <Navigate to="/login" replace />;
}

function RoleRoute({ children, roles }: { children: ReactNode; roles: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const userRoles = user?.roles ?? [user?.role ?? ''];
  if (!roles.some((r) => userRoles.includes(r as any))) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return !isAuth ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function Layout({ children, noFooter }: { children: ReactNode; noFooter?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-1">{children}</main>
      {!noFooter && <Footer />}
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

export default function App() {
  const loadSession = useAuthStore((s) => s.loadSession);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Clear old auth storage key if it exists (migration from old key)
    const oldKey = localStorage.getItem('tolima-auth');
    const newKey = localStorage.getItem('tolima-auth-v2');
    if (oldKey && !newKey) {
      // Migrate: copy old auth to new key
      localStorage.setItem('tolima-auth-v2', oldKey);
      localStorage.removeItem('tolima-auth');
    }
    loadSession();
  }, [loadSession]);

  if (!isSupabaseConfigured) {
    return <SetupScreen />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<RouteLoader />}>
          <Routes>
            {/* Redirect root to marketplace */}
            <Route path="/" element={<Navigate to="/marketplace" replace />} />

            {/* Auth */}
            <Route path="/login"    element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

            {/* Public marketplace */}
            <Route path="/marketplace"             element={<Layout><MarketplacePage /></Layout>} />
            <Route path="/marketplace/product/:id" element={<Layout><ProductDetailPage /></Layout>} />
            <Route path="/cart"                    element={<Layout><CartPage /></Layout>} />
            <Route path="/checkout"                element={<PrivateRoute><Layout noFooter><CheckoutPage /></Layout></PrivateRoute>} />

            {/* Courts */}
            <Route path="/courts"     element={<Layout><CourtsPage /></Layout>} />
            <Route path="/courts/:id" element={<Layout><CourtDetailPage /></Layout>} />

            {/* Tournaments */}
            <Route path="/tournaments"     element={<Layout><TournamentsPage /></Layout>} />
            <Route path="/tournaments/:id" element={<Layout><TournamentDetailPage /></Layout>} />

            {/* Coaches */}
            <Route path="/coaches"     element={<Layout><CoachesPage /></Layout>} />
            <Route path="/coaches/:id" element={<Layout><CoachDetailPage /></Layout>} />

            {/* Community */}
            <Route path="/community" element={<Layout><CommunityPage /></Layout>} />

            {/* Auth-required */}
            <Route path="/dashboard"      element={<PrivateRoute><Layout><DashboardPage /></Layout></PrivateRoute>} />
            <Route path="/profile"        element={<PrivateRoute><Layout><ProfilePage /></Layout></PrivateRoute>} />
            <Route path="/notifications"  element={<PrivateRoute><Layout><NotificationsPage /></Layout></PrivateRoute>} />

            {/* Role-specific dashboards */}
            <Route path="/vendor"       element={<RoleRoute roles={['vendor','admin']}><Layout><VendorDashboardPage /></Layout></RoleRoute>} />
            <Route path="/organizer"    element={<RoleRoute roles={['organizer','admin']}><Layout><OrganizerDashboardPage /></Layout></RoleRoute>} />
            <Route path="/court-owner"  element={<RoleRoute roles={['court_owner','admin']}><Layout><CourtOwnerDashboardPage /></Layout></RoleRoute>} />
            <Route path="/coach"        element={<RoleRoute roles={['coach','admin']}><Layout><CoachDashboardPage /></Layout></RoleRoute>} />
            <Route path="/admin"        element={<RoleRoute roles={['admin']}><Layout><AdminPage /></Layout></RoleRoute>} />

            {/* Static pages */}
            <Route path="/pricing" element={<Layout><PricingPage /></Layout>} />
            <Route path="/about"   element={<Layout><AboutPage /></Layout>} />
            <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
            <Route path="/faq"     element={<Layout><FAQPage /></Layout>} />
            <Route path="/blog"    element={<Layout><BlogPage /></Layout>} />
            <Route path="/terms"   element={<Layout><TermsPage /></Layout>} />
            <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
            <Route path="/returns" element={<Layout><ReturnsPage /></Layout>} />

            {/* Redirects */}
            <Route path="/marketplace/categories" element={<Navigate to="/marketplace" replace />} />
            <Route path="/marketplace/deals"      element={<Navigate to="/marketplace" replace />} />
            <Route path="/vendors"                element={<Navigate to="/marketplace" replace />} />
            <Route path="/careers"                element={<Navigate to="/about" replace />} />
            <Route path="/settings"               element={<Navigate to="/profile" replace />} />
            <Route path="*"                       element={<Navigate to="/marketplace" replace />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}