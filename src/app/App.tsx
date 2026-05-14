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

const qc = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 1000 * 60 * 2 } },
});

function PrivateRoute({ children }: { children: ReactNode }) {
  const ok = useAuthStore((s) => s.isAuthenticated);
  return ok ? <>{children}</> : <Navigate to="/login" />;
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const ok = useAuthStore((s) => s.isAuthenticated);
  return !ok ? <>{children}</> : <Navigate to="/dashboard" />;
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
  useEffect(() => { loadSession(); }, [loadSession]);

  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          {/* Redirect root to marketplace — no landing page */}
          <Route path="/" element={<Navigate to="/marketplace" replace />} />

          {/* Auth */}
          <Route path="/login"    element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

          {/* Core platform */}
          <Route path="/marketplace"               element={<Layout><MarketplacePage /></Layout>} />
          <Route path="/marketplace/product/:id"   element={<Layout><ProductDetailPage /></Layout>} />
          <Route path="/cart"                       element={<Layout><CartPage /></Layout>} />
          <Route path="/checkout"                   element={<PrivateRoute><Layout noFooter><CheckoutPage /></Layout></PrivateRoute>} />

          <Route path="/courts"      element={<Layout><CourtsPage /></Layout>} />
          <Route path="/courts/:id"  element={<Layout><CourtDetailPage /></Layout>} />

          <Route path="/tournaments"     element={<Layout><TournamentsPage /></Layout>} />
          <Route path="/tournaments/:id" element={<Layout><TournamentDetailPage /></Layout>} />

          <Route path="/coaches"     element={<Layout><CoachesPage /></Layout>} />
          <Route path="/coaches/:id" element={<Layout><CoachDetailPage /></Layout>} />

          <Route path="/community" element={<Layout><CommunityPage /></Layout>} />

          {/* Auth-required */}
          <Route path="/dashboard" element={<PrivateRoute><Layout><DashboardPage /></Layout></PrivateRoute>} />
          <Route path="/profile"   element={<PrivateRoute><Layout><ProfilePage /></Layout></PrivateRoute>} />

          {/* Static pages */}
          <Route path="/about"   element={<Layout><AboutPage /></Layout>} />
          <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
          <Route path="/faq"     element={<Layout><FAQPage /></Layout>} />
          <Route path="/blog"    element={<Layout><BlogPage /></Layout>} />
          <Route path="/terms"   element={<Layout><TermsPage /></Layout>} />
          <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
          <Route path="/returns" element={<Layout><ReturnsPage /></Layout>} />

          {/* Legacy / broken footer links */}
          <Route path="/marketplace/categories" element={<Navigate to="/marketplace" replace />} />
          <Route path="/marketplace/deals"      element={<Navigate to="/marketplace" replace />} />
          <Route path="/vendors"                element={<Navigate to="/marketplace" replace />} />
          <Route path="/careers"                element={<Navigate to="/about" replace />} />
          <Route path="/settings"               element={<Navigate to="/profile" replace />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/marketplace" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
