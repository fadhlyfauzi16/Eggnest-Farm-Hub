import React from 'react';
import { useFarm, ActivePage } from '../../context/FarmContext';
import { EggnestLogo } from '../common/EggnestLogo';
import {
  Home,
  FileSpreadsheet,
  TrendingUp,
  GraduationCap,
  Headphones,
  Award,
  Warehouse,
  ShieldCheck,
  Code2,
  PlusCircle,
  ChevronRight,
  ShieldAlert,
  LogOut,
  Sparkles,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activePage,
    setActivePage,
    currentUser,
    farm,
    setIsQuickReportOpen,
    notifications,
    adminAlerts,
    logout,
  } = useFarm();

  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const unresolvedAlerts = adminAlerts.filter((a) => !a.resolved).length;

  const memberNavItems: {
    id: ActivePage;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number | string;
  }[] = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'laporan', label: 'Laporan Harian', icon: FileSpreadsheet },
    { id: 'perkembangan', label: 'Perkembangan', icon: TrendingUp },
    { id: 'academy', label: 'Academy', icon: GraduationCap, badge: 'Baru' },
    { id: 'bantuan', label: 'Bantuan & Konsultasi', icon: Headphones },
    { id: 'score', label: 'Farm Score', icon: Award, badge: '92' },
    { id: 'profil', label: 'Profil Kandang', icon: Warehouse },
  ];

  return (
    <aside className="w-72 bg-[#1B3022] text-[#FDFBF7] flex flex-col justify-between shrink-0 shadow-xl border-r border-[#2D4A36] min-h-[calc(100vh-61px)]">
      {/* Top Section */}
      <div>
        {/* Farm ID Badge */}
        <div className="mx-4 my-4 p-3.5 bg-[#24412E] rounded-2xl border border-[#2D4A36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1B3022] flex items-center justify-center text-[#D4AF37] font-bold border border-[#3A5A40]">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#EAF2EC] font-mono">
                  {farm.farmCode}
                </span>
                <span className="w-2 h-2 rounded-full bg-[#588157] animate-pulse"></span>
              </div>
              <p className="text-xs font-medium text-[#C5D6C6] truncate max-w-[130px]">
                {farm.ownerName || currentUser?.fullName || 'Kandang Member'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePage('profil')}
            className="p-1.5 text-[#A3B899] hover:text-[#FDFBF7] hover:bg-[#1B3022] rounded-xl transition-colors cursor-pointer"
            title="Lihat Profil Kandang"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Report Callout Button */}
        <div className="px-4 mb-4">
          <button
            onClick={() => setIsQuickReportOpen(true)}
            className="w-full py-3.5 px-4 bg-[#D4AF37] hover:bg-[#E5B842] text-[#1B3022] font-black rounded-2xl shadow-md shadow-black/20 flex items-center justify-center gap-2 text-sm tracking-wide transition-all transform active:scale-98 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            <span>+ LAPOR HASIL HARI INI</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 space-y-1">
          <p className="px-3 text-[11px] font-bold text-[#A3B899] uppercase tracking-wider mb-2">
            Menu Member
          </p>
          {memberNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-semibold text-sm transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#2D4A36] text-[#FDFBF7] shadow-sm font-bold border border-[#3A5A40]'
                    : 'text-[#C5D6C6] hover:text-[#FDFBF7] hover:bg-[#24412E]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#D4AF37]' : 'text-[#A3B899]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-[#D4AF37] text-[#1B3022]'
                        : 'bg-[#24412E] text-[#D4AF37] border border-[#3A5A40]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Admin & System Links */}
      <div className="p-4 border-t border-[#2D4A36] space-y-2">
        <p className="px-2 text-[10px] font-bold text-[#A3B899] uppercase tracking-wider">
          Sistem & Manajemen
        </p>

        {/* Admin Control Center Link */}
        <button
          onClick={() => setActivePage('admin')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activePage === 'admin'
              ? 'bg-[#D4AF37] text-[#1B3022] font-bold'
              : 'text-[#C5D6C6] hover:bg-[#24412E] hover:text-[#FDFBF7]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
            <span>Admin Control Center</span>
          </div>
          {unresolvedAlerts > 0 && (
            <span className="bg-[#BC4749] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unresolvedAlerts}
            </span>
          )}
        </button>

        {/* API Docs Link */}
        <button
          onClick={() => setActivePage('apidocs')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activePage === 'apidocs'
              ? 'bg-[#2D4A36] text-[#FDFBF7] font-bold'
              : 'text-[#C5D6C6] hover:bg-[#24412E] hover:text-[#FDFBF7]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Code2 className="w-4 h-4 text-[#D4AF37]" />
            <span>Dokumentasi API</span>
          </div>
          <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded text-[#C5D6C6]">
            v2.4
          </span>
        </button>

        {/* Current User Info & Logout */}
        <div className="pt-2 flex items-center justify-between text-xs text-[#A3B899] border-t border-[#2D4A36]/60">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#1B3022] font-black flex items-center justify-center text-[10px]">
              {currentUser?.fullName?.charAt(0) || 'U'}
            </div>
            <span className="truncate max-w-[110px] text-[#FDFBF7] font-medium">
              {currentUser?.fullName || 'Pengguna'}
            </span>
          </div>
          <button
            onClick={logout}
            className="text-[11px] text-[#A3B899] hover:text-white hover:underline flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3 h-3" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
