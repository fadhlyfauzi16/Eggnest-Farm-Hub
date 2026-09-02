import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFarm } from '../../context/FarmContext';
import { Home, FileSpreadsheet, GraduationCap, Headphones, Plus } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { setIsQuickReportOpen, setActivePage } = useFarm();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  const isHomeActive = currentPath === '/home' || currentPath === '/beranda' || currentPath === '/';
  const isReportsActive = currentPath === '/reports' || currentPath === '/laporan';
  const isAcademyActive = currentPath === '/academy';
  const isSupportActive = currentPath === '/support' || currentPath === '/bantuan';

  const handleNavClick = (routePath: string, pageKey: 'beranda' | 'laporan' | 'academy' | 'bantuan') => {
    setActivePage(pageKey);
    navigate(routePath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickReportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickReportOpen(true);
  };

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-t border-[#EFECE6] shadow-xl px-1 sm:px-3 pt-1.5 pb-safe pb-2"
    >
      <div className="flex items-center justify-around relative max-w-md mx-auto">
        {/* 1. Home / Beranda */}
        <button
          type="button"
          id="mobile-nav-home"
          onClick={() => handleNavClick('/home', 'beranda')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-2xl transition-all cursor-pointer touch-manipulation active:scale-95 ${
            isHomeActive
              ? 'text-[#1B3022] font-black bg-[#EAF2EC]/70'
              : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
          aria-label="Halaman Beranda"
        >
          <Home
            className={`w-5 h-5 transition-transform ${
              isHomeActive ? 'text-[#2D4A36] scale-110' : 'text-stone-400'
            }`}
          />
          <span className="text-[10px] sm:text-[11px] mt-0.5 leading-tight">Home</span>
        </button>

        {/* 2. Laporan Harian */}
        <button
          type="button"
          id="mobile-nav-laporan"
          onClick={() => handleNavClick('/reports', 'laporan')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-2xl transition-all cursor-pointer touch-manipulation active:scale-95 ${
            isReportsActive
              ? 'text-[#1B3022] font-black bg-[#EAF2EC]/70'
              : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
          aria-label="Halaman Laporan"
        >
          <FileSpreadsheet
            className={`w-5 h-5 transition-transform ${
              isReportsActive ? 'text-[#2D4A36] scale-110' : 'text-stone-400'
            }`}
          />
          <span className="text-[10px] sm:text-[11px] mt-0.5 leading-tight">Laporan</span>
        </button>

        {/* 3. Central + Lapor Cepat Action */}
        <button
          type="button"
          id="mobile-nav-quick-report"
          onClick={handleQuickReportClick}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-0 px-1 -mt-5 transition-all cursor-pointer touch-manipulation active:scale-90"
          aria-label="Buka Form Lapor Cepat 20 Detik"
        >
          <div className="w-12 h-12 rounded-full bg-[#D4AF37] hover:bg-[#E5B842] active:bg-[#C2841E] text-[#1B3022] flex items-center justify-center shadow-lg shadow-[#D4AF37]/40 border-4 border-[#FDFBF7] transition-transform">
            <Plus className="w-7 h-7 stroke-[3]" />
          </div>
          <span className="text-[10px] sm:text-[11px] mt-0.5 font-extrabold text-[#1B3022] leading-tight">
            + Lapor
          </span>
        </button>

        {/* 4. Academy */}
        <button
          type="button"
          id="mobile-nav-academy"
          onClick={() => handleNavClick('/academy', 'academy')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-2xl transition-all cursor-pointer touch-manipulation active:scale-95 ${
            isAcademyActive
              ? 'text-[#1B3022] font-black bg-[#EAF2EC]/70'
              : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
          aria-label="Halaman Academy"
        >
          <GraduationCap
            className={`w-5 h-5 transition-transform ${
              isAcademyActive ? 'text-[#2D4A36] scale-110' : 'text-stone-400'
            }`}
          />
          <span className="text-[10px] sm:text-[11px] mt-0.5 leading-tight">Academy</span>
        </button>

        {/* 5. Bantuan */}
        <button
          type="button"
          id="mobile-nav-bantuan"
          onClick={() => handleNavClick('/support', 'bantuan')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-2xl transition-all cursor-pointer touch-manipulation active:scale-95 ${
            isSupportActive
              ? 'text-[#1B3022] font-black bg-[#EAF2EC]/70'
              : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
          aria-label="Halaman Bantuan"
        >
          <Headphones
            className={`w-5 h-5 transition-transform ${
              isSupportActive ? 'text-[#2D4A36] scale-110' : 'text-stone-400'
            }`}
          />
          <span className="text-[10px] sm:text-[11px] mt-0.5 leading-tight">Bantuan</span>
        </button>
      </div>
    </nav>
  );
};
