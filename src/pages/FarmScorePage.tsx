import React from 'react';
import { useFarm } from '../context/FarmContext';
import { GaugeChart } from '../components/common/GaugeChart';
import {
  Award,
  Star,
  Flame,
  FileSpreadsheet,
  ShieldCheck,
  HeartPulse,
  Info,
  Clock3,
  CheckCircle2,
} from 'lucide-react';

export const FarmScorePage: React.FC = () => {
  const { farm, farmScore, reports } = useFarm();

  const MIN_REPORTS = 7;
  const reportCount = reports.length;
  const isEvaluated = reportCount >= MIN_REPORTS;
  const remainingReports = Math.max(0, MIN_REPORTS - reportCount);
  const progressPercent = Math.min(100, Math.round((reportCount / MIN_REPORTS) * 100));

  const scoreCategories = [
    {
      name: 'Produksi',
      score: farmScore.productionScore,
      icon: EggScoreIcon,
      desc: 'Rata-rata produktivitas berdasarkan laporan produksi aktual.',
    },
    {
      name: 'Pelaporan',
      score: farmScore.reportScore,
      icon: FileSpreadsheet,
      desc: 'Konsistensi pencatatan laporan kandang yang benar-benar tersimpan.',
    },
    {
      name: 'Perawatan',
      score: farmScore.maintenanceScore,
      icon: ShieldCheck,
      desc: 'Konsistensi pencatatan pakan harian sebagai indikator perawatan.',
    },
    {
      name: 'Kesehatan',
      score: farmScore.healthScore,
      icon: HeartPulse,
      desc: 'Kondisi kesehatan dari laporan aktual serta mortalitas ayam.',
    },
  ];

  function EggScoreIcon({ className }: { className?: string }) {
    return <span className={className}>🥚</span>;
  }

  const tierText =
    farmScore.totalScore >= 85
      ? 'Kategori Peternak Unggulan (Tier Platinum)'
      : farmScore.totalScore >= 70
      ? 'Kategori Peternak Produktif (Tier Gold)'
      : farmScore.totalScore >= 55
      ? 'Kategori Peternak Berkembang (Tier Silver)'
      : 'Kategori Pembinaan';

  const warrantyActive = Boolean(farm.warrantyEnd);

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
          Penilaian kinerja kandang berdasarkan data laporan nyata, bukan nilai bawaan.
        </p>
      </div>

      {!isEvaluated ? (
        <>
          {/* PRE-EVALUATION STATE */}
          <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5">
                <div className="p-7 md:p-9 bg-[#FAF7F2] rounded-3xl border border-[#EFECE6] text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-[#EAF2EC] border border-[#CDE3D3] flex items-center justify-center">
                    <Clock3 className="w-8 h-8 text-[#2D4A36]" />
                  </div>

                  <div className="mt-4">
                    <span className="text-sm font-black text-[#2D4A36] uppercase tracking-wider">
                      {reportCount === 0 ? 'Belum Dinilai' : 'Mengumpulkan Data'}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-[#1B3022] font-['Outfit'] mt-1">
                      — / 100
                    </h2>
                    <p className="text-sm text-stone-500 mt-2">
                      Farm Score aktif setelah minimal {MIN_REPORTS} hari laporan.
                    </p>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-600 mb-2">
                      <span>Data terkumpul</span>
                      <span>
                        {reportCount} / {MIN_REPORTS} hari
                      </span>
                    </div>
                    <div className="w-full h-3 bg-[#E5E1D8] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2D4A36] rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FEF6E9] text-[#78350F] rounded-full border border-[#FDE68A] text-xs font-bold">
                    <Info className="w-3.5 h-3.5" />
                    Penilaian belum diterbitkan
                  </span>

                  <h3 className="text-xl md:text-2xl font-black text-[#1B3022] font-['Outfit'] mt-3">
                    {reportCount === 0
                      ? 'Mulai catat laporan harian untuk membangun Farm Score.'
                      : `Tinggal ${remainingReports} hari laporan lagi untuk evaluasi pertama.`}
                  </h3>

                  <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                    Selama data belum mencapai {MIN_REPORTS} hari, sistem tidak memberikan
                    nilai, tier, bintang, bonus reward, atau lencana. Semua pencapaian baru
                    muncul setelah dihitung dari laporan kandang yang benar-benar tersimpan.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#EAF2EC] border border-[#CDE3D3] flex items-start gap-3">
                  <Flame className="w-5 h-5 text-[#2D4A36] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-[#1B3022] uppercase tracking-wider">
                      Streak Pencatatan Saat Ini
                    </span>
                    <p className="font-black text-[#1B3022] mt-0.5">
                      {farmScore.streakDays > 0
                        ? `${farmScore.streakDays} hari berturut-turut`
                        : 'Belum ada streak'}
                    </p>
                    <p className="text-xs text-stone-600 mt-1">
                      Streak boleh terlihat sejak hari pertama, tetapi belum menjadi prestasi
                      resmi sebelum syarat minimum evaluasi terpenuhi.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#EFECE6]">
                    <span className="text-[11px] text-stone-500 font-medium">
                      Status Garansi Paket
                    </span>
                    <p className="text-sm font-bold text-[#1B3022] mt-1">
                      {warrantyActive ? '✅ Mengikuti masa garansi paket' : '— Belum tersedia'}
                    </p>
                    {warrantyActive && (
                      <p className="text-[11px] text-stone-500 mt-1">
                        Batas garansi: {farm.warrantyEnd}
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#EFECE6]">
                    <span className="text-[11px] text-stone-500 font-medium">
                      Bonus Kemitraan
                    </span>
                    <p className="text-sm font-bold text-stone-500 mt-1">
                      — Belum memenuhi syarat penilaian
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pending indicator cards */}
          <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFECE6] pb-3">
              <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit'] flex items-center gap-2">
                <Award className="w-6 h-6 text-[#2D4A36]" />
                Rincian Indikator Penilaian
              </h3>
              <span className="text-xs text-stone-500">
                Aktif setelah {MIN_REPORTS} hari data
              </span>
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
                          <h4 className="font-bold text-base text-[#1B3022] font-['Outfit']">
                            {cat.name}
                          </h4>
                          <p className="text-[11px] text-stone-500">{cat.desc}</p>
                        </div>
                      </div>
                      <span className="text-xl font-black text-stone-400">— /100</span>
                    </div>

                    <div className="w-full bg-[#E5E1D8] h-3 rounded-full overflow-hidden" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-8">
            <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit']">
              Lencana & Prestasi Kandang
            </h3>
            <div className="mt-5 p-7 rounded-3xl bg-[#FAF7F2] border border-dashed border-[#D9D4C7] text-center">
              <Award className="w-9 h-9 text-stone-400 mx-auto" />
              <p className="font-bold text-stone-700 mt-3">
                Belum ada lencana yang diraih.
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Lencana akan muncul otomatis setelah syaratnya benar-benar tercapai dari data
                laporan aktual.
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* OFFICIAL SCORE STATE */}
          <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-10 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 bg-[#FAF7F2] rounded-3xl border border-[#EFECE6]">
                <GaugeChart
                  score={farmScore.totalScore}
                  max={100}
                  size={260}
                  label="Indeks Performa Kandang"
                  statusText={farmScore.statusText}
                />

                <div className="flex items-center gap-1.5 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = star <= Math.round(farmScore.totalScore / 20);
                    return (
                      <Star
                        key={star}
                        className={`w-6 h-6 ${
                          filled
                            ? 'fill-[#D4AF37] text-[#D4AF37]'
                            : 'text-stone-300'
                        } drop-shadow-xs`}
                      />
                    );
                  })}
                  <span className="text-xs font-black text-stone-600 ml-2">
                    {(farmScore.totalScore / 20).toFixed(1)} / 5.0 (Bintang Evaluasi)
                  </span>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-[#FEF6E9] text-[#78350F] font-bold border border-[#FDE68A]">
                    🏆
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit']">
                      {tierText}
                    </h3>
                    <p className="text-xs text-stone-500">
                      Kandang {farm.farmCode} ({farm.ownerName}) dievaluasi dari{' '}
                      {reportCount} laporan aktual.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FEF6E9] border border-[#FDE68A] flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#C2841E] text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
                    <Flame className="w-6 h-6 fill-current text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#78350F] uppercase tracking-wider block font-['Outfit']">
                      Streak Pencatatan Aktif
                    </span>
                    <p className="text-base md:text-lg font-black text-[#1B3022] font-['Outfit']">
                      {farmScore.streakDays > 0
                        ? `🔥 ${farmScore.streakDays} hari berturut-turut tercatat`
                        : 'Belum ada streak aktif'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EFECE6]">
                    <span className="text-[11px] text-stone-500 font-medium">
                      Data Evaluasi:
                    </span>
                    <p className="text-sm font-bold text-[#2D4A36]">
                      <CheckCircle2 className="w-4 h-4 inline mr-1" />
                      {reportCount} laporan terverifikasi
                    </p>
                  </div>

                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EFECE6]">
                    <span className="text-[11px] text-stone-500 font-medium">
                      Status Penilaian:
                    </span>
                    <p className="text-sm font-bold text-[#1B3022]">
                      Resmi dari data aktual
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
              <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit'] flex items-center gap-2">
                <Award className="w-6 h-6 text-[#2D4A36]" />
                Rincian Indikator Penilaian
              </h3>
              <span className="text-xs text-stone-500">
                Kalkulasi dari data laporan aktual
              </span>
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
                          <h4 className="font-bold text-base text-[#1B3022] font-['Outfit']">
                            {cat.name}
                          </h4>
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

                    <div className="w-full bg-[#E5E1D8] h-3 rounded-full overflow-hidden p-0.5">
                      <div
                        className="bg-[#2D4A36] h-full rounded-full transition-all duration-700"
                        style={{ width: `${cat.score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-8 space-y-5">
            <div>
              <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit']">
                Lencana & Prestasi Kandang
              </h3>
              <p className="text-xs text-stone-500">
                Apresiasi yang benar-benar diraih oleh kandang {farm.farmCode}
              </p>
            </div>

            {farmScore.badges.length === 0 ? (
              <div className="p-7 rounded-3xl bg-[#FAF7F2] border border-dashed border-[#D9D4C7] text-center">
                <Award className="w-9 h-9 text-stone-400 mx-auto" />
                <p className="font-bold text-stone-700 mt-3">
                  Belum ada lencana yang memenuhi syarat.
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Tingkatkan konsistensi produksi, pelaporan, dan kesehatan kandang.
                </p>
              </div>
            ) : (
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
            )}
          </div>
        </>
      )}
    </div>
  );
};
