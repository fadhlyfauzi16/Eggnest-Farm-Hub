import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';
import { FarmProvider, useFarm } from './context/FarmContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { Toast } from './components/common/Toast';
import { QuickReportModal } from './components/common/QuickReportModal';
import { PATH_TO_PAGE, ActivePage } from './routes';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { DailyReportPage } from './pages/DailyReportPage';
import { DevelopmentPage } from './pages/DevelopmentPage';
import { AcademyPage } from './pages/AcademyPage';
import { SupportPage } from './pages/SupportPage';
import { FarmScorePage } from './pages/FarmScorePage';
import { FarmProfilePage } from './pages/FarmProfilePage';
import { AdminPage } from './pages/AdminPage';
import { ApiDocsPage } from './pages/ApiDocsPage';

// Public Standalone Wrapper
const PublicWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { textScale, setActivePage } = useFarm();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const matchedPage = PATH_TO_PAGE[location.pathname];
    if (matchedPage) {
      setActivePage(matchedPage as ActivePage);
    }
  }, [location.pathname, setActivePage]);

  const textSizeClass =
    textScale === 'xlarge' ? 'text-lg' : textScale === 'large' ? 'text-base' : 'text-sm';

  return (
    <div className={`min-h-screen ${textSizeClass}`}>
      <Toast />
      {children}
    </div>
  );
};

// Authenticated Application Shell Layout
const AppLayout: React.FC = () => {
  const { textScale, setActivePage } = useFarm();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const matchedPage = PATH_TO_PAGE[location.pathname];
    if (matchedPage) {
      setActivePage(matchedPage as ActivePage);
    }
  }, [location.pathname, setActivePage]);

  const textSizeClass =
    textScale === 'xlarge' ? 'text-lg' : textScale === 'large' ? 'text-base' : 'text-sm';

  return (
    <div
      className={`min-h-screen bg-[#FDFBF7] text-[#1B3022] font-['Plus_Jakarta_Sans'] ${textSizeClass} flex flex-col selection:bg-[#EAF2EC]`}
    >
      {/* Toast Notification */}
      <Toast />

      {/* Quick Report Floating Modal */}
      <QuickReportModal />

      {/* Top Header */}
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex-1 flex w-full">
        {/* Desktop Left Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile Drawer Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-200">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative z-10 w-72 max-w-[85vw] bg-[#1B3022] h-full shadow-2xl overflow-y-auto">
              <Sidebar onNavigate={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 w-full min-w-0 px-3 sm:px-6 lg:px-8 py-4 md:py-6 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Visible on mobile screens) */}
      <BottomNav />
    </div>
  );
};

// Route Definitions
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route
        path="/"
        element={
          <PublicWrapper>
            <LandingPage />
          </PublicWrapper>
        }
      />
      <Route
        path="/auth"
        element={
          <PublicWrapper>
            <AuthPage />
          </PublicWrapper>
        }
      />
      <Route path="/login" element={<Navigate to="/auth?mode=login" replace />} />
      <Route path="/register" element={<Navigate to="/auth?mode=register" replace />} />

      {/* App Shell Pages */}
      <Route element={<AppLayout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/beranda" element={<Navigate to="/home" replace />} />

        <Route path="/reports" element={<DailyReportPage />} />
        <Route path="/laporan" element={<Navigate to="/reports" replace />} />

        <Route path="/development" element={<DevelopmentPage />} />
        <Route path="/perkembangan" element={<Navigate to="/development" replace />} />

        <Route path="/academy" element={<AcademyPage />} />

        <Route path="/support" element={<SupportPage />} />
        <Route path="/bantuan" element={<Navigate to="/support" replace />} />

        <Route path="/score" element={<FarmScorePage />} />
        <Route path="/farm" element={<Navigate to="/score" replace />} />

        <Route path="/profile" element={<FarmProfilePage />} />
        <Route path="/profil" element={<Navigate to="/profile" replace />} />

        <Route path="/admin" element={<AdminPage />} />
        <Route path="/apidocs" element={<ApiDocsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <FarmProvider>
        <AppRoutes />
      </FarmProvider>
    </BrowserRouter>
  );
}

