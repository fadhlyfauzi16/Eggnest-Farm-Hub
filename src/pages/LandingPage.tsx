import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarm } from '../context/FarmContext';
import { EggnestLogo } from '../components/common/EggnestLogo';
import {
  Home,
  Egg,
  ShieldCheck,
  HeartPulse,
  BookOpen,
  Headphones,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  PlusCircle,
  FileText,
  HelpCircle,
  Award,
  Clock,
  Warehouse,
  ChevronRight,
  ShieldAlert,
  Feather,
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToAuth?: (mode?: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToAuth }) => {
  const { setActivePage, currentUser } = useFarm();
  const navigate = useNavigate();

  const handleAuthNavigation = (mode: 'login' | 'register' = 'login') => {
    if (onNavigateToAuth) {
      onNavigateToAuth(mode);
    } else {
      navigate(`/auth?mode=${mode}`);
    }
  };

  const handleDashboardNavigation = () => {
    const targetRoute = currentUser?.role === 'admin' ? '/admin' : '/home';
    const targetPage = currentUser?.role === 'admin' ? 'admin' : 'beranda';
    setActivePage(targetPage);
    navigate(targetRoute);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1B3022] font-['Plus_Jakarta_Sans'] flex flex-col selection:bg-[#EAF2EC] selection:text-[#1B3022]">
      {/* Public Header Navigation */}
      <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#EFECE6] px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection('hero')}>
            <EggnestLogo size="md" />
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-[#1B3022] font-['Outfit'] leading-none">
                EGGNEST
              </span>
              <span className="text-[10px] font-black tracking-widest text-[#2D4A36] uppercase mt-0.5">
                FARM HUB
              </span>
            </div>
          </div>

          {/* Nav Menu */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-stone-700">
            <button
              onClick={() => scrollToSection('hero')}
              className="hover:text-[#1B3022] transition-colors cursor-pointer"
            >
              Beranda
            </button>
            <button
              onClick={() => scrollToSection('cara-kerja')}
              className="hover:text-[#1B3022] transition-colors cursor-pointer"
            >
              Cara Kerja
            </button>
            <button
              onClick={() => scrollToSection('fitur')}
              className="hover:text-[#1B3022] transition-colors cursor-pointer"
            >
              Fitur
            </button>
            <button
              onClick={() => scrollToSection('edukasi')}
              className="hover:text-[#1B3022] transition-colors cursor-pointer"
            >
              Edukasi
            </button>
            <button
              onClick={() => scrollToSection('bantuan')}
              className="hover:text-[#1B3022] transition-colors cursor-pointer"
            >
              Bantuan
            </button>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <button
                onClick={handleDashboardNavigation}
                className="px-5 py-2.5 bg-[#1B3022] hover:bg-[#2D4A36] text-[#FDFBF7] font-bold text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Buka Dashboard</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleAuthNavigation('login')}
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-bold text-[#1B3022] hover:text-[#2D4A36] transition-colors cursor-pointer"
                >
                  Masuk
                </button>
                <button
                  onClick={() => handleAuthNavigation('register')}
                  className="px-5 py-2.5 bg-[#1B3022] hover:bg-[#2D4A36] text-[#FDFBF7] font-bold text-sm rounded-2xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer transform active:scale-95"
                >
                  <span>MASUK / DAFTAR</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <section id="hero" className="relative pt-10 pb-16 md:pt-16 md:pb-24 px-4 sm:px-8 overflow-hidden">
        {/* Soft decorative background blurs */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-[#EAF2EC] rounded-full blur-3xl -z-10 opacity-70 pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#FEF6E9] rounded-full blur-3xl -z-10 opacity-80 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EAF2EC] border border-[#CDE3D3] text-[#1B3022] text-xs sm:text-sm font-bold shadow-xs">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>Sistem Pendamping Resmi Member Eggnest</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#1B3022] font-['Outfit'] tracking-tight leading-[1.15]">
              Pelihara Ayam di Rumah Jadi Lebih Mudah
            </h1>

            <p className="text-base sm:text-xl text-stone-600 font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Pantau perkembangan ayam, catat produksi telur, belajar cara perawatan dan dapatkan pendampingan langsung dari Eggnest.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => handleAuthNavigation('register')}
                className="w-full sm:w-auto px-8 py-4 bg-[#1B3022] hover:bg-[#2D4A36] text-[#FDFBF7] font-black text-base sm:text-lg rounded-2xl shadow-lg shadow-[#1B3022]/15 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>MULAI SEKARANG</span>
                <ArrowRight className="w-5 h-5 text-[#D4AF37]" />
              </button>

              <button
                onClick={() => scrollToSection('cara-kerja')}
                className="w-full sm:w-auto px-7 py-4 bg-[#FAF7F2] hover:bg-[#EFECE6] text-[#1B3022] font-bold text-base rounded-2xl border border-[#EFECE6] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>PELAJARI CARA KERJA</span>
              </button>
            </div>

            {/* Micro Highlights */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-[#EFECE6] max-w-lg mx-auto lg:mx-0">
              <div>
                <span className="block text-xl font-black text-[#1B3022] font-['Outfit']">1 Kandang</span>
                <span className="text-xs text-stone-500 font-medium">Halaman Rumah</span>
              </div>
              <div>
                <span className="block text-xl font-black text-[#2D4A36] font-['Outfit']">30 Detik</span>
                <span className="text-xs text-stone-500 font-medium">Lapor Tiap Hari</span>
              </div>
              <div>
                <span className="block text-xl font-black text-[#78350F] font-['Outfit']">100% Terpandu</span>
                <span className="text-xs text-stone-500 font-medium">Konsultasi Dokter</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual of Modern Clean Backyard Coop + House */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#EFECE6] bg-white group">
              <img
                src="https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1200&q=80"
                alt="Kandang Ayam Petelur Halaman Rumah Modern"
                className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1B3022]/80 via-transparent to-transparent flex flex-col justify-end p-6 text-[#FDFBF7]">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B3022]/90 backdrop-blur-xs text-[#FDFBF7] text-xs font-bold w-fit mb-2 border border-white/20">
                  <Home className="w-3.5 h-3.5 text-[#D4AF37]" /> Smart Home Farming
                </div>
                <h3 className="text-xl font-bold font-['Outfit']">Kandang Praktis di Halaman Rumah</h3>
                <p className="text-xs text-[#EAF2EC] font-medium mt-0.5">
                  Desain higienis, bebas bau, ramah lingkungan untuk keluarga.
                </p>
              </div>
            </div>

            {/* Floating Live Badge */}
            <div className="absolute -bottom-6 -left-4 sm:-left-6 bg-white p-4 rounded-2xl shadow-xl border border-[#EFECE6] flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#FEF6E9] border border-[#FDE68A] flex items-center justify-center">
                <Egg className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Telur Segar Setiap Pagi</span>
                <span className="text-base font-black text-[#1B3022] font-['Outfit']">8–11 Butir / Hari</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION CARA KERJA */}
      <section id="cara-kerja" className="py-16 md:py-24 bg-white border-y border-[#EFECE6] px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3.5 py-1 bg-[#EAF2EC] text-[#1B3022] text-xs font-black rounded-full border border-[#CDE3D3] uppercase tracking-wider">
              Langkah Sederhana
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1B3022] font-['Outfit'] tracking-tight">
              Cukup 1 Kandang di Rumah
            </h2>
            <p className="text-stone-600 text-sm sm:text-base font-medium">
              Tidak perlu pengalaman beternak sebelumnya. Ikuti 5 alur praktis ini bersama Eggnest Farm Hub:
            </p>
          </div>

          {/* 5 Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 lg:gap-6 relative">
            {[
              {
                step: '1',
                title: 'Terima Paket Ayam',
                desc: 'Paket kandang, ayam siap bertelur, pakan permulaan dan perlengkapan tiba di rumah Anda.',
                icon: Warehouse,
                badge: 'Tiba di Rumah',
              },
              {
                step: '2',
                title: 'Aktifkan Farm ID',
                desc: 'Daftar di Farm Hub dengan kode unik kandang Anda (contoh: EN-000001).',
                icon: Sparkles,
                badge: 'Aktivasi Digital',
              },
              {
                step: '3',
                title: 'Rawat dengan Panduan',
                desc: 'Beri pakan & air minum sesuai porsi yang direkomendasikan aplikasi.',
                icon: BookOpen,
                badge: 'Panduan Praktis',
              },
              {
                step: '4',
                title: 'Lapor Hasil Harian',
                desc: 'Input jumlah telur dan kondisi ayam hanya dalam 30 detik.',
                icon: Clock,
                badge: '30 Detik',
              },
              {
                step: '5',
                title: 'Pantau Perkembangan',
                desc: 'Lihat produktivitas, nilai telur, dan nikmati telur sehat segar bebas antibiotik.',
                icon: TrendingUp,
                badge: 'Hasil Nyata',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#EFECE6] hover:border-[#D9D4C7] shadow-xs flex flex-col justify-between space-y-4 relative group hover:-translate-y-1 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-full bg-[#1B3022] text-[#FDFBF7] font-black text-sm flex items-center justify-center font-['Outfit']">
                      {item.step}
                    </span>
                    <span className="text-[10px] font-bold text-[#78350F] bg-[#FEF6E9] border border-[#FDE68A] px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#EFECE6] flex items-center justify-center shadow-xs">
                      <Icon className="w-6 h-6 text-[#2D4A36]" />
                    </div>
                    <h3 className="font-bold text-base text-[#1B3022] font-['Outfit']">{item.title}</h3>
                    <p className="text-xs text-stone-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. SECTION KEUNGGULAN */}
      <section id="fitur" className="py-16 md:py-24 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3.5 py-1 bg-[#EAF2EC] text-[#1B3022] text-xs font-black rounded-full border border-[#CDE3D3] uppercase tracking-wider">
              Fitur Lengkap
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1B3022] font-['Outfit'] tracking-tight">
              Eggnest Selalu Mendampingi
            </h2>
            <p className="text-stone-600 text-sm sm:text-base font-medium">
              Semua yang Anda butuhkan untuk memelihara ayam di rumah dengan tenang, terstruktur, dan terverifikasi.
            </p>
          </div>

          {/* 6 Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Pantau Kandang',
                desc: 'Lihat jumlah ayam, umur ayam, produksi telur dan kondisi kandang secara real-time.',
                icon: Warehouse,
                color: 'bg-[#EAF2EC] text-[#1B3022] border-[#CDE3D3]',
              },
              {
                title: 'Laporan 30 Detik',
                desc: 'Cukup input jumlah telur, pakan dan kondisi ayam setiap hari dengan tombol besar yang mudah ditekan.',
                icon: Clock,
                color: 'bg-[#FEF6E9] text-[#78350F] border-[#FDE68A]',
              },
              {
                title: 'Belajar Mudah',
                desc: 'Dapatkan materi edukasi yang otomatis disesuaikan dengan umur dan kondisi kesehatan ayam Anda.',
                icon: BookOpen,
                color: 'bg-[#EAF2EC] text-[#2D4A36] border-[#CDE3D3]',
              },
              {
                title: 'Bantuan Langsung',
                desc: 'Laporkan masalah kandang dan dapatkan respon serta solusi langsung dari tim dokter hewan Eggnest.',
                icon: Headphones,
                color: 'bg-[#F0F7F9] text-[#2B6E7F] border-[#CFE4EC]',
              },
              {
                title: 'Riwayat Perkembangan',
                desc: 'Pantau grafik produksi telur dari hari ke hari, analisa produktivitas dan estimasi nilai telur.',
                icon: TrendingUp,
                color: 'bg-[#FAF7F2] text-[#1B3022] border-[#EFECE6]',
              },
              {
                title: 'Identitas Kandang',
                desc: 'Setiap kandang mempunyai Farm ID unik untuk klaim garansi, servis, dan riwayat kesehatan.',
                icon: Award,
                color: 'bg-[#F7F4EE] text-[#78350F] border-[#E5E1D8]',
              },
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white p-7 rounded-3xl border border-[#EFECE6] shadow-xs hover:border-[#D9D4C7] transition-all space-y-4 hover:-translate-y-1"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${feat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit']">{feat.title}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. SECTION SIMULASI DASHBOARD */}
      <section className="py-16 md:py-24 bg-[#1B3022] text-[#FDFBF7] px-4 sm:px-8 relative overflow-hidden">
        {/* Glow lights */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto space-y-10 relative z-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3.5 py-1 bg-white/10 text-[#D4AF37] text-xs font-black rounded-full border border-white/10 uppercase tracking-wider">
              Preview Antarmuka
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#FDFBF7] font-['Outfit'] tracking-tight">
              Tampilan Sederhana & Ramah Pengguna
            </h2>
            <p className="text-[#A3B899] text-sm sm:text-base font-medium">
              Didesain khusus agar nyaman dibaca oleh siapa saja, termasuk usia 40 tahun ke atas.
            </p>
          </div>

          {/* Realistic Dashboard Mockup Card */}
          <div className="bg-[#24412E] p-6 sm:p-8 rounded-3xl border border-[#3A5A40] shadow-2xl max-w-4xl mx-auto space-y-6">
            {/* Header Mockup */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3A5A40] pb-6">
              <div>
                <span className="text-xs text-[#A3B899] font-semibold">Dashboard Kandang Saya</span>
                <h3 className="text-2xl font-black text-[#FDFBF7] font-['Outfit'] mt-0.5">
                  Selamat datang, Peternak Mitra 👋
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[#1B3022] text-[#D4AF37] text-xs font-mono font-bold rounded-xl border border-[#3A5A40]">
                  Farm ID: EN-000001
                </span>
                <span className="px-2.5 py-1 bg-[#588157] text-[#FDFBF7] text-xs font-bold rounded-xl">
                  🟢 Baik
                </span>
              </div>
            </div>

            {/* 4 Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-[#1B3022] p-4 rounded-2xl border border-[#3A5A40]">
                <span className="text-xs text-[#A3B899] font-medium block">Ayam Aktif</span>
                <span className="text-3xl font-black text-[#FDFBF7] font-['Outfit'] block mt-1">12</span>
                <span className="text-[11px] text-[#C5D6C6]">Semua Sehat</span>
              </div>

              <div className="bg-[#1B3022] p-4 rounded-2xl border border-[#3A5A40]">
                <span className="text-xs text-[#A3B899] font-medium block">Telur Hari Ini</span>
                <span className="text-3xl font-black text-[#D4AF37] font-['Outfit'] block mt-1">10</span>
                <span className="text-[11px] text-[#C5D6C6]">Butir Segar</span>
              </div>

              <div className="bg-[#1B3022] p-4 rounded-2xl border border-[#3A5A40]">
                <span className="text-xs text-[#A3B899] font-medium block">Produktivitas</span>
                <span className="text-3xl font-black text-[#588157] font-['Outfit'] block mt-1">83%</span>
                <span className="text-[11px] text-[#C5D6C6]">Kategori: Baik</span>
              </div>

              <div className="bg-[#1B3022] p-4 rounded-2xl border border-[#3A5A40]">
                <span className="text-xs text-[#A3B899] font-medium block">Pakan Hari Ini</span>
                <span className="text-3xl font-black text-[#FDFBF7] font-['Outfit'] block mt-1">1,2 kg</span>
                <span className="text-[11px] text-[#C5D6C6]">Porsi Seimbang</span>
              </div>
            </div>

            {/* Simulated Action CTA */}
            <div className="bg-[#1B3022] p-4 rounded-2xl border border-[#3A5A40] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#D4AF37]/20 text-[#D4AF37] rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-xs text-[#EAF2EC] font-medium">
                  Laporan harian hari ini telah selesai dicatat dalam 20 detik.
                </span>
              </div>
              <button
                onClick={() => onNavigateToAuth('login')}
                className="px-4 py-2 bg-[#D4AF37] text-[#1B3022] font-black text-xs rounded-xl self-start sm:self-auto cursor-pointer"
              >
                Coba Demo Dashboard →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION EDUKASI */}
      <section id="edukasi" className="py-16 md:py-24 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3.5 py-1 bg-[#EAF2EC] text-[#1B3022] text-xs font-black rounded-full border border-[#CDE3D3] uppercase tracking-wider">
              Eggnest Academy
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1B3022] font-['Outfit'] tracking-tight">
              Tidak Perlu Jadi Peternak Profesional
            </h2>
            <p className="text-stone-600 text-sm sm:text-base font-medium">
              Eggnest memberikan panduan sederhana mulai dari pakan, minum, kebersihan kandang, kesehatan ayam hingga menjaga produksi telur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Menjaga Produksi Telur',
                cat: 'Produksi Telur',
                desc: 'Tips penting menjaga konsistensi bertelur pada usia puncak produksi 20–25 minggu.',
                type: 'Video 2 Menit',
                img: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
              },
              {
                title: 'Berapa kebutuhan pakan 12 ekor ayam?',
                cat: 'Pakan Harian',
                desc: 'Panduan takaran harian yang tepat untuk 12 ekor ayam layer tanpa sisa pakan basi.',
                type: 'Artikel 2 Menit',
                img: 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?auto=format&fit=crop&w=600&q=80',
              },
              {
                title: 'Cara menjaga air minum tetap bersih',
                cat: 'Sanitasi Kandang',
                desc: 'Sanitasi tempat minum nipple / talang agar terhindar dari bakteri dan penyakit.',
                type: 'Artikel 3 Menit',
                img: 'https://images.unsplash.com/photo-1516972810927-80185027ca84?auto=format&fit=crop&w=600&q=80',
              },
            ].map((art, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-[#EFECE6] overflow-hidden shadow-xs hover:border-[#D9D4C7] transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={art.img}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-[#1B3022]/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {art.cat}
                    </span>
                    <span className="absolute bottom-3 right-3 bg-white/95 text-[#1B3022] text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                      {art.type}
                    </span>
                  </div>
                  <div className="p-6 space-y-2">
                    <h3 className="font-bold text-lg text-[#1B3022] font-['Outfit'] group-hover:text-[#2D4A36] transition-colors">
                      {art.title}
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed">{art.desc}</p>
                  </div>
                </div>
                <div className="px-6 pb-6 pt-2">
                  <button
                    onClick={() => handleAuthNavigation('login')}
                    className="text-xs font-bold text-[#2D4A36] hover:text-[#1B3022] flex items-center gap-1 cursor-pointer"
                  >
                    Buka di Eggnest Academy <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. SECTION CTA */}
      <section id="bantuan" className="py-16 md:py-20 bg-[#FAF7F2] border-t border-[#EFECE6] px-4 sm:px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#1B3022] to-[#2D4A36] text-[#FDFBF7] p-8 sm:p-12 rounded-3xl shadow-xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="space-y-2 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-['Outfit'] text-[#FDFBF7] tracking-tight">
              Sudah Memiliki Paket Eggnest?
            </h2>
            <p className="text-sm sm:text-base text-[#A3B899] max-w-xl mx-auto">
              Segera hubungkan Farm ID Anda untuk mulai mencatat produksi harian, mengakses modul edukasi, dan mengklaim garansi resmi.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <button
              onClick={() => handleAuthNavigation('register')}
              className="w-full sm:w-auto px-8 py-4 bg-[#D4AF37] hover:bg-[#E5B842] text-[#1B3022] font-black text-base rounded-2xl shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>AKTIFKAN FARM ANDA</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleAuthNavigation('login')}
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-[#FDFBF7] font-bold text-base rounded-2xl border border-white/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>MASUK KE FARM HUB</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-white border-t border-[#EFECE6] py-12 px-4 sm:px-8 text-stone-600 text-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <EggnestLogo size="md" />
              <div>
                <span className="font-extrabold text-lg text-[#1B3022] font-['Outfit'] leading-none block">
                  EGGNEST
                </span>
                <span className="text-[10px] font-black tracking-widest text-[#2D4A36] uppercase">
                  FARM HUB
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-500 max-w-sm leading-relaxed">
              Platform pendamping peternakan ayam petelur rumahan modern. Membantu keluarga Indonesia mandiri pangan berkualitas dengan mudah dan terarah.
            </p>
            <p className="text-xs font-semibold text-[#1B3022]">
              Konsep: 1 Member = 1 Kandang = 1 Farm ID
            </p>
          </div>

          {/* Menu */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-[#1B3022] font-['Outfit']">Menu Utama</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => scrollToSection('hero')} className="hover:text-[#1B3022] cursor-pointer">
                  Tentang Eggnest
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('cara-kerja')} className="hover:text-[#1B3022] cursor-pointer">
                  Cara Kerja
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('edukasi')} className="hover:text-[#1B3022] cursor-pointer">
                  Eggnest Academy
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('bantuan')} className="hover:text-[#1B3022] cursor-pointer">
                  Layanan Bantuan & Garansi
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-[#1B3022] font-['Outfit']">Kebijakan & Keamanan</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <span className="hover:text-[#1B3022] cursor-pointer">Kebijakan Privasi</span>
              </li>
              <li>
                <span className="hover:text-[#1B3022] cursor-pointer">Syarat & Ketentuan</span>
              </li>
              <li>
                <span className="hover:text-[#1B3022] cursor-pointer">Standar Garansi 30 Hari</span>
              </li>
              <li>
                <span className="hover:text-[#1B3022] cursor-pointer">Hotline WA: 0812-8899-7700</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-[#EFECE6] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <p>© 2026 Eggnest Indonesia. Seluruh hak cipta dilindungi undang-undang.</p>
          <p className="text-[11px] font-mono text-stone-400">
            Eggnest Farm Hub v2.4 (Production Ready)
          </p>
        </div>
      </footer>
    </div>
  );
};
