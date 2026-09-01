import React from 'react';
import { useFarm, ActivePage } from '../../context/FarmContext';
import { Home, FileSpreadsheet, GraduationCap, Headphones, Plus } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activePage, setActivePage, setIsQuickReportOpen, userRole, setUserRole } = useFarm();

  const navItems: { id: ActivePage; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'beranda', label: 'Home', icon: Home },
    { id: 'laporan', label: 'Laporan', icon: FileSpreadsheet },
    { id: 'academy', label: 'Academy', icon: GraduationCap },
    { id: 'bantuan', label: 'Bantuan', icon: Headphones },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-t border-[#EFECE6] shadow-xl px-2 py-2">
      <div className="flex items-center justify-around relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id && userRole === 'member';

          return (
            <button
              key={item.id}
              onClick={() => {
                setUserRole('member');
                if (item.id === 'laporan') {
                  setIsQuickReportOpen(true);
                } else {
                  setActivePage(item.id);
                }
              }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                item.id === 'laporan'
                  ? 'text-[#2D4A36] font-bold'
                  : isActive
                  ? 'text-[#1B3022] font-bold'
                  : 'text-stone-500 font-medium'
              }`}
            >
              {item.id === 'laporan' ? (
                <div className="w-11 h-11 -mt-5 rounded-full bg-[#D4AF37] text-[#1B3022] flex items-center justify-center shadow-md shadow-[#D4AF37]/30 border-4 border-[#FDFBF7] active:scale-95 transition-transform">
                  <Plus className="w-6 h-6 stroke-[3]" />
                </div>
              ) : (
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#2D4A36]' : 'text-stone-400'}`} />
              )}
              <span
                className={`text-[11px] mt-1 ${
                  item.id === 'laporan' ? 'font-bold text-[#1B3022]' : ''
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
