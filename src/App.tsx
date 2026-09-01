import React, { useState } from 'react';
import { FarmProvider, useFarm } from './context/FarmContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { Toast } from './components/common/Toast';
import { QuickReportModal } from './components/common/QuickReportModal';

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

const AppContent: React.FC = () => {
  const { activePage, setActivePage, textScale, currentUser } = useFarm();
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Text scaling class applied to root
  const textSizeClass =
    textScale === 'xlarge' ? 'text-lg' : textScale === 'large' ? 'text-base' : 'text-sm';

  // Standalone Public Pages (Landing & Auth)
  if (activePage === 'landing') {
    return (
      <div className={`min-h-screen ${textSizeClass}`}>
        <Toast />
        <LandingPage
          onNavigateToAuth={(mode = 'login') => {
            setAuthInitialMode(mode);
            setActivePage('auth');
          }}
        />
      </div>
    );
  }

  if (activePage === 'auth') {
    return (
      <div className={`min-h-screen ${textSizeClass}`}>
        <Toast />
        <AuthPage
          initialMode={authInitialMode}
          onBackToLanding={() => setActivePage('landing')}
        />
      </div>
    );
  }

  const renderActivePage = () => {
    switch (activePage) {
      case 'beranda':
        return <HomePage />;
      case 'laporan':
        return <DailyReportPage />;
      case 'perkembangan':
        return <DevelopmentPage />;
      case 'academy':
        return <AcademyPage />;
      case 'bantuan':
        return <SupportPage />;
      case 'score':
        return <FarmScorePage />;
      case 'profil':
        return <FarmProfilePage />;
      case 'admin':
        return <AdminPage />;
      case 'apidocs':
        return <ApiDocsPage />;
      default:
        return <HomePage />;
    }
  };

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
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative z-10 w-72 max-w-[85vw] bg-[#1B3022] h-full shadow-2xl overflow-y-auto">
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 w-full min-w-0 px-3 sm:px-5 lg:px-8 py-3.5 sm:py-5 md:py-6 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto w-full min-w-0">{renderActivePage()}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Visible on mobile screens) */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <FarmProvider>
      <AppContent />
    </FarmProvider>
  );
}
