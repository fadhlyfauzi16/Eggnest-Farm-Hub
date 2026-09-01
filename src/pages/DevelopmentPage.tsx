import React, { useState } from 'react';
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
  ArrowDownRight,
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
  const {
    farm,
    reports,
    monthEggCount,
    averageEggsPerDay,
    productivityRate,
    productivityStatus,
    monthFeedKg,
    estimatedEggValue,
    settings,
    fcrRatio,
    setActivePage,
  } = useFarm();

  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [showCauseModal, setShowCauseModal] = useState(false);
  const [showFcrModal, setShowFcrModal] = useState(false);
  const [showFeedOverlay, setShowFeedOverlay] = useState(true);

  const pricePerEgg = Math.round((settings.eggPricePerKg || 32000) / (settings.eggsPerKg || 16));

  // Prepare 30 days chart data
  const chartData = reports.slice(-30).map((r) => {
    const day = r.date.split('-')[2];
    return {
      tanggal: `${parseInt(day, 10)} Agu`,
      telur: r.eggCount,
      pakanKg: r.feedKg,
      produktivitas: r.productivityRate,
      target: 10,
    };
  });

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
            <option value="2026-08">Agustus 2026 (Bulan Ini)</option>
            <option value="2026-07">Juli 2026</option>
            <option value="2026-06">Juni 2026</option>
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
            {monthEggCount}{' '}
            <span className="text-xs font-semibold text-stone-600">butir</span>
          </div>
          <span className="text-[11px] text-[#2D4A36] font-semibold block mt-1">
            ↑ 4.2% vs bulan lalu
          </span>
        </div>

        {/* Card 2: Rata-rata / Hari */}
        <div className="bg-white p-5 rounded-3xl border border-[#EFECE6] shadow-xs">
          <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block">
            Rata-rata / Hari
          </span>
          <div className="text-2xl lg:text-3xl font-black text-[#2D4A36] font-['Outfit'] mt-1">
            {averageEggsPerDay}{' '}
            <span className="text-xs font-semibold text-stone-600">butir</span>
          </div>
          <span className="text-[11px] text-stone-500 font-medium block mt-1">
            Target: 9–11 butir/hari
          </span>
        </div>

        {/* Card 3: Produktivitas */}
        <div className="bg-white p-5 rounded-3xl border border-[#EFECE6] shadow-xs">
          <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block">
            Produktivitas
          </span>
          <div className="text-2xl lg:text-3xl font-black text-[#1B3022] font-['Outfit'] mt-1">
            {productivityRate}%
          </div>
          <span className="text-[11px] text-[#1B3022] bg-[#EAF2EC] px-2.5 py-0.5 rounded-full font-bold inline-block mt-1 border border-[#CDE3D3]">
            Status: {productivityStatus}
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
            {monthFeedKg.toString().replace('.', ',')}{' '}
            <span className="text-xs font-semibold text-stone-600">kg</span>
          </div>
          <span className="text-[11px] text-stone-500 font-medium block mt-1">
            FCR: {fcrRatio > 0 ? `${fcrRatio} (Konversi Pakan)` : 'N/A (Data Belum Lengkap)'}
          </span>
        </div>

        {/* Card 5: Estimasi Nilai Telur */}
        <div className="bg-white p-5 rounded-3xl border border-[#EFECE6] shadow-xs col-span-2 sm:col-span-1">
          <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block">
            Estimasi Nilai Telur
          </span>
          <div className="text-xl lg:text-2xl font-black text-[#2D4A36] font-['Outfit'] mt-1 truncate">
            {formatRupiah(estimatedEggValue)}
          </div>
          <span className="text-[11px] text-stone-500 font-medium block mt-1">
            @ {formatRupiah(pricePerEgg)} / butir (Rp{settings.eggPricePerKg.toLocaleString('id-ID')}/kg)
          </span>
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
                domain={[0, 14]}
                stroke="#A8A29E"
                fontSize={11}
                tickLine={false}
                ticks={[0, 4, 8, 10, 12, 14]}
              />
              {showFeedOverlay && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 3]}
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
                        <p className="font-bold text-[#D4AF37]">{data.tanggal} 2026</p>
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

        {/* Analisa Otomatis Sederhana di Bawah Grafik */}
        <div className="pt-4 border-t border-[#EFECE6] space-y-4">
          <h4 className="text-sm font-bold text-[#1B3022] uppercase tracking-wider font-['Outfit']">
            Analisis Otomatis Sistem Eggnest:
          </h4>

          {/* Kondisi 1: Produksi Stabil */}
          <div className="p-4 rounded-2xl bg-[#EAF2EC] border border-[#CDE3D3] flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#CDE3D3] text-[#1B3022] shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#2D4A36]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[#1B3022]">
                  🟢 Produksi Stabil
                </span>
                <span className="text-xs bg-white text-[#1B3022] px-2.5 py-0.5 rounded-full font-semibold border border-[#CDE3D3]">
                  Rata-rata 9,6 butir/hari
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1">
                Produksi kandang berada pada kisaran normal usia puncak (20–25 minggu). Kawanan ayam dalam kondisi nutrisi dan pencahayaan yang sehat.
              </p>
            </div>
          </div>

          {/* Kondisi 2: Warning jika produksi mulai menurun */}
          <div className="p-4 rounded-2xl bg-[#FEF6E9] border border-[#FDE68A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#FDE68A] text-[#78350F] shrink-0">
                <AlertCircle className="w-5 h-5 text-[#92400E]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-[#78350F]">
                    🟡 Produksi Mulai Menurun
                  </span>
                  <span className="text-xs bg-white text-[#78350F] px-2.5 py-0.5 rounded-full font-semibold border border-[#FDE68A]">
                    Turun 18% dibanding minggu sebelumnya
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-1">
                  Terdeteksi fluktuasi panen di akhir pekan. Dianjurkan memeriksa suhu lingkungan dan kebersihan air minum.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCauseModal(true)}
              className="px-4 py-2.5 bg-[#C2841E] hover:bg-[#92400E] text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer text-center"
            >
              Lihat Kemungkinan Penyebab →
            </button>
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
                  Saat cuaca panas di atas 32°C, ayam minum lebih banyak dan nafsu makan berkurang hingga 15%. 
                  <strong> Solusi:</strong> Semprot kabut air tipis atau pasang peneduh paranet di sekitar kandang.
                </p>
              </div>

              {/* Item 2 */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6]">
                <div className="flex items-center gap-2 font-bold text-sm text-[#1B3022]">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  2. Jalur Air Minum Tersumbat / Kotor
                </div>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Kekurangan air selama beberapa jam langsung menurunkan produksi telur.
                  <strong> Solusi:</strong> Tekan ujung nipple minum untuk memastikan air mengalir lancar dan sejuk.
                </p>
              </div>

              {/* Item 3 */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6]">
                <div className="flex items-center gap-2 font-bold text-sm text-[#1B3022]">
                  <Wheat className="w-4 h-4 text-[#2D4A36]" />
                  3. Pakan Menggumpal / Lembab
                </div>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Pakan yang terkena cipratan air mudah berjamur dan membuat ayam enggan makan.
                  <strong> Solusi:</strong> Bersihkan palung pakan setiap sore dan berikan pakan fresh 2x sehari.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowCauseModal(false);
                  setActivePage('bantuan');
                }}
                className="px-5 py-3 bg-[#2D4A36] text-[#FDFBF7] font-bold text-sm rounded-xl shadow-md hover:bg-[#1B3022] cursor-pointer transition-colors"
              >
                Konsultasi dengan Dokter Hewan Eggnest →
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
                  📌 Standar Industri Ayam Ras Petelur (Lohmann Brown):
                </p>
                <ul className="list-disc pl-5 space-y-1 text-stone-600">
                  <li><strong className="text-[#2D4A36]">FCR 2.0 – 2.3:</strong> Sangat Baik & Efisien (Pakan diubah menjadi telur secara optimal).</li>
                  <li><strong className="text-[#C2841E]">FCR 2.4 – 2.6:</strong> Cukup (Ada sedikit pakan tercecer atau bobot telur kecil).</li>
                  <li><strong className="text-red-700">FCR &gt; 2.7:</strong> Perlu Evaluasi (Pakan boros, ayam stres, atau produksi menurun).</li>
                </ul>
              </div>

              <p className="text-stone-500 text-[11px]">
                *Data ini dihitung secara real-time dari laporan harian konsumsi pakan dan panen telur kandang Anda.
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
