import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { FarmProvider, useFarm } from './context/FarmContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { Toast } from './components/common/Toast';
import { PATH_TO_PAGE, ActivePage } from './routes';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { DailyReportPage } from './pages/DailyReportPage';
import { EggSalesPage } from './pages/EggSalesPage';
import { DevelopmentPage } from './pages/DevelopmentPage';
import { AcademyPage } from './pages/AcademyPage';
import { SupportPage } from './pages/SupportPage';
import { FarmScorePage } from './pages/FarmScorePage';
import { FarmProfilePage } from './pages/FarmProfilePage';
import { MemberActivationPage } from './pages/MemberActivationPage';
import { AdminPage } from './pages/AdminPage';
import { ApiDocsPage } from './pages/ApiDocsPage';
import { MitraDashboardPage } from './pages/MitraDashboardPage';
import { MitraMembersPage } from './pages/MitraMembersPage';
import { MitraReportsPage } from './pages/MitraReportsPage';
import { MitraMonitoringPage } from './pages/MitraMonitoringPage';
import { MitraFollowUpPage } from './pages/MitraFollowUpPage';
import { MitraProfilePage } from './pages/MitraProfilePage';

const PublicWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { textScale, setActivePage } = useFarm();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const matchedPage = PATH_TO_PAGE[location.pathname];
    if (matchedPage) setActivePage(matchedPage as ActivePage);
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

const RequireSession: React.FC<{ role?: 'member' | 'admin' | 'mitra' }> = ({ role }) => {
  const { currentUser, isLoading } = useFarm();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-[#1B3022] font-bold">
        Memuat Eggnest Farm Hub...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth?mode=login" replace state={{ from: location.pathname }} />;
  }

  if (role && currentUser.role !== role) {
    const target =
      currentUser.role === 'admin' ? '/admin' : currentUser.role === 'mitra' ? '/mitra' : '/home';
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
};


const hasCompletedMemberActivation = (farm: any): boolean => {
  if (!farm?.id) return false;

  const location = String(farm?.location || '').trim();
  const fullAddress = String(farm?.fullAddress || farm?.full_address || '').trim();
  const lat = farm?.latitude;
  const lng = farm?.longitude;

  const locationKey = location.toLowerCase();
  const validLocation =
    location.length > 0 &&
    locationKey !== 'indonesia' &&
    !locationKey.includes('belum') &&
    !locationKey.includes('menunggu');

  const validLat =
    lat !== null &&
    lat !== undefined &&
    lat !== '' &&
    Number.isFinite(Number(lat));

  const validLng =
    lng !== null &&
    lng !== undefined &&
    lng !== '' &&
    Number.isFinite(Number(lng));

  return validLocation && fullAddress.length > 0 && validLat && validLng;
};

const RequireMemberActivated: React.FC = () => {
  const { currentUser, farm, isLoading } = useFarm();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-[#1B3022] font-bold">
        Memeriksa aktivasi kandang...
      </div>
    );
  }

  if (currentUser?.role !== 'member') {
    return <Outlet />;
  }

  if (!hasCompletedMemberActivation(farm)) {
    return <Navigate to="/activate" replace />;
  }

  return <Outlet />;
};

const AppLayout: React.FC = () => {
  const { textScale, setActivePage, currentUser } = useFarm();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isMember = currentUser?.role === 'member';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const matchedPage = PATH_TO_PAGE[location.pathname];
    if (matchedPage) setActivePage(matchedPage as ActivePage);
  }, [location.pathname, setActivePage]);

  const textSizeClass =
    textScale === 'xlarge' ? 'text-lg' : textScale === 'large' ? 'text-base' : 'text-sm';

  return (
    <div
      className={`min-h-screen bg-[#FDFBF7] text-[#1B3022] font-['Plus_Jakarta_Sans'] ${textSizeClass} flex flex-col selection:bg-[#EAF2EC]`}
    >
      <Toast />
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex-1 flex w-full">
        <div className="hidden md:block">
          <Sidebar />
        </div>

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

        <main className="flex-1 w-full min-w-0 px-3 sm:px-6 lg:px-8 py-4 md:py-6 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {isMember && <BottomNav />}
    </div>
  );
};

const AppRoutes: React.FC = () => (
  <Routes>
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
    <Route path="/login" element={<Navigate to="/auth" replace />} />
    <Route path="/register" element={<Navigate to="/auth" replace />} />

    {/* Aktivasi pertama Member dibuat terpisah dari dashboard.
        Member yang lokasi kandangnya belum lengkap akan selalu diarahkan ke sini. */}
    <Route element={<RequireSession role="member" />}>
      <Route
        path="/activate"
        element={
          <PublicWrapper>
            <MemberActivationPage />
          </PublicWrapper>
        }
      />
    </Route>

    <Route element={<RequireSession />}>
      <Route element={<AppLayout />}>
        <Route element={<RequireSession role="mitra" />}>
          <Route path="/mitra" element={<MitraDashboardPage />} />
          <Route path="/mitra/members" element={<MitraMembersPage />} />
          <Route path="/mitra/reports" element={<MitraReportsPage />} />
          <Route path="/mitra/monitoring" element={<MitraMonitoringPage />} />
          <Route path="/mitra/follow-up" element={<MitraFollowUpPage />} />
          <Route path="/mitra/academy" element={<AcademyPage />} />
          <Route path="/mitra/profile" element={<MitraProfilePage />} />

          {/* Route lama diarahkan ke struktur Mitra final */}
          <Route path="/mitra/attention" element={<Navigate to="/mitra/monitoring" replace />} />
          <Route path="/mitra/support" element={<Navigate to="/mitra/follow-up" replace />} />
        </Route>

        <Route element={<RequireSession role="member" />}>
          <Route element={<RequireMemberActivated />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/beranda" element={<Navigate to="/home" replace />} />
            <Route path="/reports" element={<DailyReportPage />} />
            <Route path="/sales" element={<EggSalesPage />} />
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
          </Route>
        </Route>

        <Route element={<RequireSession role="admin" />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/apidocs" element={<ApiDocsPage />} />
        </Route>
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <BrowserRouter>
      <FarmProvider>
        <AppRoutes />
      </FarmProvider>
    </BrowserRouter>
  );
}
