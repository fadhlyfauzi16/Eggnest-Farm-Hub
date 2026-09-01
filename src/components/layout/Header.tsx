import React, { useState } from 'react';
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
  User,
  Plus,
  LogOut,
  ChevronDown,
  Warehouse,
  Sparkles,
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
    activePage,
    setActivePage,
    setIsQuickReportOpen,
    textScale,
    setTextScale,
  } = useFarm();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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

  return (
    <header className="sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#EFECE6] px-2.5 sm:px-5 md:px-8 py-2 sm:py-3 flex items-center justify-between gap-1.5 sm:gap-3 w-full max-w-full">
      {/* Left: Mobile Menu toggle, Eggnest Logo (icon only on mobile), and Dashboard Button */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 rounded-lg text-[#1B3022] hover:bg-[#EFECE6] active:bg-[#E5E1D8] cursor-pointer shrink-0"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        {/* Logo: text hidden on mobile, visible on sm and up */}
        <div
          className="cursor-pointer flex items-center gap-1.5 shrink-0"
          onClick={() => setActivePage(currentUser?.role === 'admin' ? 'admin' : 'beranda')}
          title="Ke Dashboard / Beranda"
        >
          <EggnestLogo size="sm" variant="dark" hideTextOnMobile={true} />
        </div>

        {/* Dedicated Dashboard Button - visible on mobile & desktop */}
        <button
          onClick={() => setActivePage(currentUser?.role === 'admin' ? 'admin' : 'beranda')}
          className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95 ${
            activePage === 'beranda' || activePage === 'admin'
              ? 'bg-[#1B3022] text-[#FDFBF7] border border-[#1B3022]'
              : 'bg-[#EAF2EC] text-[#1B3022] hover:bg-[#d9e8dc] border border-[#CDE3D3]'
          }`}
          title="Buka Dashboard"
        >
          <Warehouse className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Dashboard</span>
        </button>

        {/* Desktop Farm ID tag */}
        <div className="hidden lg:flex items-center gap-2 pl-2.5 border-l border-[#EFECE6]">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EAF2EC] text-[#1B3022] border border-[#CDE3D3]">
            {farm.location}
          </span>
          <span className="text-xs text-stone-500 font-medium">
            Farm ID: <strong className="text-[#1B3022] font-mono">{farm.farmCode}</strong>
          </span>
        </div>
      </div>

      {/* Right Controls - Compact & Sized Responsively for Mobile & Desktop */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-2.5 shrink-0">
        {/* Quick Report Button (Visible on mobile and desktop for member) */}
        {currentUser?.role === 'member' && (
          <button
            onClick={() => setIsQuickReportOpen(true)}
            className="bg-[#2D4A36] hover:bg-[#1B3022] text-[#FDFBF7] px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer shrink-0"
            title="Lapor Hasil Hari Ini"
          >
            <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden xs:inline">+ Lapor</span>
          </button>
        )}

        {/* Text Zoom Button - Compact icon on mobile, labeled on md */}
        <button
          onClick={cycleTextScale}
          className="flex items-center gap-1 p-1.5 sm:px-2 sm:py-1 md:px-2.5 md:py-1.5 rounded-lg sm:rounded-xl border border-[#E5E1D8] hover:border-[#2D4A36] bg-[#F7F4EE] hover:bg-white text-xs font-bold text-[#1B3022] transition-colors cursor-pointer shrink-0"
          title="Ubah ukuran huruf agar lebih mudah dibaca"
        >
          <ZoomIn className="w-3.5 h-3.5 text-[#2D4A36]" />
          <span className="hidden md:inline">{getScaleLabel()}</span>
          <span className="hidden sm:inline md:hidden text-[10px]">
            {textScale === 'normal' ? 'A' : textScale === 'large' ? 'A+' : 'A++'}
          </span>
        </button>

        {/* Switch to Admin / Member - if Admin */}
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setActivePage(activePage === 'admin' ? 'beranda' : 'admin')}
            className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-bold bg-[#1B3022] text-[#D4AF37] border border-[#1B3022] transition-all cursor-pointer shadow-2xs shrink-0"
            title="Toggle Admin / Member"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{activePage === 'admin' ? 'Member' : 'Admin'}</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsUserMenuOpen(false);
            }}
            className="relative p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-[#1B3022] hover:bg-[#EFECE6] bg-[#F7F4EE] sm:bg-transparent transition-colors cursor-pointer border border-[#E5E1D8]"
            aria-label="Notifikasi"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#BC4749] text-white text-[8px] sm:text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notif Popover (Responsive max width & positioning) */}
          {isNotifOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/20 md:bg-transparent"
                onClick={() => setIsNotifOpen(false)}
              />
              <div className="fixed sm:absolute right-3 sm:right-0 top-12 sm:top-full mt-1.5 w-[calc(100vw-24px)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-2xl border border-[#EFECE6] p-3.5 sm:p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-[#EFECE6]">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#1B3022] text-xs sm:text-sm">Notifikasi & Peringatan</h4>
                    {unreadCount > 0 && (
                      <span className="bg-[#FDF2F2] text-[#BC4749] text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border border-[#FECACA]">
                        {unreadCount} baru
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="text-xs text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>

                <div className="mt-2.5 space-y-2 max-h-72 sm:max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs text-stone-500 py-4">
                      Tidak ada notifikasi baru saat ini.
                    </p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationRead(notif.id)}
                        className={`p-2.5 sm:p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                          notif.read
                            ? 'bg-[#FAF7F2] border-[#EFECE6] opacity-75'
                            : notif.type === 'warning'
                            ? 'bg-[#FEF6E9] border-[#FDE68A]'
                            : notif.type === 'success'
                            ? 'bg-[#EAF2EC] border-[#CDE3D3]'
                            : 'bg-[#F0F7F9] border-[#CFE4EC]'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {notif.type === 'warning' ? (
                            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C2841E] shrink-0 mt-0.5" />
                          ) : notif.type === 'success' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#3A5A40] shrink-0 mt-0.5" />
                          ) : (
                            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2B6E7F] shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-xs font-bold text-[#1B3022] leading-tight">
                              {notif.title}
                            </p>
                            <p className="text-[11px] sm:text-xs text-stone-600 mt-0.5 leading-snug">
                              {notif.message}
                            </p>
                            <span className="text-[9px] sm:text-[10px] text-stone-400 mt-0.5 sm:mt-1 block">
                              {notif.date}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Account / Menu Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-[#1B3022] text-[#FDFBF7] border border-[#1B3022] text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
            title="Menu Akun"
          >
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md sm:rounded-lg bg-[#2D4A36] text-[#D4AF37] flex items-center justify-center text-[9px] sm:text-[10px] font-black">
              {currentUser?.fullName?.charAt(0) || 'U'}
            </div>
            <span className="max-w-[60px] sm:max-w-[80px] truncate hidden xxs:inline">
              {currentUser?.fullName?.split(' ')[0] || 'User'}
            </span>
            <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#A3B899]" />
          </button>

          {/* User Popover Menu */}
          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/20 md:bg-transparent"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="fixed sm:absolute right-3 sm:right-0 top-12 sm:top-full mt-1.5 w-[calc(100vw-24px)] sm:w-64 max-w-xs bg-white rounded-2xl shadow-2xl border border-[#EFECE6] p-3.5 z-50 animate-in fade-in zoom-in-95 space-y-2.5">
                {/* User & Farm Info Badge */}
                <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#EFECE6] flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <h5 className="font-bold text-xs text-[#1B3022] truncate">
                      {currentUser?.fullName || 'Pengguna'}
                    </h5>
                    <p className="text-[10px] text-stone-500 font-medium mt-0.5 flex items-center gap-1">
                      <span>Farm ID:</span>
                      <strong className="font-mono text-[#1B3022]">{farm.farmCode}</strong>
                    </p>
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#EAF2EC] text-[#1B3022] border border-[#CDE3D3] shrink-0">
                    {currentUser?.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                </div>

                {/* Quick Actions List */}
                <div className="space-y-1">
                  {/* Quick Report Button */}
                  {currentUser?.role === 'member' && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsQuickReportOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2D4A36] text-[#FDFBF7] font-bold text-xs cursor-pointer shadow-xs active:scale-98"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>+ Lapor Hasil Hari Ini</span>
                    </button>
                  )}

                  {/* Font Size Changer */}
                  <button
                    onClick={cycleTextScale}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#FAF7F2] text-stone-700 text-xs font-semibold cursor-pointer border border-transparent hover:border-[#EFECE6]"
                  >
                    <div className="flex items-center gap-2">
                      <ZoomIn className="w-3.5 h-3.5 text-[#2D4A36]" />
                      <span>Ukuran Tulisan</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#1B3022] border border-[#E5E1D8]">
                      {textScale === 'normal' ? 'Normal' : textScale === 'large' ? 'Besar' : 'Ekstra'}
                    </span>
                  </button>

                  {/* Switch to Admin Mode if admin */}
                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setActivePage(activePage === 'admin' ? 'beranda' : 'admin');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#FAF7F2] text-[#1B3022] text-xs font-bold cursor-pointer border border-transparent hover:border-[#EFECE6]"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>{activePage === 'admin' ? 'Ke Dashboard Member' : 'Buka Panel Admin'}</span>
                    </button>
                  )}
                </div>

                {/* Logout Button */}
                <div className="pt-2 border-t border-[#EFECE6]">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-rose-700 hover:bg-rose-50 font-bold text-xs cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar / Ganti Akun</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
