import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarm } from '../context/FarmContext';
import {
  TrendingUp,
  Calendar,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  X,
  Wheat,
  Egg,
  Lightbulb,
  Droplets,
  ThermometerSun,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export const DevelopmentPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    farm,
    reports,
    settings,
    setActivePage,
  } = useFarm();

  const pricePerEgg = Math.round((settings.eggPricePerKg || 32000) / (settings.eggsPerKg || 16));

  const jakartaParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const currentYear = jakartaParts.find((part) => part.type === 'year')?.value || String(new Date().getFullYear());
  const currentMonth = jakartaParts.find((part) => part.type === 'month')?.value || String(new Date().getMonth() + 1).padStart(2, '0');
  const currentMonthKey = `${currentYear}-${currentMonth}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

  const monthOptions = useMemo(() => {
    const keys = new Set<string>([currentMonthKey]);
    reports.forEach((report) => {
      const key = String(report.date || '').slice(0, 7);
      if (/^\d{4}-\d{2}$/.test(key)) keys.add(key);
    });

    return Array.from(keys)
      .sort()
      .reverse()
      .map((key) => {
        const [year, month] = key.split('-').map(Number);
        const label = new Intl.DateTimeFormat('id-ID', {
          month: 'long',
          year: 'numeric',
        }).format(new Date(year, month - 1, 1));
        return {
          key,
          label: key === currentMonthKey ? `${label} (Bulan Ini)` : label,
        };
      });
  }, [reports, currentMonthKey]);

  const selectedReports = useMemo(
    () =>
      reports
        .filter((report) => String(report.date || '').startsWith(selectedMonth))
        .sort((a, b) => String(a.date).localeCompare(String(b.date))),
    [reports, selectedMonth]
  );

  const selectedEggCount = selectedReports.reduce((sum, report) => sum + Number(report.eggCount || 0), 0);
  const selectedFeedKg = selectedReports.reduce((sum, report) => sum + Number(report.feedKg || 0), 0);
  const selectedAverageEggs =
    selectedReports.length > 0 ? Math.round((selectedEggCount / selectedReports.length) * 10) / 10 : 0;
  const selectedProductivity =
    selectedReports.length > 0
      ? Math.round(
          (selectedReports.reduce((sum, report) => sum + Number(report.productivityRate || 0), 0) /
            selectedReports.length) *
            10
        ) / 10
      : 0;
  const selectedProductivityStatus =
    selectedProductivity >= 90
      ? 'Optimal'
      : selectedProductivity >= 80
        ? 'Baik'
        : selectedProductivity >= 70
          ? 'Cukup'
          : 'Perlu Perhatian';
  const selectedEstimatedEggValue = Math.round(selectedEggCount * pricePerEgg);
  const selectedFcr =
    selectedEggCount > 0
      ? Math.round((selectedFeedKg / (selectedEggCount / (settings.eggsPerKg || 16))) * 100) / 100
      : 0;

  const [selectedYearNum, selectedMonthNum] = selectedMonth.split('-').map(Number);
  const previousMonthDate = new Date(selectedYearNum, selectedMonthNum - 2, 1);
  const previousMonthKey = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const previousMonthReports = reports.filter((report) =>
    String(report.date || '').startsWith(previousMonthKey)
  );
  const previousMonthEggCount = previousMonthReports.reduce(
    (sum, report) => sum + Number(report.eggCount || 0),
    0
  );
  const monthChangePercent =
    previousMonthEggCount > 0
      ? Math.round(((selectedEggCount - previousMonthEggCount) / previousMonthEggCount) * 1000) / 10
      : null;

  const activeChickens = Number(farm.activeChickens || 0);
  const idealDailyEggTarget = activeChickens > 0 ? Math.max(1, Math.round(activeChickens * 0.85)) : 0;
  const expectedFeedKg = activeChickens > 0 ? activeChickens * 0.1 : 0;
  const selectedAverageFeed =
    selectedReports.length > 0 ? selectedFeedKg / selectedReports.length : 0;

  const feedState: 'insufficient' | 'low' | 'normal' | 'high' | 'extreme' =
    selectedReports.length === 0 || expectedFeedKg <= 0
      ? 'insufficient'
      : selectedAverageFeed > expectedFeedKg * 2
        ? 'extreme'
        : selectedAverageFeed > expectedFeedKg * 1.35
          ? 'high'
          : selectedAverageFeed < expectedFeedKg * 0.65
            ? 'low'
            : 'normal';

  const healthIssueReports = selectedReports.filter(
    (report) => report.chickenCondition === 'issue'
  );
  const latestSelectedReport =
    selectedReports.length > 0 ? selectedReports[selectedReports.length - 1] : null;
  const latestHealthIssue = latestSelectedReport?.chickenCondition === 'issue';
  const [showCauseModal, setShowCauseModal] = useState(false);
  const [showFcrModal, setShowFcrModal] = useState(false);
  const [showFeedOverlay, setShowFeedOverlay] = useState(true);


  // Grafik mengikuti bulan yang dipilih, tanpa hardcode nama bulan.
  const chartData = selectedReports.slice(-30).map((r) => {
    const [year, month, day] = String(r.date).split('-').map(Number);
    const label = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
    })
      .format(new Date(year, month - 1, day))
      .replace('.', '');

    return {
      tanggal: label,
      fullDate: r.date,
      telur: r.eggCount,
      pakanKg: r.feedKg,
      produktivitas: r.productivityRate,
      target: idealDailyEggTarget,
    };
  });

  // Smart Analysis berbasis laporan nyata. Ini bukan diagnosis penyakit.
  const analysis = useMemo(() => {
    const count = selectedReports.length;
    const avg = selectedAverageEggs;

    let productionTitle = 'Data Belum Tersedia';
    let productionBadge = 'Belum ada laporan';
    let productionDescription =
      'Isi laporan harian agar sistem dapat membaca performa kandang.';

    if (count > 0 && count < 3) {
      productionTitle = 'Data Awal Terkumpul';
      productionBadge = `Rata-rata ${String(avg).replace('.', ',')} butir/hari`;
      productionDescription =
        `Sudah ada ${count} laporan. Minimal 3 laporan diperlukan agar analisis produksi lebih bermakna.`;
    } else if (count >= 3) {
      const productionPct =
        activeChickens > 0 ? (avg / activeChickens) * 100 : selectedProductivity;

      if (productionPct >= 85) {
        productionTitle = 'Produksi Baik';
        productionBadge = `${Math.round(productionPct)}% dari ayam aktif`;
        productionDescription =
          'Rata-rata produksi berada pada tingkat yang baik berdasarkan jumlah ayam aktif.';
      } else if (productionPct >= 70) {
        productionTitle = 'Produksi Perlu Dipantau';
        productionBadge = `${Math.round(productionPct)}% dari ayam aktif`;
        productionDescription =
          'Produksi sedikit di bawah tingkat yang diharapkan. Pantau pakan, air minum, kebersihan, dan kondisi ayam.';
      } else {
        productionTitle = 'Produksi Perlu Perhatian';
        productionBadge = `${Math.round(productionPct)}% dari ayam aktif`;
        productionDescription =
          'Produksi cukup rendah dibanding jumlah ayam aktif. Lakukan pemeriksaan faktor pemeliharaan dan konsultasikan bila berlanjut.';
      }
    }

    let trendState: 'insufficient' | 'stable' | 'up' | 'down' = 'insufficient';
    let trendTitle = 'Tren Belum Dapat Dinilai';
    let trendBadge = `Baru ${count} laporan`;
    let trendDescription =
      'Minimal 6 laporan diperlukan untuk membandingkan 3 laporan terakhir dengan 3 laporan sebelumnya.';
    let trendPercent = 0;

    if (count >= 6) {
      const previous3 = selectedReports.slice(-6, -3);
      const latest3 = selectedReports.slice(-3);
      const previousAvg =
        previous3.reduce((sum, report) => sum + Number(report.eggCount || 0), 0) /
        previous3.length;
      const latestAvg =
        latest3.reduce((sum, report) => sum + Number(report.eggCount || 0), 0) /
        latest3.length;

      trendPercent =
        previousAvg > 0
          ? Math.round(((latestAvg - previousAvg) / previousAvg) * 1000) / 10
          : 0;

      if (trendPercent <= -10) {
        trendState = 'down';
        trendTitle = 'Produksi Mulai Menurun';
        trendBadge = `Turun ${Math.abs(trendPercent).toLocaleString('id-ID')}%`;
        trendDescription =
          'Rata-rata 3 laporan terakhir lebih rendah dibanding 3 laporan sebelumnya.';
      } else if (trendPercent >= 10) {
        trendState = 'up';
        trendTitle = 'Produksi Meningkat';
        trendBadge = `Naik ${trendPercent.toLocaleString('id-ID')}%`;
        trendDescription =
          'Rata-rata 3 laporan terakhir meningkat. Pertahankan pola perawatan yang berjalan.';
      } else {
        trendState = 'stable';
        trendTitle = 'Tren Produksi Stabil';
        trendBadge = `${trendPercent >= 0 ? '+' : ''}${trendPercent.toLocaleString('id-ID')}%`;
        trendDescription =
          'Perubahan 3 laporan terakhir masih berada dalam rentang stabil.';
      }
    }

    let overallLevel: 'normal' | 'watch' | 'action' | 'insufficient' = 'insufficient';
    let overallTitle = 'Data Sedang Dikumpulkan';
    let overallMessage =
      count === 0
        ? 'Belum ada laporan pada periode ini.'
        : `Sudah ada ${count} laporan. Sistem akan semakin akurat setelah data bertambah.`;

    if (count >= 3) {
      if (latestHealthIssue || trendState === 'down' || feedState === 'extreme') {
        overallLevel = 'action';
        overallTitle = 'Kandang Perlu Perhatian';
        overallMessage =
          'Ada indikator yang perlu diperiksa. Lihat rekomendasi di bawah dan konsultasikan jika kondisi berlanjut.';
      } else if (
        feedState === 'high' ||
        feedState === 'low' ||
        selectedProductivity < 75 ||
        healthIssueReports.length > 0
      ) {
        overallLevel = 'watch';
        overallTitle = 'Perlu Pantauan';
        overallMessage =
          'Kondisi belum darurat, tetapi ada data yang sebaiknya dipantau lebih dekat.';
      } else {
        overallLevel = 'normal';
        overallTitle = 'Kandang Terpantau Baik';
        overallMessage =
          'Data produksi, pakan, dan kondisi ayam belum menunjukkan indikator masalah yang berarti.';
      }
    }

    return {
      count,
      productionTitle,
      productionBadge,
      productionDescription,
      trendState,
      trendTitle,
      trendBadge,
      trendDescription,
      trendPercent,
      overallLevel,
      overallTitle,
      overallMessage,
    };
  }, [
    selectedReports,
    selectedAverageEggs,
    selectedProductivity,
    activeChickens,
    feedState,
    latestHealthIssue,
    healthIssueReports.length,
  ]);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Header with Month Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-[#EAF2EC] text-[#1B3022] text-xs font-bold rounded-full border border-[#CDE3D3]">
            Monitoring & Analisis
          </span>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1B3022] font-['Outfit'] tracking-tight mt-1">
            Perkembangan Kandang
          </h1>
          <p className="text-stone-600 text-sm font-medium mt-1">
            Pantau konsistensi produksi telur, konversi pakan, dan tren performa harian.
          </p>
        </div>

        {/* Dropdown Bulan */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#EFECE6] shadow-xs">
          <Calendar className="w-5 h-5 text-[#2D4A36] ml-2" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-transparent text-sm font-bold text-[#1B3022] outline-none cursor-pointer"
          >
            {monthOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5 Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {/* Card 1: Total Produksi */}
        <div className="bg-white p-5 rounded-3xl border border-[#EFECE6] shadow-xs">
          <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block">
            Total Produksi
          </span>
          <div className="text-2xl lg:text-3xl font-black text-[#1B3022] font-['Outfit'] mt-1">
            {selectedEggCount}{' '}
            <span className="text-xs font-semibold text-stone-600">butir</span>
          </div>
          <span className="text-[11px] text-[#2D4A36] font-semibold block mt-1">
            {monthChangePercent === null
              ? 'Belum ada pembanding bulan lalu'
              : `${monthChangePercent >= 0 ? '↑' : '↓'} ${Math.abs(monthChangePercent).toLocaleString('id-ID')}% vs bulan lalu`}
          </span>
        </div>

        {/* Card 2: Rata-rata / Hari */}
        <div className="bg-white p-5 rounded-3xl border border-[#EFECE6] shadow-xs">
          <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block">
            Rata-rata / Hari
          </span>
          <div className="text-2xl lg:text-3xl font-black text-[#2D4A36] font-['Outfit'] mt-1">
            {selectedAverageEggs}{' '}
            <span className="text-xs font-semibold text-stone-600">butir</span>
          </div>
          <span className="text-[11px] text-stone-500 font-medium block mt-1">
            {activeChickens > 0
              ? `Acuan ±${idealDailyEggTarget} butir/hari (${activeChickens} ayam aktif)`
              : 'Jumlah ayam aktif belum tersedia'}
          </span>
        </div>

        {/* Card 3: Produktivitas */}
        <div className="bg-white p-5 rounded-3xl border border-[#EFECE6] shadow-xs">
          <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block">
            Produktivitas
          </span>
          <div className="text-2xl lg:text-3xl font-black text-[#1B3022] font-['Outfit'] mt-1">
            {selectedProductivity}%
          </div>
          <span className="text-[11px] text-[#1B3022] bg-[#EAF2EC] px-2.5 py-0.5 rounded-full font-bold inline-block mt-1 border border-[#CDE3D3]">
            Status: {selectedProductivityStatus}
          </span>
        </div>

        {/* Card 4: Total Pakan */}
        <div className="bg-white p-5 rounded-3xl border border-[#EFECE6] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block">
              Total Pakan
            </span>
            <button
              onClick={() => setShowFcrModal(true)}
              className="text-[10px] text-[#2D4A36] bg-[#EAF2EC] px-1.5 py-0.5 rounded-full font-bold border border-[#CDE3D3] cursor-pointer hover:bg-[#CDE3D3]"
              title="Informasi Formula FCR"
            >
              Info FCR ℹ️
            </button>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-stone-800 font-['Outfit'] mt-1">
            {selectedFeedKg.toString().replace('.', ',')}{' '}
            <span className="text-xs font-semibold text-stone-600">kg</span>
          </div>
          <span className="text-[11px] text-stone-500 font-medium block mt-1">
            FCR: {selectedFcr > 0 ? `${selectedFcr} (Konversi Pakan)` : 'N/A (Data Belum Lengkap)'}
          </span>
        </div>

        {/* Card 5: Estimasi Nilai Telur */}
        <div className="bg-white p-5 rounded-3xl border border-[#EFECE6] shadow-xs col-span-2 sm:col-span-1">
          <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block">
            Estimasi Nilai Telur
          </span>
          <div className="text-xl lg:text-2xl font-black text-[#2D4A36] font-['Outfit'] mt-1 truncate">
            {formatRupiah(selectedEstimatedEggValue)}
          </div>
          <span className="text-[11px] text-stone-500 font-medium block mt-1">
            @ {formatRupiah(pricePerEgg)} / butir (Rp{settings.eggPricePerKg.toLocaleString('id-ID')}/kg)
          </span>
        </div>
      </div>

      {/* Smart Status Eggnest */}
      <div className={`rounded-3xl p-6 md:p-7 border ${
        analysis.overallLevel === 'action'
          ? 'bg-[#FEF2F2] border-[#FECACA]'
          : analysis.overallLevel === 'watch'
            ? 'bg-[#FFF8E8] border-[#FDE68A]'
            : analysis.overallLevel === 'normal'
              ? 'bg-[#EAF2EC] border-[#CDE3D3]'
              : 'bg-[#F0F7F9] border-[#CFE4EC]'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-black/5 flex items-center justify-center shrink-0">
              {analysis.overallLevel === 'action' ? (
                <ShieldAlert className="w-6 h-6 text-red-700" />
              ) : analysis.overallLevel === 'watch' ? (
                <AlertCircle className="w-6 h-6 text-[#C2841E]" />
              ) : analysis.overallLevel === 'normal' ? (
                <CheckCircle2 className="w-6 h-6 text-[#2D4A36]" />
              ) : (
                <HelpCircle className="w-6 h-6 text-[#2B6E7F]" />
              )}
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-black text-stone-500">
                Smart Analysis Eggnest
              </span>
              <h2 className="text-xl md:text-2xl font-black text-[#1B3022] font-['Outfit'] mt-1">
                {analysis.overallTitle}
              </h2>
              <p className="text-sm text-stone-700 mt-1 max-w-2xl">{analysis.overallMessage}</p>
              <p className="text-[11px] text-stone-500 mt-2">
                Analisis ini adalah panduan pemantauan kandang, bukan diagnosis penyakit.
              </p>
            </div>
          </div>

          {(analysis.overallLevel === 'action' || analysis.overallLevel === 'watch') && (
            <button
              onClick={() => {
                setActivePage('bantuan');
                navigate('/support');
              }}
              className="px-5 py-3.5 bg-[#1B3022] hover:bg-[#2D4A36] text-white rounded-2xl text-sm font-black cursor-pointer shrink-0"
            >
              Konsultasi Tim Eggnest →
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
          <div className="bg-white/80 rounded-2xl p-4 border border-black/5">
            <div className="flex items-center gap-2">
              <Egg className="w-4 h-4 text-[#2D4A36]" />
              <span className="text-xs font-black text-stone-600">PRODUKSI</span>
            </div>
            <p className="font-black text-[#1B3022] mt-2">{analysis.productionTitle}</p>
            <p className="text-xs text-stone-600 mt-1">{analysis.productionBadge}</p>
          </div>

          <div className="bg-white/80 rounded-2xl p-4 border border-black/5">
            <div className="flex items-center gap-2">
              <Wheat className="w-4 h-4 text-[#C2841E]" />
              <span className="text-xs font-black text-stone-600">PAKAN</span>
            </div>
            <p className="font-black text-[#1B3022] mt-2">
              {feedState === 'extreme'
                ? 'Input Sangat Tinggi'
                : feedState === 'high'
                  ? 'Di Atas Acuan'
                  : feedState === 'low'
                    ? 'Di Bawah Acuan'
                    : feedState === 'normal'
                      ? 'Dalam Kisaran'
                      : 'Belum Dinilai'}
            </p>
            <p className="text-xs text-stone-600 mt-1">
              {selectedReports.length > 0
                ? `Rata-rata ${selectedAverageFeed.toFixed(2).replace('.', ',')} kg/laporan • acuan sekitar ${expectedFeedKg.toFixed(2).replace('.', ',')} kg/hari`
                : 'Belum ada data pakan.'}
            </p>
          </div>

          <div className="bg-white/80 rounded-2xl p-4 border border-black/5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#2D4A36]" />
              <span className="text-xs font-black text-stone-600">KONDISI AYAM</span>
            </div>
            <p className="font-black text-[#1B3022] mt-2">
              {latestHealthIssue
                ? 'Perlu Diperiksa'
                : healthIssueReports.length > 0
                  ? 'Ada Riwayat Masalah'
                  : selectedReports.length > 0
                    ? 'Terpantau Baik'
                    : 'Belum Dinilai'}
            </p>
            <p className="text-xs text-stone-600 mt-1">
              {selectedReports.length > 0
                ? `${healthIssueReports.length} laporan bermasalah dari ${selectedReports.length} laporan periode ini.`
                : 'Isi laporan untuk memantau kondisi ayam.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#EFECE6] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit'] flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#2D4A36]" />
              Trend Produksi Harian (30 Hari)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Grafik pergerakan jumlah butir telur yang dihasilkan setiap hari
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFeedOverlay(!showFeedOverlay)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                showFeedOverlay
                  ? 'bg-[#FEF6E9] border-[#FDE68A] text-[#78350F]'
                  : 'bg-[#FAF7F2] border-[#EFECE6] text-stone-600'
              }`}
            >
              🌾 {showFeedOverlay ? 'Sembunyikan Pakan' : 'Tampilkan Pakan (kg)'}
            </button>
          </div>
        </div>

        {/* Recharts Line Component */}
        <div className="h-72 md:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE6" />
              <XAxis
                dataKey="tanggal"
                stroke="#A8A29E"
                fontSize={11}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="left"
                domain={[0, (dataMax: number) => Math.max(activeChickens, dataMax + 1, 1)]}
                allowDecimals={false}
                stroke="#A8A29E"
                fontSize={11}
                tickLine={false}
              />
              {showFeedOverlay && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, (dataMax: number) => Math.max(dataMax * 1.15, expectedFeedKg * 1.5, 1)]}
                  stroke="#D4AF37"
                  fontSize={11}
                  tickLine={false}
                  hide={true}
                />
              )}
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#1B3022] text-[#FDFBF7] p-3 rounded-2xl text-xs shadow-xl border border-[#2D4A36] space-y-1">
                        <p className="font-bold text-[#D4AF37]">{data.fullDate || data.tanggal}</p>
                        <p className="text-sm font-black text-[#FDFBF7]">
                          🥚 Produksi: {data.telur} butir
                        </p>
                        <p className="text-[#CDE3D3] font-semibold">
                          📊 Produktivitas: {data.produktivitas}%
                        </p>
                        <p className="text-[#FDE68A]">🌾 Pakan: {data.pakanKg} kg</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="telur"
                name="Produksi Telur (butir)"
                stroke="#2D4A36"
                strokeWidth={3}
                dot={{ r: 3, fill: '#2D4A36' }}
                activeDot={{ r: 6, fill: '#D4AF37', stroke: '#1B3022', strokeWidth: 2 }}
              />
              <Line
                yAxisId="left"
                type="stepAfter"
                dataKey="target"
                name="Garis Target Ideal (10 butir)"
                stroke="#A8A29E"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
              />
              {showFeedOverlay && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="pakanKg"
                  name="Pakan Harian (kg)"
                  stroke="#D4AF37"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Analisa Otomatis Berbasis Data Laporan */}
        <div className="pt-4 border-t border-[#EFECE6] space-y-4">
          <h4 className="text-sm font-bold text-[#1B3022] uppercase tracking-wider font-['Outfit']">
            Analisis Otomatis Sistem Eggnest:
          </h4>

          {/* Analisis rata-rata produksi */}
          <div className="p-4 rounded-2xl bg-[#EAF2EC] border border-[#CDE3D3] flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#CDE3D3] text-[#1B3022] shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#2D4A36]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-bold text-[#1B3022]">
                  {analysis.productionTitle}
                </span>
                <span className="text-xs bg-white text-[#1B3022] px-2.5 py-0.5 rounded-full font-semibold border border-[#CDE3D3]">
                  {analysis.productionBadge}
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1">
                {analysis.productionDescription}
              </p>
            </div>
          </div>

          {/* Analisis tren produksi */}
          <div
            className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border ${
              analysis.trendState === 'down'
                ? 'bg-[#FEF6E9] border-[#FDE68A]'
                : analysis.trendState === 'up'
                  ? 'bg-[#EAF2EC] border-[#CDE3D3]'
                  : 'bg-[#FAF7F2] border-[#EFECE6]'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  analysis.trendState === 'down'
                    ? 'bg-[#FDE68A] text-[#78350F]'
                    : analysis.trendState === 'up'
                      ? 'bg-[#CDE3D3] text-[#1B3022]'
                      : 'bg-stone-100 text-stone-600'
                }`}
              >
                {analysis.trendState === 'down' ? (
                  <AlertCircle className="w-5 h-5 text-[#92400E]" />
                ) : analysis.trendState === 'up' ? (
                  <ArrowUpRight className="w-5 h-5 text-[#2D4A36]" />
                ) : (
                  <HelpCircle className="w-5 h-5 text-stone-500" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-base font-bold ${
                      analysis.trendState === 'down' ? 'text-[#78350F]' : 'text-[#1B3022]'
                    }`}
                  >
                    {analysis.trendTitle}
                  </span>
                  <span
                    className={`text-xs bg-white px-2.5 py-0.5 rounded-full font-semibold border ${
                      analysis.trendState === 'down'
                        ? 'text-[#78350F] border-[#FDE68A]'
                        : 'text-[#1B3022] border-[#EFECE6]'
                    }`}
                  >
                    {analysis.trendBadge}
                  </span>
                </div>

                <p className="text-xs text-stone-600 mt-1">
                  {analysis.trendDescription}
                </p>
              </div>
            </div>

            {analysis.trendState === 'down' && (
              <button
                onClick={() => setShowCauseModal(true)}
                className="px-4 py-2.5 bg-[#C2841E] hover:bg-[#92400E] text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer text-center"
              >
                Lihat Kemungkinan Penyebab →
              </button>
            )}
          </div>

          {/* Analisis pakan */}
          <div className={`p-4 rounded-2xl border ${
            feedState === 'extreme' || feedState === 'high' || feedState === 'low'
              ? 'bg-[#FEF6E9] border-[#FDE68A]'
              : 'bg-[#FAF7F2] border-[#EFECE6]'
          }`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white border border-black/5 shrink-0">
                <Wheat className="w-5 h-5 text-[#C2841E]" />
              </div>
              <div>
                <h4 className="font-bold text-[#1B3022]">
                  {feedState === 'extreme'
                    ? 'Cek Kembali Input Pakan'
                    : feedState === 'high'
                      ? 'Konsumsi Pakan Di Atas Acuan'
                      : feedState === 'low'
                        ? 'Konsumsi Pakan Di Bawah Acuan'
                        : feedState === 'normal'
                          ? 'Pakan Dalam Kisaran'
                          : 'Pakan Belum Dapat Dinilai'}
                </h4>
                <p className="text-xs text-stone-600 mt-1">
                  {feedState === 'extreme'
                    ? `Rata-rata input ${selectedAverageFeed.toFixed(2).replace('.', ',')} kg/laporan sangat jauh dari acuan sekitar ${expectedFeedKg.toFixed(2).replace('.', ',')} kg/hari untuk ${activeChickens} ayam. Periksa apakah ada salah penulisan desimal.`
                    : feedState === 'high'
                      ? 'Periksa apakah pakan tercecer, takaran terlalu besar, atau input laporan kurang tepat.'
                      : feedState === 'low'
                        ? 'Pastikan seluruh ayam memperoleh pakan cukup dan input laporan sudah benar.'
                        : feedState === 'normal'
                          ? 'Rata-rata input pakan masih berada dekat kisaran acuan berdasarkan jumlah ayam aktif.'
                          : 'Tambahkan laporan pakan untuk mulai melakukan pemantauan.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Lihat Kemungkinan Penyebab */}
      {showCauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#EFECE6] w-full max-w-xl overflow-hidden p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#EFECE6] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#FEF6E9] text-[#78350F] border border-[#FDE68A]">
                  <Lightbulb className="w-6 h-6 text-[#C2841E]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit']">
                    Kemungkinan Penyebab Produksi Turun
                  </h3>
                  <p className="text-xs text-stone-500">
                    Panduan investigasi mandiri untuk pemilik kandang
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCauseModal(false)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {/* Item 1 */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6]">
                <div className="flex items-center gap-2 font-bold text-sm text-[#1B3022]">
                  <ThermometerSun className="w-4 h-4 text-[#C2841E]" />
                  1. Suhu Udara Terlalu Terik (Heat Stress)
                </div>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Cuaca yang terlalu panas dapat membuat ayam lebih banyak minum dan mengurangi konsumsi pakan.
                  <strong> Langkah awal:</strong> Pastikan kandang teduh, sirkulasi udara baik, dan air minum selalu tersedia.
                </p>
              </div>

              {/* Item 2 */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6]">
                <div className="flex items-center gap-2 font-bold text-sm text-[#1B3022]">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  2. Jalur Air Minum Tersumbat / Kotor
                </div>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Gangguan ketersediaan air dapat memengaruhi kondisi dan produksi ayam.
                  <strong> Langkah awal:</strong> Pastikan jalur air bersih dan air minum mengalir dengan baik.
                </p>
              </div>

              {/* Item 3 */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6]">
                <div className="flex items-center gap-2 font-bold text-sm text-[#1B3022]">
                  <Wheat className="w-4 h-4 text-[#2D4A36]" />
                  3. Pakan Menggumpal / Lembab
                </div>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Pakan lembap, menggumpal, atau berbau tidak normal sebaiknya tidak digunakan.
                  <strong> Langkah awal:</strong> Jaga tempat pakan tetap bersih dan kering serta gunakan pakan sesuai standar Eggnest.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowCauseModal(false);
                  setActivePage('bantuan');
                  navigate('/support');
                }}
                className="px-5 py-3 bg-[#2D4A36] text-[#FDFBF7] font-bold text-sm rounded-xl shadow-md hover:bg-[#1B3022] cursor-pointer transition-colors"
              >
                Konsultasi Tim Eggnest →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FCR Information Modal */}
      {showFcrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#EFECE6] p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌾</span>
                <div>
                  <h3 className="text-lg font-bold text-[#1B3022] font-['Outfit']">
                    Formula & Penjelasan FCR
                  </h3>
                  <span className="text-xs text-stone-500">Feed Conversion Ratio</span>
                </div>
              </div>
              <button
                onClick={() => setShowFcrModal(false)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-700 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6] font-mono text-[11px] text-[#1B3022]">
                <strong className="text-[#2D4A36]">Rumus Perhitungan:</strong>
                <p className="mt-1">FCR = Total Konsumsi Pakan (kg) ÷ Total Massa Telur (kg)</p>
                <p className="mt-0.5 text-stone-500">Total Massa Telur = Total Butir Telur ÷ {settings.eggsPerKg} butir/kg</p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-stone-800">
                  📌 Acuan Pemantauan FCR Ayam Petelur:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-stone-600">
                  <li><strong className="text-[#2D4A36]">FCR 2.0 – 2.3:</strong> Sangat Baik & Efisien (Pakan diubah menjadi telur secara optimal).</li>
                  <li><strong className="text-[#C2841E]">FCR 2.4 – 2.6:</strong> Cukup (Ada sedikit pakan tercecer atau bobot telur kecil).</li>
                  <li><strong className="text-red-700">FCR &gt; 2.7:</strong> Perlu Evaluasi (Pakan boros, ayam stres, atau produksi menurun).</li>
                </ul>
              </div>

              <p className="text-stone-500 text-[11px]">
                *FCR dihitung dari data laporan harian. Gunakan sebagai indikator pemantauan, bukan diagnosis kesehatan ayam.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowFcrModal(false)}
                className="px-5 py-2.5 bg-[#2D4A36] text-[#FDFBF7] font-bold text-xs rounded-xl hover:bg-[#1B3022] cursor-pointer"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
