import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFarm, ActivePage } from '../../context/FarmContext';
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
} from 'lucide-react';

interface SidebarProps {
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const {
    setActivePage,
    currentUser,
    farm,
    setIsQuickReportOpen,
    notifications,
    adminAlerts,
    logout,
  } = useFarm();

  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const handleNavigate = (path: string, pageKey: ActivePage) => {
    setActivePage(pageKey);
    navigate(path);
    if (onNavigate) onNavigate();
  };

  const handleQuickReport = () => {
    setIsQuickReportOpen(true);
    if (onNavigate) onNavigate();
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
    if (onNavigate) onNavigate();
  };

  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const unresolvedAlerts = adminAlerts.filter((a) => !a.resolved).length;

  const memberNavItems: {
    id: ActivePage;
    path: string;
    aliasPath?: string;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number | string;
  }[] = [
    { id: 'beranda', path: '/home', aliasPath: '/beranda', label: 'Beranda', icon: Home },
    { id: 'laporan', path: '/reports', aliasPath: '/laporan', label: 'Laporan Harian', icon: FileSpreadsheet },
    { id: 'perkembangan', path: '/development', aliasPath: '/perkembangan', label: 'Perkembangan', icon: TrendingUp },
    { id: 'academy', path: '/academy', label: 'Academy', icon: GraduationCap, badge: 'Baru' },
    { id: 'bantuan', path: '/support', aliasPath: '/bantuan', label: 'Bantuan & Konsultasi', icon: Headphones },
    { id: 'score', path: '/score', aliasPath: '/farm', label: 'Farm Score', icon: Award, badge: '92' },
    { id: 'profil', path: '/profile', aliasPath: '/profil', label: 'Profil Kandang', icon: Warehouse },
  ];

  const isAdmin = currentUser?.role === 'admin';

  const adminNavItems: {
    id: ActivePage;
    path: string;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'admin', path: '/admin', label: 'Control Center', icon: ShieldAlert, badge: unresolvedAlerts || undefined },
    { id: 'apidocs', path: '/apidocs', label: 'Dokumentasi API', icon: Code2 },
  ];

  return (
    <aside className="w-72 bg-[#1B3022] text-[#FDFBF7] flex flex-col justify-between shrink-0 shadow-xl border-r border-[#2D4A36] min-h-[calc(100vh-61px)]">
      <div>
        {isAdmin ? (
          <div className="mx-4 my-4 p-4 bg-[#24412E] rounded-2xl border border-[#2D4A36]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1B3022] flex items-center justify-center text-[#D4AF37] border border-[#3A5A40]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">Administrator</p>
                <p className="text-xs font-semibold text-[#EAF2EC] truncate max-w-[165px]">
                  {currentUser?.fullName || 'Eggnest Control Center'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {farm.id && farm.farmCode && (
              <div className="mx-4 my-4 p-3.5 bg-[#24412E] rounded-2xl border border-[#2D4A36] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1B3022] flex items-center justify-center text-[#D4AF37] font-bold border border-[#3A5A40]">
                    <Warehouse className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#EAF2EC] font-mono">{farm.farmCode}</span>
                      <span className="w-2 h-2 rounded-full bg-[#588157]"></span>
                    </div>
                    <p className="text-xs font-medium text-[#C5D6C6] truncate max-w-[130px]">
                      {farm.ownerName || currentUser?.fullName || 'Kandang Member'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigate('/profile', 'profil')}
                  className="p-1.5 text-[#A3B899] hover:text-[#FDFBF7] hover:bg-[#1B3022] rounded-xl transition-colors cursor-pointer"
                  title="Lihat Profil Kandang"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="px-4 mb-4">
              <button
                type="button"
                id="sidebar-quick-report-btn"
                onClick={handleQuickReport}
                className="w-full py-3.5 px-4 bg-[#D4AF37] hover:bg-[#E5B842] text-[#1B3022] font-black rounded-2xl shadow-md shadow-black/20 flex items-center justify-center gap-2 text-sm tracking-wide transition-all transform active:scale-98 cursor-pointer"
              >
                <PlusCircle className="w-5 h-5" />
                <span>+ LAPOR HASIL HARI INI</span>
              </button>
            </div>
          </>
        )}

        <nav className="px-3 space-y-1">
          <p className={`px-3 text-[11px] font-bold uppercase tracking-wider mb-2 ${isAdmin ? 'text-[#D4AF37]' : 'text-[#A3B899]'}`}>
            {isAdmin ? 'Menu Administrator' : 'Menu Member'}
          </p>

          {(isAdmin ? adminNavItems : memberNavItems).map((item) => {
            const Icon = item.icon;
            const isActive =
              currentPath === item.path ||
              ('aliasPath' in item && item.aliasPath && currentPath === item.aliasPath) ||
              (item.path === '/home' && currentPath === '/');

            return (
              <button
                key={item.id}
                type="button"
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleNavigate(item.path, item.id)}
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

                {'badge' in item && item.badge ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#24412E] text-[#D4AF37] border border-[#3A5A40]">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-[#2D4A36]">
        {!isAdmin && (
          <div className="p-3 bg-[#24412E] rounded-2xl border border-[#3A5A40] mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#588157]/40 text-[#D4AF37] flex items-center justify-center font-bold">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#EAF2EC]">Dokter Hewan Siaga</p>
                <p className="text-[10px] text-[#A3B899]">Bantuan & konsultasi</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleNavigate('/support', 'bantuan')}
              className="px-2.5 py-1 bg-[#D4AF37] hover:bg-[#E5B842] text-[#1B3022] font-black text-[10px] rounded-lg cursor-pointer"
            >
              Chat
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#2D4A36] text-[#D4AF37] flex items-center justify-center font-black text-sm border border-[#3A5A40] shrink-0">
              {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : isAdmin ? 'A' : 'M'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#EAF2EC] truncate">
                {currentUser?.fullName || (isAdmin ? 'Administrator' : 'Member Peternak')}
              </p>
              <p className="text-[10px] text-[#A3B899] font-medium truncate">
                {isAdmin ? 'Administrator' : 'Mitra Eggnest'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="sidebar-logout-btn"
            onClick={handleLogout}
            className="p-2 text-[#A3B899] hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
            title="Keluar dari Akun"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
