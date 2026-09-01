import React, { useState, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { ChickenCondition, ChickenHealthStatus, ChickenProblemType, IssueType } from '../../types';
import {
  X,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Camera,
  Egg,
  Wheat,
  Sparkles,
  HeartPulse,
  Activity,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChickenReportItem {
  chickenId: string;
  chickenNumber: number;
  condition: 'HEALTHY' | 'SICK' | 'DEAD';
  problemTypes: string[];
  customNotes?: string;
}

const COMMON_SYMPTOMS: ChickenProblemType[] = [
  'Tidak mau makan',
  'Lemas / Sayap Turun',
  'Feses Cair / Putih / Hijau',
  'Mata Berbusa / Bengkak',
  'Lumpuh / Sulit Berdiri',
  'Nafas Ngorok / Sesak',
  'Bulu Rontok Ekstrem',
  'Ayam sakit',
  'Ayam mati',
  'Lainnya',
];

export const QuickReportModal: React.FC = () => {
  const { isQuickReportOpen, setIsQuickReportOpen, addDailyReport, farm, chickens } = useFarm();

  const [eggCount, setEggCount] = useState<number>(10);
  const [feedKg, setFeedKg] = useState<number>(1.2);
  const [chickenCondition, setChickenCondition] = useState<ChickenCondition>('healthy');
  const [chickenReportsState, setChickenReportsState] = useState<ChickenReportItem[]>([]);
  const [activeEditingChickenNum, setActiveEditingChickenNum] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [lastProductivity, setLastProductivity] = useState<number>(83);

  // Initialize chicken reports state whenever chickens or modal open changes
  useEffect(() => {
    if (isQuickReportOpen) {
      const initialCount = farm.initialChickens || 12;
      const initialList: ChickenReportItem[] = [];

      for (let i = 1; i <= initialCount; i++) {
        const found = chickens.find((c) => c.chickenNumber === i);
        const isDead = found?.status === 'DEAD';
        const isSick = found?.status === 'SICK';
        initialList.push({
          chickenId: found?.id || `chk-${farm.id}-${i}`,
          chickenNumber: i,
          condition: isDead ? 'DEAD' : isSick ? 'SICK' : 'HEALTHY',
          problemTypes: isSick ? ['Ayam sakit'] : isDead ? ['Ayam mati'] : [],
          customNotes: '',
        });
      }

      setChickenReportsState(initialList);
      setActiveEditingChickenNum(null);
      setEggCount(farm.activeChickens ? Math.min(10, farm.activeChickens) : 10);
      setChickenCondition('healthy');
      setNotes('');
      setPhotoPreview(null);
      setIsSubmitted(false);
    }
  }, [isQuickReportOpen, farm, chickens]);

  if (!isQuickReportOpen) return null;

  const todayFormatted = 'Senin, 31 Agustus 2026';
  const todayDateKey = '2026-08-31';

  // Toggle symptom for active chicken
  const handleToggleSymptom = (chickenNum: number, symptom: string) => {
    setChickenReportsState((prev) =>
      prev.map((item) => {
        if (item.chickenNumber !== chickenNum) return item;
        const exists = item.problemTypes.includes(symptom);
        const updatedProblems = exists
          ? item.problemTypes.filter((p) => p !== symptom)
          : [...item.problemTypes, symptom];

        let newCond: 'HEALTHY' | 'SICK' | 'DEAD' = item.condition;
        if (symptom === 'Ayam mati') {
          newCond = !exists ? 'DEAD' : updatedProblems.length > 0 ? 'SICK' : 'HEALTHY';
        } else if (updatedProblems.length > 0 && newCond !== 'DEAD') {
          newCond = 'SICK';
        } else if (updatedProblems.length === 0) {
          newCond = 'HEALTHY';
        }

        return {
          ...item,
          condition: newCond,
          problemTypes: updatedProblems,
        };
      })
    );
  };

  // Change condition directly for active chicken
  const handleSetChickenCondition = (chickenNum: number, cond: 'HEALTHY' | 'SICK' | 'DEAD') => {
    setChickenReportsState((prev) =>
      prev.map((item) => {
        if (item.chickenNumber !== chickenNum) return item;
        let probs = [...item.problemTypes];
        if (cond === 'HEALTHY') {
          probs = [];
        } else if (cond === 'DEAD' && !probs.includes('Ayam mati')) {
          probs = [...probs, 'Ayam mati'];
        } else if (cond === 'SICK' && probs.length === 0) {
          probs = ['Ayam sakit'];
        }
        return {
          ...item,
          condition: cond,
          problemTypes: probs,
        };
      })
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Summary counts
  const healthyCount = chickenReportsState.filter((c) => c.condition === 'HEALTHY').length;
  const sickCount = chickenReportsState.filter((c) => c.condition === 'SICK').length;
  const deadCount = chickenReportsState.filter((c) => c.condition === 'DEAD').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare overall issue types for backwards compatibility
    const overallIssues: IssueType[] = [];
    chickenReportsState.forEach((c) => {
      c.problemTypes.forEach((p) => {
        if (!overallIssues.includes(p as IssueType)) {
          overallIssues.push(p as IssueType);
        }
      });
    });

    const isIssue = chickenCondition === 'issue' || sickCount > 0 || deadCount > 0;

    const result = await addDailyReport({
      date: todayDateKey,
      eggCount,
      feedKg,
      chickenCondition: isIssue ? 'issue' : 'healthy',
      issueTypes: isIssue && overallIssues.length > 0 ? overallIssues : undefined,
      notes,
      photoUrl: photoPreview || undefined,
      chickenReports: isIssue ? chickenReportsState : undefined,
    });

    setLastProductivity(result.productivity);
    setIsSubmitted(true);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#2D6A4F', '#52B788', '#E9C46A', '#FFE6A7'],
      });
    } catch {
      // ignore
    }
  };

  const handleClose = () => {
    setIsQuickReportOpen(false);
    setIsSubmitted(false);
  };

  const activeChickenData = chickenReportsState.find(
    (c) => c.chickenNumber === activeEditingChickenNum
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto w-full">
      <div className="relative w-full max-w-xl bg-[#FDFBF7] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#EFECE6] overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#1B3022] text-[#FDFBF7] p-4 sm:p-5 flex items-center justify-between border-b border-[#2D4A36] shrink-0">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#D4AF37] text-[#1B3022] rounded-xl font-bold shrink-0">
                <Egg className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold font-['Outfit'] truncate">
                Lapor Hasil Hari Ini
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#A3B899] mt-0.5 font-medium truncate">
              {todayFormatted} • {farm.farmCode}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer shrink-0"
            aria-label="Tutup modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {isSubmitted ? (
            /* Success View */
            <div className="text-center py-6 space-y-5">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#EAF2EC] text-[#2D4A36] flex items-center justify-center text-4xl shadow-inner border border-[#CDE3D3]">
                <CheckCircle2 className="w-12 h-12 text-[#2D4A36]" />
              </div>

              <div>
                <span className="inline-block bg-[#EAF2EC] text-[#1B3022] text-xs font-bold px-3 py-1 rounded-full uppercase mb-2 border border-[#CDE3D3]">
                  Status Laporan: TERVERIFIKASI
                </span>
                <h3 className="text-2xl font-bold text-[#1B3022] font-['Outfit']">
                  Laporan berhasil disimpan!
                </h3>
                <p className="text-stone-600 text-sm mt-1">
                  Data produksi dan kesehatan ayam individu telah dicatat ke database.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#F7F4EE] p-4 rounded-2xl border border-[#E5E1D8] text-left">
                <div className="p-3 bg-white rounded-xl shadow-xs border border-[#EFECE6]">
                  <span className="text-xs text-stone-500 font-medium block">Produksi Hari Ini</span>
                  <p className="text-2xl font-black text-[#1B3022] mt-0.5 font-['Outfit']">
                    {eggCount} <span className="text-sm font-normal text-stone-600">butir</span>
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl shadow-xs border border-[#EFECE6]">
                  <span className="text-xs text-stone-500 font-medium block">Produktivitas</span>
                  <p className="text-2xl font-black text-[#2D4A36] mt-0.5 font-['Outfit']">
                    {lastProductivity}%
                  </p>
                </div>
              </div>

              {/* Chicken condition summary badge */}
              <div className="p-3.5 bg-white rounded-xl border border-[#E5E1D8] text-xs text-stone-700 flex items-center justify-between">
                <span className="font-semibold text-stone-800">Status Ayam:</span>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold rounded-md border border-emerald-200">
                    {healthyCount} Sehat
                  </span>
                  {sickCount > 0 && (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold rounded-md border border-amber-200">
                      {sickCount} Sakit
                    </span>
                  )}
                  {deadCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-800 font-bold rounded-md border border-rose-200">
                      {deadCount} Mati
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-3.5 sm:py-4 bg-[#2D4A36] hover:bg-[#1B3022] text-[#FDFBF7] font-bold rounded-2xl text-base sm:text-lg shadow-md shadow-[#2D4A36]/20 transition-all cursor-pointer"
              >
                Selesai & Kembali ke Beranda
              </button>
            </div>
          ) : (
            /* Input Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Step 1: Telur Hari Ini */}
              <div className="bg-[#F7F4EE] p-4 sm:p-5 rounded-2xl border border-[#E5E1D8]">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm sm:text-base font-bold text-[#1B3022] flex items-center gap-2">
                    <Egg className="w-5 h-5 text-[#D4AF37]" />
                    Telur Hari Ini
                  </label>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-[#FEF6E9] text-[#78350F] rounded-full border border-[#FDE68A]">
                    Target: {farm.activeChickens ? `${Math.round(farm.activeChickens * 0.8)}-${farm.activeChickens}` : '10-12'} butir
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setEggCount(Math.max(0, eggCount - 1))}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border-2 border-[#E5E1D8] hover:border-[#2D4A36] active:bg-[#FAF7F2] text-[#1B3022] font-black text-2xl flex items-center justify-center shadow-xs transition-all cursor-pointer"
                  >
                    <Minus className="w-6 h-6" />
                  </button>

                  <div className="min-w-[110px] sm:min-w-[130px] text-center bg-white py-2 sm:py-2.5 px-3 rounded-2xl border border-[#E5E1D8] shadow-inner">
                    <span className="text-3xl sm:text-4xl font-black text-[#1B3022] font-['Outfit'] block leading-none">
                      {eggCount}
                    </span>
                    <span className="text-[11px] sm:text-xs text-stone-500 font-semibold uppercase tracking-wider">
                      butir telur
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEggCount(eggCount + 1)}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border-2 border-[#E5E1D8] hover:border-[#2D4A36] active:bg-[#FAF7F2] text-[#1B3022] font-black text-2xl flex items-center justify-center shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Step 2: Pakan Hari Ini */}
              <div className="bg-[#F7F4EE] p-4 sm:p-5 rounded-2xl border border-[#E5E1D8]">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm sm:text-base font-bold text-[#1B3022] flex items-center gap-2">
                    <Wheat className="w-5 h-5 text-[#588157]" />
                    Pakan Hari Ini
                  </label>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-[#EAF2EC] text-[#1B3022] rounded-full border border-[#CDE3D3]">
                    Standar 12 ayam: 1,2 kg
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setFeedKg(Math.max(0, Number((feedKg - 0.1).toFixed(1))))}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border-2 border-[#E5E1D8] hover:border-[#2D4A36] active:bg-[#FAF7F2] text-[#1B3022] font-black text-2xl flex items-center justify-center shadow-xs transition-all cursor-pointer"
                  >
                    <Minus className="w-6 h-6" />
                  </button>

                  <div className="min-w-[110px] sm:min-w-[130px] text-center bg-white py-2 sm:py-2.5 px-3 rounded-2xl border border-[#E5E1D8] shadow-inner">
                    <span className="text-3xl sm:text-4xl font-black text-[#1B3022] font-['Outfit'] block leading-none">
                      {feedKg.toString().replace('.', ',')}
                    </span>
                    <span className="text-[11px] sm:text-xs text-stone-500 font-semibold uppercase tracking-wider">
                      Kilogram (kg)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFeedKg(Number((feedKg + 0.1).toFixed(1)))}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border-2 border-[#E5E1D8] hover:border-[#2D4A36] active:bg-[#FAF7F2] text-[#1B3022] font-black text-2xl flex items-center justify-center shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Step 3: Kondisi Kesehatan Ayam (Individual Chicken Health) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E1D8] space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm sm:text-base font-bold text-[#1B3022] flex items-center gap-2 font-['Outfit']">
                    <HeartPulse className="w-5 h-5 text-emerald-700" />
                    Kondisi Kesehatan Ayam
                  </label>
                  <span className="text-xs font-medium text-stone-500">
                    Total: {farm.initialChickens || 12} Ekor
                  </span>
                </div>

                {/* Mode Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setChickenCondition('healthy');
                      setActiveEditingChickenNum(null);
                      setChickenReportsState((prev) =>
                        prev.map((c) => ({
                          ...c,
                          condition: c.condition === 'DEAD' ? 'DEAD' : 'HEALTHY',
                          problemTypes: c.condition === 'DEAD' ? ['Ayam mati'] : [],
                        }))
                      );
                    }}
                    className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      chickenCondition === 'healthy' && sickCount === 0 && deadCount === 0
                        ? 'border-[#2D4A36] bg-[#EAF2EC] text-[#1B3022] shadow-xs ring-2 ring-[#2D4A36]/20'
                        : 'border-[#E5E1D8] bg-[#FDFBF7] text-stone-700 hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <span className="text-2xl">✅</span>
                    <span className="font-bold text-sm sm:text-base">Semua Sehat</span>
                    <span className="text-[11px] text-stone-500 text-center leading-tight">
                      Aktif & nafsu makan normal
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setChickenCondition('issue');
                      if (activeEditingChickenNum === null) {
                        setActiveEditingChickenNum(1);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      chickenCondition === 'issue' || sickCount > 0 || deadCount > 0
                        ? 'border-[#C2841E] bg-[#FEF6E9] text-[#78350F] shadow-xs ring-2 ring-[#C2841E]/20'
                        : 'border-[#E5E1D8] bg-[#FDFBF7] text-stone-700 hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <span className="text-2xl">⚠️</span>
                    <span className="font-bold text-sm sm:text-base">Ada Masalah</span>
                    <span className="text-[11px] text-stone-500 text-center leading-tight">
                      Pilih ayam yang sakit / mati
                    </span>
                  </button>
                </div>

                {/* Individual Chicken Grid when "Ada Masalah" is selected */}
                {(chickenCondition === 'issue' || sickCount > 0 || deadCount > 0) && (
                  <div className="p-3.5 sm:p-4 bg-[#FAF7F2] rounded-2xl border border-[#E5E1D8] space-y-3.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                        <span>Pilih Ayam untuk Dicatat:</span>
                      </div>
                      <div className="flex gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                          {healthyCount} Sehat
                        </span>
                        {sickCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                            {sickCount} Sakit
                          </span>
                        )}
                        {deadCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                            {deadCount} Mati
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Chicken Grid Buttons */}
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {chickenReportsState.map((chk) => {
                        const isSelected = activeEditingChickenNum === chk.chickenNumber;
                        const isSick = chk.condition === 'SICK';
                        const isDead = chk.condition === 'DEAD';

                        let bgStyle = 'bg-white border-[#E5E1D8] text-stone-800 hover:border-stone-400';
                        if (isDead) {
                          bgStyle = isSelected
                            ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-300'
                            : 'bg-rose-50 border-rose-300 text-rose-900';
                        } else if (isSick) {
                          bgStyle = isSelected
                            ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-300'
                            : 'bg-amber-50 border-amber-300 text-amber-900';
                        } else if (isSelected) {
                          bgStyle = 'bg-[#2D4A36] text-white border-[#2D4A36] ring-2 ring-[#2D4A36]/30';
                        }

                        return (
                          <button
                            key={chk.chickenNumber}
                            type="button"
                            onClick={() => setActiveEditingChickenNum(chk.chickenNumber)}
                            className={`p-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer flex flex-col items-center justify-center ${bgStyle}`}
                          >
                            <span className="text-xs">Ayam</span>
                            <span className="text-lg font-black font-['Outfit'] leading-tight">
                              #{chk.chickenNumber}
                            </span>
                            <span className="text-[10px] uppercase font-bold mt-0.5">
                              {isDead ? 'Mati' : isSick ? 'Sakit' : 'Sehat'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Specific Chicken Detail Panel */}
                    {activeEditingChickenNum !== null && activeChickenData && (
                      <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-xs space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-[#1B3022] text-white font-bold text-xs flex items-center justify-center">
                              #{activeChickenData.chickenNumber}
                            </span>
                            <span className="font-bold text-sm text-[#1B3022]">
                              Status Ayam #{activeChickenData.chickenNumber}
                            </span>
                          </div>

                          {/* Status Radios */}
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleSetChickenCondition(activeChickenData.chickenNumber, 'HEALTHY')
                              }
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                activeChickenData.condition === 'HEALTHY'
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                              }`}
                            >
                              Sehat
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleSetChickenCondition(activeChickenData.chickenNumber, 'SICK')
                              }
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                activeChickenData.condition === 'SICK'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                              }`}
                            >
                              Sakit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleSetChickenCondition(activeChickenData.chickenNumber, 'DEAD')
                              }
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                activeChickenData.condition === 'DEAD'
                                  ? 'bg-rose-700 text-white shadow-xs'
                                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                              }`}
                            >
                              Mati
                            </button>
                          </div>
                        </div>

                        {/* Symptom Checklist if not healthy */}
                        {activeChickenData.condition !== 'HEALTHY' && (
                          <div className="space-y-2">
                            <span className="text-xs font-semibold text-stone-700 block">
                              Pilih Gejala / Masalah Ayam #{activeChickenData.chickenNumber}:
                            </span>
                            <div className="grid grid-cols-2 gap-1.5">
                              {COMMON_SYMPTOMS.map((sym) => {
                                const isChecked = activeChickenData.problemTypes.includes(sym);
                                return (
                                  <button
                                    key={sym}
                                    type="button"
                                    onClick={() =>
                                      handleToggleSymptom(activeChickenData.chickenNumber, sym)
                                    }
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-all flex items-center justify-between ${
                                      isChecked
                                        ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                                    }`}
                                  >
                                    <span className="truncate">{sym}</span>
                                    {isChecked && <Check className="w-3.5 h-3.5 text-amber-700 shrink-0 ml-1" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 4: Catatan (Optional) */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-stone-700 mb-1.5">
                  Catatan Tambahan <span className="text-stone-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Pemberian vitamin tambahan pagi hari, kandang baru dibersihkan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] focus:outline-none focus:ring-2 focus:ring-[#2D4A36] text-sm bg-white"
                />
              </div>

              {/* Step 5: Foto Kondisi */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-stone-700 mb-1.5">
                  Foto Kondisi Kandang / Ayam <span className="text-stone-400 font-normal">(JPG/PNG maks 5MB)</span>
                </label>
                <label className="border-2 border-dashed border-[#E5E1D8] hover:border-[#2D4A36] rounded-2xl p-3.5 sm:p-4 flex flex-col items-center justify-center cursor-pointer bg-white hover:bg-[#FAF7F2] transition-all">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  {photoPreview ? (
                    <div className="relative w-full h-32 sm:h-36 rounded-xl overflow-hidden">
                      <img
                        src={photoPreview}
                        alt="Preview kandang"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xs font-semibold">
                        Klik untuk ganti foto
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-stone-500 py-1.5 text-center">
                      <Camera className="w-7 h-7 text-[#588157] mb-1" />
                      <span className="text-xs sm:text-sm font-semibold text-[#1B3022]">
                        Ambil Foto atau Unggah dari Galeri
                      </span>
                      <span className="text-[11px] text-stone-400">Sentuh untuk memilih foto</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 sm:py-4 bg-[#2D4A36] hover:bg-[#1B3022] text-[#FDFBF7] font-bold rounded-2xl text-base sm:text-lg shadow-md shadow-[#2D4A36]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                SIMPAN LAPORAN
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
