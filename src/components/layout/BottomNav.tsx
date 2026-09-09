import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFarm } from '../../context/FarmContext';
import { Home, FileSpreadsheet, Plus, TrendingUp, Warehouse } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { setActivePage } = useFarm();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const go = (path: string, page: 'beranda' | 'laporan' | 'perkembangan' | 'profil') => {
    setActivePage(page);
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const normalItems = [
    { path: '/home', page: 'beranda' as const, label: 'Home', icon: Home, active: ['/home', '/beranda'] },
    { path: '/reports', page: 'laporan' as const, label: 'Riwayat', icon: FileSpreadsheet, active: ['/reports', '/laporan'] },
    { path: '/development', page: 'perkembangan' as const, label: 'Perkembangan', icon: TrendingUp, active: ['/development', '/perkembangan'] },
    { path: '/profile', page: 'profil' as const, label: 'Kandang', icon: Warehouse, active: ['/profile', '/profil'] },
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-t border-[#EFECE6] shadow-xl px-1 sm:px-3 pt-1.5 pb-safe pb-2"
    >
      <div className="grid grid-cols-5 items-end max-w-md mx-auto">
        {normalItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = item.active.includes(currentPath);
          return (
            <button key={item.path} type="button" onClick={() => go(item.path, item.page)} className={`flex flex-col items-center justify-center min-h-[50px] py-1 px-1 rounded-2xl transition-all active:scale-95 ${active ? 'text-[#1B3022] font-black bg-[#EAF2EC]/70' : 'text-stone-500 font-medium'}`}>
              <Icon className={`w-5 h-5 ${active ? 'text-[#2D4A36]' : 'text-stone-400'}`} />
              <span className="text-[10px] mt-0.5 leading-tight">{item.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => go('/reports?new=today', 'laporan')}
          className="relative -top-3 mx-auto w-[58px] h-[58px] rounded-full bg-[#D4AF37] text-[#1B3022] border-4 border-[#FDFBF7] shadow-lg flex flex-col items-center justify-center active:scale-95"
          aria-label="Isi laporan hari ini"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
          <span className="text-[9px] font-black leading-none">LAPOR</span>
        </button>

        {normalItems.slice(2).map((item) => {
          const Icon = item.icon;
          const active = item.active.includes(currentPath);
          return (
            <button key={item.path} type="button" onClick={() => go(item.path, item.page)} className={`flex flex-col items-center justify-center min-h-[50px] py-1 px-1 rounded-2xl transition-all active:scale-95 ${active ? 'text-[#1B3022] font-black bg-[#EAF2EC]/70' : 'text-stone-500 font-medium'}`}>
              <Icon className={`w-5 h-5 ${active ? 'text-[#2D4A36]' : 'text-stone-400'}`} />
              <span className="text-[10px] mt-0.5 leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
