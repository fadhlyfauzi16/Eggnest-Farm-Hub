import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFarm } from '../../context/FarmContext';
import { EggnestLogo } from '../common/EggnestLogo';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  ZoomIn,
  Menu,
  X,
  ShieldCheck,
  Plus,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen,
}) => {
  const {
    farm,
    currentUser,
    logout,
    notifications,
    markNotificationRead,
    setActivePage,
    setIsQuickReportOpen,
    textScale,
    setTextScale,
  } = useFarm();

  const navigate = useNavigate();
  const location = useLocation();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const cycleTextScale = () => {
    if (textScale === 'normal') setTextScale('large');
    else if (textScale === 'large') setTextScale('xlarge');
    else setTextScale('normal');
  };

  const getScaleLabel = () => {
    if (textScale === 'normal') return 'Teks Normal (A)';
    if (textScale === 'large') return 'Teks Besar (A+)';
    return 'Teks Ekstra (A++)';
  };

  const handleLogoClick = () => {
    setActivePage('beranda');
    navigate('/home');
  };

  const handleAdminToggle = () => {
    if (location.pathname === '/admin') {
      setActivePage('beranda');
      navigate('/home');
    } else {
      setActivePage('admin');
      navigate('/admin');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#EFECE6] px-4 md:px-8 py-3 flex items-center justify-between">
      {/* Left: Mobile Menu toggle & Farm Badge */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          id="mobile-header-menu-btn"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl text-[#1B3022] hover:bg-[#EFECE6] active:bg-[#E5E1D8] cursor-pointer touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <div
          className="cursor-pointer flex items-center gap-2 touch-manipulation"
          onClick={handleLogoClick}
          title="Ke Halaman Beranda"
        >
          <EggnestLogo size="sm" variant="dark" />
          <div className="hidden sm:flex flex-col">
            <span className="font-extrabold text-sm text-[#1B3022] font-['Outfit'] leading-none">
              EGGNEST
            </span>
            <span className="text-[9px] font-black text-[#2D4A36] uppercase tracking-wider">
              FARM HUB
            </span>
          </div>
        </div>

        {/* Desktop Farm ID tag */}
        <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-[#EFECE6]">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EAF2EC] text-[#1B3022] border border-[#CDE3D3]">
            {farm.location}
          </span>
          <span className="text-xs text-stone-500 font-medium">
            Farm ID: <strong className="text-[#1B3022] font-mono">{farm.farmCode}</strong>
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Quick Report Button for Mobile/Tablet */}
        {currentUser?.role === 'member' && (
          <button
            type="button"
            id="mobile-header-quick-report-btn"
            onClick={() => setIsQuickReportOpen(true)}
            className="md:hidden bg-[#2D4A36] hover:bg-[#1B3022] text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer touch-manipulation min-h-[36px]"
          >
            <Plus className="w-4 h-4" />
            Lapor
          </button>
        )}

        {/* Text Zoom Button */}
        <button
          type="button"
          id="header-text-scale-btn"
          onClick={cycleTextScale}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E1D8] hover:border-[#2D4A36] bg-[#F7F4EE] hover:bg-white text-xs font-bold text-[#1B3022] transition-colors cursor-pointer touch-manipulation min-h-[36px]"
          title="Ubah ukuran huruf agar lebih mudah dibaca"
        >
          <ZoomIn className="w-3.5 h-3.5 text-[#2D4A36]" />
          <span className="hidden sm:inline">{getScaleLabel()}</span>
          <span className="sm:hidden font-black">A+</span>
        </button>

        {/* Switch to Admin / Member */}
        {currentUser?.role === 'admin' ? (
          <button
            type="button"
            id="header-admin-switch-btn"
            onClick={handleAdminToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1B3022] text-[#D4AF37] border border-[#1B3022] transition-all cursor-pointer shadow-2xs touch-manipulation"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{location.pathname === '/admin' ? 'Dashboard Member' : 'Admin Panel'}</span>
          </button>
        ) : null}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            id="header-notifications-btn"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl text-[#1B3022] hover:bg-[#EFECE6] active:bg-[#E5E1D8] transition-colors cursor-pointer border border-[#E5E1D8] touch-manipulation min-w-[38px] min-h-[38px] flex items-center justify-center"
            aria-label="Notifikasi"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#BC4749] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notif Popover */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#EFECE6] p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFECE6]">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-[#1B3022] text-sm">Notifikasi & Peringatan</h4>
                  {unreadCount > 0 && (
                    <span className="bg-[#FDF2F2] text-[#BC4749] text-xs font-bold px-2 py-0.5 rounded-full border border-[#FECACA]">
                      {unreadCount} baru
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsNotifOpen(false)}
                  className="text-xs text-stone-400 hover:text-stone-700"
                >
                  Tutup
                </button>
              </div>

              <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center text-xs text-stone-500 py-4">
                    Tidak ada notifikasi baru saat ini.
                  </p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        notif.read
                          ? 'bg-[#FAF7F2] border-[#EFECE6] opacity-75'
                          : notif.type === 'warning'
                          ? 'bg-[#FEF6E9] border-[#FDE68A]'
                          : notif.type === 'success'
                          ? 'bg-[#EAF2EC] border-[#CDE3D3]'
                          : 'bg-[#F0F7F9] border-[#CFE4EC]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {notif.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-[#C2841E] shrink-0 mt-0.5" />
                        ) : notif.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-[#3A5A40] shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-[#2B6E7F] shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-xs font-bold text-[#1B3022] leading-tight">
                            {notif.title}
                          </p>
                          <p className="text-xs text-stone-600 mt-0.5 leading-snug">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-stone-400 mt-1 block">
                            {notif.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account / Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#EFECE6]">
          <div
            className="hidden sm:flex flex-col text-right cursor-pointer"
            onClick={() => {
              setActivePage('profil');
              navigate('/profile');
            }}
          >
            <span className="text-xs font-bold text-[#1B3022] leading-none hover:underline">
              {currentUser?.fullName || 'Pengguna'}
            </span>
            <span className="text-[10px] text-stone-500 font-medium mt-0.5">
              {currentUser?.role === 'admin' ? 'Administrator' : 'Member'}
            </span>
          </div>

          <button
            id="header-logout-btn"
            onClick={handleLogout}
            className="p-2 rounded-xl text-stone-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
            title="Keluar / Ganti Akun"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
