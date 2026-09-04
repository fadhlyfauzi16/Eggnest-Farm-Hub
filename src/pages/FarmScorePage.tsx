import React from 'react';
import { useFarm } from '../context/FarmContext';
import { GaugeChart } from '../components/common/GaugeChart';
import {
  Award,
  Star,
  Flame,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  HeartPulse,
  FileSpreadsheet,
  Sparkles,
  Medal,
  ChevronRight,
  Info,
} from 'lucide-react';

export const FarmScorePage: React.FC = () => {
  const { farm, farmScore } = useFarm();

  const scoreCategories = [
    {
      name: 'Produksi',
      score: farmScore.productionScore,
      icon: EggScoreIcon,
      color: 'from-[#52B788] to-[#2D6A4F]',
      desc: 'Konsistensi jumlah panen harian di atas 80% target',
    },
    {
      name: 'Pelaporan',
      score: farmScore.reportScore,
      icon: FileSpreadsheet,
      color: 'from-blue-500 to-indigo-600',
      desc: 'Disiplin input laporan harian sebelum pukul 18:00',
    },
    {
      name: 'Perawatan',
      score: farmScore.maintenanceScore,
      icon: ShieldCheck,
      color: 'from-amber-500 to-amber-700',
      desc: 'Ketepatan porsi pakan 1,2 kg & kebersihan kolong sekam',
    },
    {
      name: 'Kesehatan',
      score: farmScore.healthScore,
      icon: HeartPulse,
      color: 'from-rose-500 to-rose-700',
      desc: 'Nol mortalitas ayam & tidak ada keluhan sakit parah',
    },
  ];

  function EggScoreIcon({ className }: { className?: string }) {
    return <span className={className}>🥚</span>;
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <span className="px-3 py-1 bg-[#EAF2EC] text-[#1B3022] text-xs font-bold rounded-full border border-[#CDE3D3]">
          Evaluasi Kinerja Standar Eggnest
        </span>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1B3022] font-['Outfit'] tracking-tight mt-1">
          Farm Score
        </h1>
        <p className="text-stone-600 text-sm font-medium mt-1">
          Penilaian kinerja kandang Anda berdasarkan data panen, perawatan, dan kedisiplinan.
        </p>
      </div>

      {/* Main Gauge & Rating Hero Card */}
      <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-10 relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Gauge Chart */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 bg-[#FAF7F2] rounded-3xl border border-[#EFECE6]">
            <GaugeChart
              score={farmScore.totalScore}
              max={100}
              size={260}
              label="Indeks Performa Kandang"
              statusText={farmScore.statusText}
            />

            {/* 5 Stars Rating */}
            <div className="flex items-center gap-1.5 mt-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= Math.round(farmScore.totalScore / 20);
                return (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${
                      filled ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-stone-300'
                    } drop-shadow-xs`}
                  />
                );
              })}
              <span className="text-xs font-black text-stone-600 ml-2">
                {(farmScore.totalScore / 20).toFixed(1)} / 5.0 (Bintang Evaluasi)
              </span>
            </div>
          </div>

          {/* Right: Key highlights & Tier */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#FEF6E9] text-[#78350F] font-bold border border-[#FDE68A]">
                🏆
              </span>
              <div>
                <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit']">
                  {farmScore.totalScore >= 85
                    ? 'Kategori Peternak Unggulan (Tier Platinum)'
                    : farmScore.totalScore >= 70
                    ? 'Kategori Peternak Produktif (Tier Gold)'
                    : 'Kategori Peternak Mandiri (Tier Silver)'}
                </h3>
                <p className="text-xs text-stone-500">
                  Kandang {farm.farmCode} ({farm.ownerName}) dievaluasi berdasarkan data pelaporan aktual.
                </p>
              </div>
            </div>

            {/* Streak achievement callout */}
            <div className="p-4 rounded-2xl bg-[#FEF6E9] border border-[#FDE68A] flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#C2841E] text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
                <Flame className="w-6 h-6 fill-current text-white animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#78350F] uppercase tracking-wider block font-['Outfit']">
                  Streak Pencatatan Aktif
                </span>
                <p className="text-base md:text-lg font-black text-[#1B3022] font-['Outfit']">
                  🔥 {farmScore.streakDays > 0 ? `${farmScore.streakDays} hari berturut-turut tercatat` : 'Pencatatan rutin aktif'}
                </p>
                <span className="text-[11px] text-stone-600">
                  Konsistensi Anda menjamin garansi penggantian bibit 100% aman dan terpantau.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EFECE6]">
                <span className="text-[11px] text-stone-500 font-medium">Garansi Bibit:</span>
                <p className="text-sm font-bold text-[#2D4A36]">✅ Terverifikasi Aktif</p>
              </div>
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EFECE6]">
                <span className="text-[11px] text-stone-500 font-medium">Bonus Kemitraan:</span>
                <p className="text-sm font-bold text-[#1B3022]">+5% Point Reward</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rincian Scores Progress Bars */}
      <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
          <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit'] flex items-center gap-2">
            <Award className="w-6 h-6 text-[#2D4A36]" />
            Rincian Indikator Penilaian
          </h3>
          <span className="text-xs text-stone-500">Kalkulasi diperbarui hari ini</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scoreCategories.map((cat) => {
            const Icon = cat.icon;

            return (
              <div
                key={cat.name}
                className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white text-[#1B3022] flex items-center justify-center font-bold shadow-xs border border-[#EFECE6]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-[#1B3022] font-['Outfit']">{cat.name}</h4>
                      <p className="text-[11px] text-stone-500">{cat.desc}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-[#1B3022] font-['Outfit']">
                      {cat.score}
                    </span>
                    <span className="text-xs font-bold text-stone-500"> / 100</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#E5E1D8] h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-[#2D4A36] h-full rounded-full transition-all duration-700"
                    style={{ width: `${cat.score}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges & Achievements Grid */}
      <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-8 space-y-5">
        <div>
          <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit']">
            Lencana & Prestasi Kandang
          </h3>
          <p className="text-xs text-stone-500">
            Apresiasi otomatis yang berhasil diraih oleh kandang {farm.farmCode}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {farmScore.badges.map((badge) => (
            <div
              key={badge.id}
              className="p-5 rounded-3xl bg-[#FAF7F2] border-2 border-[#EFECE6] hover:border-[#2D4A36] transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start gap-3.5">
                <span className="text-4xl p-2 rounded-2xl bg-white shadow-xs border border-[#EFECE6] shrink-0">
                  {badge.icon}
                </span>
                <div>
                  <h4 className="text-base font-bold text-[#1B3022] leading-tight font-['Outfit']">
                    {badge.title}
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 leading-snug">
                    {badge.description}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#EFECE6] flex items-center justify-between text-[11px] text-stone-500">
                <span>Diraih pada:</span>
                <strong className="text-[#2D4A36]">{badge.earnedDate}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
