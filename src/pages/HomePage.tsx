import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarm } from '../context/FarmContext';
import {
  Egg,
  Wheat,
  ShieldCheck,
  HeartPulse,
  Calendar,
  Warehouse,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  PlusCircle,
  Sparkles,
  ChevronRight,
  Info,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    farm,
    reports,
    todayEggCount,
    monthEggCount,
    todayFeedKg,
    monthFeedKg,
    productivityRate,
    productivityStatus,
    estimatedEggValue,
    averageEggsPerDay,
    setIsQuickReportOpen,
    setActivePage,
    notifications,
    textScale,
    currentUser,
  } = useFarm();

  // Prepare last 30 days chart data
  const chartData = reports.slice(-30).map((r) => {
    const dateObj = new Date(r.date);
    const dayStr = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      : r.date;
    return {
      day: dayStr,
      telur: r.eggCount,
      pakan: r.feedKg,
      produktivitas: r.productivityRate,
    };
  });

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const currentPeriodLabel = new Date().toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const hasReportedToday = reports.some((r) => r.date === todayStr);
  const latestReport = reports.length > 0 ? reports[reports.length - 1] : null;

  const scaleClass =
    textScale === 'xlarge' ? 'text-lg' : textScale === 'large' ? 'text-base' : 'text-sm';

  return (
    <div className="space-y-6 md:space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Top Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1B3022] font-['Outfit'] tracking-tight">
              Selamat datang, {farm.ownerName || currentUser?.fullName || 'Peternak Mitra'} 👋
            </h1>
          </div>
          <p className={`text-stone-600 font-medium mt-1 ${scaleClass}`}>
            Kelola kandang dan pantau perkembangan ayam Anda dengan mudah.
          </p>
        </div>

        {/* Quick Action Button */}
        <button
          onClick={() => setIsQuickReportOpen(true)}
          className="hidden md:flex items-center gap-2 px-6 py-3.5 bg-[#2D4A36] hover:bg-[#1B3022] text-[#FDFBF7] font-bold rounded-2xl shadow-md shadow-[#2D4A36]/20 transition-all transform active:scale-98 cursor-pointer"
        >
          <PlusCircle className="w-5 h-5 text-[#D4AF37]" />
          <span>Lapor Hasil Hari Ini</span>
        </button>
      </div>

      {/* Kartu Profil Kandang */}
      <div className="bg-[#1B3022] text-[#FDFBF7] rounded-3xl p-6 md:p-8 shadow-xl border border-[#2D4A36] relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute left-1/2 bottom-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Farm Photo & Basic Info */}
          <div className="lg:col-span-4 flex items-center gap-4">
            <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 border-[#3A5A40] shadow-md shrink-0">
              <img
                src={farm.photoUrl}
                alt="Foto Kandang Ayam"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-xs text-[10px] text-white font-bold px-1.5 py-0.5 rounded">
                Kandang #1
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-[#588157] text-[#FDFBF7] font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  AKTIF
                </span>
                <span className="text-xs text-[#A3B899] font-medium">Lohmann Brown</span>
              </div>
              <p className="text-xs text-[#A3B899] font-medium">Farm ID</p>
              <h2 className="text-2xl font-black text-[#FDFBF7] font-['Outfit'] tracking-wide">
                {farm.farmCode}
              </h2>
              <p className="text-xs text-[#EAF2EC] font-semibold flex items-center gap-1">
                📍 {farm.location}
              </p>
              <button
                onClick={() => {
                  setActivePage('score');
                  navigate('/score');
                }}
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-[#2D4A36] hover:bg-[#3A5A40] text-xs font-bold text-[#FDFBF7] rounded-xl border border-[#588157]/50 cursor-pointer transition-colors shadow-xs"
              >
                <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Lihat Farm Score</span>
              </button>
            </div>
          </div>

          {/* Quick Snapshot 4 Badges */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            {/* Card Jumlah Ayam */}
            <div className="bg-[#24412E] p-4 rounded-2xl border border-[#2D4A36]">
              <span className="text-xs text-[#A3B899] font-semibold block">Jumlah Ayam</span>
              <div className="text-3xl font-black text-[#FDFBF7] font-['Outfit'] mt-1">
                {farm.activeChickens}
              </div>
              <span className="text-[11px] text-[#C5D6C6] font-medium block mt-0.5">
                Ayam Aktif (Dari {farm.initialChickens})
              </span>
            </div>

            {/* Card Usia Ayam */}
            <div className="bg-[#24412E] p-4 rounded-2xl border border-[#2D4A36]">
              <span className="text-xs text-[#A3B899] font-semibold block">Usia Ayam</span>
              <div className="text-3xl font-black text-[#FDFBF7] font-['Outfit'] mt-1">
                {farm.currentAgeWeeks} <span className="text-sm font-semibold">Mgg</span>
              </div>
              <span className="text-[11px] text-[#C5D6C6] font-medium block mt-0.5">
                Masa Puncak Bertelur
              </span>
            </div>

            {/* Card Kesehatan */}
            <div className="bg-[#24412E] p-4 rounded-2xl border border-[#2D4A36]">
              <span className="text-xs text-[#A3B899] font-semibold block">Kesehatan</span>
              <div className="text-3xl font-black text-[#588157] font-['Outfit'] mt-1 flex items-center gap-1">
                Baik <HeartPulse className="w-5 h-5 text-[#588157]" />
              </div>
              <span className="text-[11px] text-[#C5D6C6] font-medium block mt-0.5">
                Semua sehat 100%
              </span>
            </div>

            {/* Card Garansi */}
            <div className="bg-[#24412E] p-4 rounded-2xl border border-[#2D4A36]">
              <span className="text-xs text-[#A3B899] font-semibold block">Status Garansi</span>
              <div className="text-lg font-black text-[#D4AF37] font-['Outfit'] mt-1 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" /> Garansi Aktif
              </div>
              <span className="text-[10px] text-[#C5D6C6] font-medium block mt-0.5">
                Hingga {farm.warrantyEnd}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Produksi Telur */}
        <div className="bg-white p-5 rounded-3xl border border-[#EFECE6] shadow-xs hover:border-[#D9D4C7] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Produksi Telur
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FEF6E9] text-[#78350F] flex items-center justify-center font-bold border border-[#FDE68A]">
              <Egg className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-stone-500 font-medium">Hari ini:</span>
              <div className="text-3xl font-black text-[#1B3022] font-['Outfit']">
                {todayEggCount} <span className="text-sm font-bold text-stone-600">butir</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-stone-500 font-medium">Bulan ini:</span>
              <div className="text-lg font-extrabold text-[#2D4A36] font-['Outfit']">
                {monthEggCount} butir
              </div>
            </div>
          </div>
        </div>

        {/* Produktivitas */}
        <div className="bg-white p-5 rounded-3xl border border-[#EFECE6] shadow-xs hover:border-[#D9D4C7] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Produktivitas
            </span>
            <span className="bg-[#EAF2EC] text-[#1B3022] text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-[#CDE3D3]">
              Status: {productivityStatus}
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#1B3022] font-['Outfit']">
                {productivityRate}%
              </span>
              <span className="text-xs text-stone-500 font-semibold">
                ({todayEggCount} / {farm.activeChickens} ayam)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#FAF7F2] h-3 rounded-full overflow-hidden mt-3 p-0.5 border border-[#EFECE6]">
              <div
                className="bg-gradient-to-r from-[#588157] to-[#2D4A36] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(productivityRate, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Estimasi Nilai Telur */}
        <div className="bg-white p-5 rounded-3xl border border-[#EFECE6] shadow-xs hover:border-[#D9D4C7] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Estimasi Nilai Telur
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#EAF2EC] text-[#1B3022] flex items-center justify-center font-bold border border-[#CDE3D3]">
              <TrendingUp className="w-5 h-5 text-[#2D4A36]" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-black text-[#1B3022] font-['Outfit'] truncate">
              {formatRupiah(estimatedEggValue)}
            </div>
            <span className="text-xs text-stone-500 font-medium block mt-1">
              Bulan ini ({monthEggCount} butir @ Rp1.500)
            </span>
          </div>
        </div>

        {/* Pakan Hari Ini */}
        <div className="bg-white p-5 rounded-3xl border border-[#EFECE6] shadow-xs hover:border-[#D9D4C7] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Pakan Hari Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F7F4EE] text-[#78350F] flex items-center justify-center font-bold border border-[#E5E1D8]">
              <Wheat className="w-5 h-5 text-[#588157]" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-black text-[#1B3022] font-['Outfit']">
                {todayFeedKg.toString().replace('.', ',')}{' '}
                <span className="text-sm font-bold text-stone-600">kg</span>
              </div>
              <span className="text-xs text-stone-500 font-medium block mt-1">
                Pakan seimbang 100g / ekor
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-stone-500 font-medium">Bulan ini:</span>
              <div className="text-sm font-bold text-stone-700 font-['Outfit']">
                {monthFeedKg.toString().replace('.', ',')} kg
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tombol Besar: + LAPOR HASIL HARI INI */}
      <div className="bg-[#1B3022] rounded-3xl p-6 md:p-8 text-[#FDFBF7] shadow-xl border border-[#2D4A36] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#A3B899] text-xs font-bold mb-1 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> Pencatatan 20 Detik
          </div>
          <h3 className="text-2xl md:text-3xl font-black font-['Outfit'] text-[#FDFBF7]">
            + LAPOR HASIL HARI INI
          </h3>
          <p className="text-[#A3B899] text-sm font-medium">
            Input produksi, pakan, dan kondisi ayam harian Anda dengan mudah.
          </p>
        </div>

        <button
          onClick={() => setIsQuickReportOpen(true)}
          className="w-full md:w-auto px-8 py-4 bg-[#D4AF37] hover:bg-[#E5B842] text-[#1B3022] font-black text-lg rounded-2xl shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
        >
          Mulai Lapor Sekarang →
        </button>
      </div>

      {/* Trend Produksi Chart & Ringkasan Bulan Ini */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-8 bg-white p-6 md:p-7 rounded-3xl border border-[#EFECE6] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit'] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#2D4A36]" />
                Trend Produksi
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Data 30 hari terakhir (Rata-rata 7–12 telur per hari)
              </p>
            </div>

            <button
              onClick={() => {
                setActivePage('perkembangan');
                navigate('/development');
              }}
              className="text-xs font-bold text-[#2D4A36] hover:text-[#1B3022] flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              Lihat Detail Analisa <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-64 md:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="eggGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2D4A36" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2D4A36" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE6" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  stroke="#A3B899"
                  fontSize={11}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 14]}
                  tickLine={false}
                  stroke="#A3B899"
                  fontSize={11}
                  ticks={[0, 4, 8, 10, 12, 14]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#1B3022] text-[#FDFBF7] p-3 rounded-xl text-xs shadow-xl border border-[#2D4A36]">
                          <p className="font-bold text-[#D4AF37]">{data.day}</p>
                          <p className="mt-1 font-semibold">Produksi: {data.telur} butir</p>
                          <p className="text-[#A3B899]">Pakan: {data.pakan} kg</p>
                          <p className="text-[#C5D6C6]">Produktivitas: {data.produktivitas}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="telur"
                  stroke="#2D4A36"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#eggGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ringkasan Bulan Ini Card */}
        <div className="lg:col-span-4 bg-white p-6 md:p-7 rounded-3xl border border-[#EFECE6] shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit'] mb-1">
              Ringkasan Bulan Ini
            </h3>
            <p className="text-xs text-stone-500 font-medium mb-4">
              Periode {currentPeriodLabel}
            </p>

            <div className="space-y-3.5 divide-y divide-[#EFECE6]">
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-stone-600 font-medium">Total Produksi:</span>
                <span className="text-base font-black text-[#1B3022] font-['Outfit']">
                  {monthEggCount} butir
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-xs text-stone-600 font-medium">Rata-rata / Hari:</span>
                <span className="text-base font-black text-[#2D4A36] font-['Outfit']">
                  {averageEggsPerDay} butir
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-xs text-stone-600 font-medium">Produktivitas:</span>
                <span className="text-base font-black text-[#2D4A36] font-['Outfit']">
                  {productivityRate}%
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-xs text-stone-600 font-medium">Total Pakan:</span>
                <span className="text-base font-black text-stone-800 font-['Outfit']">
                  {monthFeedKg.toString().replace('.', ',')} kg
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-xs text-stone-600 font-medium">Estimasi Nilai Telur:</span>
                <span className="text-base font-black text-[#2D4A36] font-['Outfit']">
                  {formatRupiah(estimatedEggValue)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#EFECE6]">
            <button
              onClick={() => {
                setActivePage('score');
                navigate('/score');
              }}
              className="w-full py-3 bg-[#F7F4EE] hover:bg-[#EAE4D9] text-[#1B3022] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#E5E1D8]"
            >
              Lihat Farm Score ({farm.farmCode}) →
            </button>
          </div>
        </div>
      </div>

      {/* Panel Notifikasi */}
      <div className="bg-white p-6 md:p-7 rounded-3xl border border-[#EFECE6] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-[#1B3022] font-['Outfit']">
              Pemberitahuan & Peringatan
            </h3>
            <span className="bg-[#FAF7F2] text-stone-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-[#EFECE6]">
              {notifications.length > 0 ? `${notifications.length} item` : 'Sistem Aktif'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Alert/Health Status */}
          {productivityRate < 70 && reports.length > 0 ? (
            <div className="p-4 rounded-2xl bg-[#FEF6E9] border border-[#FDE68A] flex flex-col justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#FDE68A] text-[#78350F] shrink-0">
                  <AlertTriangle className="w-5 h-5 text-[#C2841E]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#78350F] bg-white px-2 py-0.5 rounded border border-[#FDE68A]">
                    Status Perhatian
                  </span>
                  <h4 className="font-bold text-[#1B3022] text-sm mt-1.5">
                    Produktivitas {productivityRate}%
                  </h4>
                  <p className="text-xs text-stone-600 mt-1">
                    Produksi di bawah target 70%. Periksa kualitas pakan & sanitasi air minum.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActivePage('perkembangan');
                  navigate('/development');
                }}
                className="mt-3 text-xs font-bold text-[#78350F] hover:underline text-left cursor-pointer"
              >
                Lihat Analisa & Solusi →
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#EAF2EC] border border-[#CDE3D3] flex flex-col justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#CDE3D3] text-[#1B3022] shrink-0">
                  <HeartPulse className="w-5 h-5 text-[#2D4A36]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B3022] bg-white px-2 py-0.5 rounded border border-[#CDE3D3]">
                    Kondisi Prima
                  </span>
                  <h4 className="font-bold text-[#1B3022] text-sm mt-1.5">
                    Kandang Terpantau Baik
                  </h4>
                  <p className="text-xs text-stone-600 mt-1">
                    Produksi telur stabil dan populasi {farm.activeChickens} ekor ayam dalam kondisi optimal.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActivePage('perkembangan');
                  navigate('/development');
                }}
                className="mt-3 text-xs font-bold text-[#2D4A36] hover:underline text-left cursor-pointer"
              >
                Lihat Grafik Analisa →
              </button>
            </div>
          )}

          {/* Card 2: Pengingat Lapor Hari Ini */}
          {hasReportedToday ? (
            <div className="p-4 rounded-2xl bg-[#EAF2EC] border border-[#CDE3D3] flex flex-col justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#CDE3D3] text-[#1B3022] shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-[#3A5A40]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B3022] bg-white px-2 py-0.5 rounded border border-[#CDE3D3]">
                    Tercatat
                  </span>
                  <h4 className="font-bold text-[#1B3022] text-sm mt-1.5">
                    Laporan Hari Ini Selesai
                  </h4>
                  <p className="text-xs text-stone-600 mt-1">
                    Data {todayEggCount} butir telur telah tersimpan dan status garansi kandang tetap aktif.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActivePage('laporan');
                  navigate('/reports');
                }}
                className="mt-3 text-xs font-bold text-[#2D4A36] hover:underline text-left cursor-pointer"
              >
                Lihat Catatan Laporan →
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#F0F7F9] border border-[#CFE4EC] flex flex-col justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#CFE4EC] text-[#2B6E7F] shrink-0">
                  <Clock className="w-5 h-5 text-[#2B6E7F]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2B6E7F] bg-white px-2 py-0.5 rounded border border-[#CFE4EC]">
                    Pengingat Harian
                  </span>
                  <h4 className="font-bold text-[#1B3022] text-sm mt-1.5">
                    Jangan lupa lapor hari ini
                  </h4>
                  <p className="text-xs text-stone-600 mt-1">
                    Input laporan harian untuk memantau perkembangan ayam & menjaga garansi aktif.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickReportOpen(true)}
                className="mt-3 text-xs font-bold text-[#2B6E7F] hover:underline text-left cursor-pointer"
              >
                Isi Laporan Sekarang →
              </button>
            </div>
          )}

          {/* Card 3: Riwayat Verifikasi Terakhir */}
          {latestReport ? (
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6] flex flex-col justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#EFECE6] text-[#1B3022] shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-[#3A5A40]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B3022] bg-white px-2 py-0.5 rounded border border-[#EFECE6]">
                    Sinkronisasi
                  </span>
                  <h4 className="font-bold text-[#1B3022] text-sm mt-1.5">
                    Laporan Terverifikasi
                  </h4>
                  <p className="text-xs text-stone-600 mt-1">
                    Laporan tanggal {latestReport.date} ({latestReport.eggCount} butir) tersimpan aman di server Eggnest.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActivePage('laporan');
                  navigate('/reports');
                }}
                className="mt-3 text-xs font-bold text-[#2D4A36] hover:underline text-left cursor-pointer"
              >
                Lihat Riwayat Laporan →
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6] flex flex-col justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#EFECE6] text-stone-600 shrink-0">
                  <Info className="w-5 h-5 text-stone-500" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 bg-white px-2 py-0.5 rounded border border-[#EFECE6]">
                    Mulai
                  </span>
                  <h4 className="font-bold text-[#1B3022] text-sm mt-1.5">
                    Belum Ada Laporan
                  </h4>
                  <p className="text-xs text-stone-600 mt-1">
                    Catat panen telur dan pakan harian Anda untuk melihat statistik kandang.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickReportOpen(true)}
                className="mt-3 text-xs font-bold text-[#2D4A36] hover:underline text-left cursor-pointer"
              >
                Buat Laporan Pertama →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
