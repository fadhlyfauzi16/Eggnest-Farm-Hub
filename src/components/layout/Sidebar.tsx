import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFarm, ActivePage } from '../../context/FarmContext';
import {
  Activity,
  ShoppingBasket,
  Award,
  BookOpenCheck,
  ChevronRight,
  Code2,
  FileSpreadsheet,
  GraduationCap,
  Home,
  LogOut,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserRound,
  Users,
  Warehouse,
} from 'lucide-react';

interface SidebarProps {
  onNavigate?: () => void;
}

type NavItem = {
  id: ActivePage;
  path: string;
  aliasPath?: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: number | string;
  queryTab?: string;
};

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { setActivePage, currentUser, farm, farmScore, adminAlerts, logout } = useFarm();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const handleNavigate = (path: string, pageKey: ActivePage) => {
    setActivePage(pageKey);
    navigate(path);
    onNavigate?.();
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
    onNavigate?.();
  };

  const unresolvedAlerts = adminAlerts.filter((a) => !a.resolved).length;
  const isAdmin = currentUser?.role === 'admin';
  const isMitra = currentUser?.role === 'mitra';

  const memberNavItems: NavItem[] = [
    { id: 'beranda', path: '/home', aliasPath: '/beranda', label: 'Beranda', icon: Home },
    { id: 'laporan', path: '/reports', aliasPath: '/laporan', label: 'Laporan Kandang', icon: FileSpreadsheet },
    { id: 'laporan', path: '/sales', label: 'Penjualan Telur', icon: ShoppingBasket },
    { id: 'perkembangan', path: '/development', aliasPath: '/perkembangan', label: 'Perkembangan', icon: TrendingUp },
    { id: 'academy', path: '/academy', label: 'Academy', icon: GraduationCap, badge: 'Baru' },
    {
      id: 'score',
      path: '/score',
      aliasPath: '/farm',
      label: 'Farm Score',
      icon: Award,
      badge: farmScore.totalScore > 0 ? farmScore.totalScore : undefined,
    },
    { id: 'profil', path: '/profile', aliasPath: '/profil', label: 'Profil Kandang', icon: Warehouse },
  ];

  const mitraNavItems: NavItem[] = [
    { id: 'beranda', path: '/mitra', label: 'Beranda', icon: Home },
    { id: 'laporan', path: '/mitra/members', label: 'Member Saya', icon: Users },
    { id: 'laporan', path: '/mitra/reports', label: 'Laporan Member', icon: BookOpenCheck },
    { id: 'perkembangan', path: '/mitra/monitoring', label: 'Monitoring', icon: Activity },
    { id: 'bantuan', path: '/mitra/follow-up', label: 'Follow-up', icon: MessageCircle },
    { id: 'academy', path: '/mitra/academy', label: 'Academy', icon: GraduationCap },
    { id: 'profil', path: '/mitra/profile', label: 'Profil Mitra', icon: UserRound },
  ];

  const adminNavItems: NavItem[] = [
    {
      id: 'admin',
      path: '/admin',
      label: 'Control Center',
      icon: ShieldAlert,
      badge: unresolvedAlerts || undefined,
    },
    {
      id: 'admin',
      path: '/admin?tab=academy',
      label: 'Academy Management',
      icon: GraduationCap,
      queryTab: 'academy',
    },
    { id: 'apidocs', path: '/apidocs', label: 'Dokumentasi API', icon: Code2 },
  ];

  const navItems = isAdmin ? adminNavItems : isMitra ? mitraNavItems : memberNavItems;
  const menuTitle = isAdmin ? 'Menu Administrator' : isMitra ? 'Menu Mitra' : 'Menu Member';
  const roleLabel = isAdmin
    ? 'Administrator'
    : isMitra
      ? 'Marketing & Follow-up'
      : 'Member Eggnest';

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
                <p className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">
                  Administrator
                </p>
                <p className="text-xs font-semibold text-[#EAF2EC] truncate max-w-[165px]">
                  {currentUser?.fullName || 'Eggnest Control Center'}
                </p>
              </div>
            </div>
          </div>
        ) : isMitra ? (
          <div className="mx-4 my-4 p-3.5 bg-[#24412E] rounded-2xl border border-[#2D4A36]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1B3022] flex items-center justify-center text-[#D4AF37] border border-[#3A5A40]">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#D4AF37]">
                  Mitra Marketing
                </div>
                <div className="text-xs font-bold text-[#EAF2EC] truncate max-w-[160px]">
                  {currentUser?.fullName || 'Mitra Eggnest'}
                </div>
                {currentUser?.partnerCode && (
                  <div className="text-[10px] text-[#A3B899] font-mono mt-0.5">
                    {currentUser.partnerCode}
                  </div>
                )}
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
                      <span className="text-xs font-bold text-[#EAF2EC] font-mono">
                        {farm.farmCode}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[#588157]" />
                    </div>
                    <p className="text-xs font-medium text-[#C5D6C6] truncate max-w-[130px]">
                      {farm.ownerName || currentUser?.fullName || 'Kandang Member'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigate('/profile', 'profil')}
                  className="p-1.5 text-[#A3B899] hover:text-[#FDFBF7] hover:bg-[#1B3022] rounded-xl"
                  title="Lihat Profil Kandang"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        <nav className="px-3 space-y-1">
          <p
            className={`px-3 text-[11px] font-bold uppercase tracking-wider mb-2 ${
              isAdmin ? 'text-[#D4AF37]' : 'text-[#A3B899]'
            }`}
          >
            {menuTitle}
          </p>

          {navItems.map((item, index) => {
            const Icon = item.icon;
            const currentTab = new URLSearchParams(location.search).get('tab');
            const isActive = item.queryTab
              ? currentPath === '/admin' && currentTab === item.queryTab
              : currentPath === item.path ||
                (item.aliasPath && currentPath === item.aliasPath) ||
                (item.path === '/home' && currentPath === '/') ||
                (item.path === '/admin' && currentPath === '/admin' && !currentTab);

            return (
              <button
                key={`${item.path}-${index}`}
                type="button"
                onClick={() => handleNavigate(item.path, item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-semibold text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-[#2D4A36] text-[#FDFBF7] shadow-sm font-bold border border-[#3A5A40]'
                    : 'text-[#C5D6C6] hover:text-[#FDFBF7] hover:bg-[#24412E]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-[#D4AF37]' : 'text-[#A3B899]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
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
        {isMitra && (
          <div className="p-3 bg-[#24412E] rounded-2xl border border-[#3A5A40] mb-3">
            <p className="text-[11px] font-bold text-[#EAF2EC]">Peran Mitra</p>
            <p className="text-[10px] text-[#A3B899] mt-1 leading-relaxed">
              Marketing, monitoring, dan follow-up Member. Masalah teknis ditangani Admin Eggnest.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#2D4A36] text-[#D4AF37] flex items-center justify-center font-black text-sm border border-[#3A5A40] shrink-0">
              {currentUser?.fullName
                ? currentUser.fullName.charAt(0).toUpperCase()
                : isAdmin
                  ? 'A'
                  : isMitra
                    ? 'M'
                    : 'M'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#EAF2EC] truncate">
                {currentUser?.fullName || roleLabel}
              </p>
              <p className="text-[10px] text-[#A3B899] font-medium truncate">{roleLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 text-[#A3B899] hover:text-rose-300 hover:bg-rose-950/40 rounded-xl"
            title="Keluar dari Akun"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
