import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MarketplacePage } from './pages/MarketplacePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CourtsPage } from './pages/CourtsPage';
import { CourtDetailPage } from './pages/CourtDetailPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { TournamentDetailPage } from './pages/TournamentDetailPage';
import { CoachesPage } from './pages/CoachesPage';
import { CoachDetailPage } from './pages/CoachDetailPage';
import { CommunityPage } from './pages/CommunityPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { VendorDashboardPage } from './pages/VendorDashboardPage';
import { OrganizerDashboardPage } from './pages/OrganizerDashboardPage';
import { CourtOwnerDashboardPage } from './pages/CourtOwnerDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { FAQPage } from './pages/FAQPage';
import { BlogPage } from './pages/BlogPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { ReturnsPage } from './pages/ReturnsPage';
import { useAuthStore } from './stores/authStore';
import { useEffect, type ReactNode } from 'react';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

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
  if (!roles.includes(user?.role ?? '')) return <Navigate to="/dashboard" replace />;
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
      <main className="flex-1">{children}</main>
      {!noFooter && <Footer />}
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

export default function App() {
  const loadSession = useAuthStore((s) => s.loadSession);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
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

  return (
    <ErrorBoundary>
      <QueryClientProvider client={qc}>
        <BrowserRouter>
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

            {/* Static pages */}
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
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}