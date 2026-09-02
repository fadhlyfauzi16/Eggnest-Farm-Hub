import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { ChickenCondition, IssueType } from '../../types';
import {
  X,
  Plus,
  Minus,
  CheckCircle2,
  Camera,
  Egg,
  Wheat,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChickenHealthPicker, ChickenHealthItem } from './ChickenHealthPicker';

export const QuickReportModal: React.FC = () => {
  const { isQuickReportOpen, setIsQuickReportOpen, addDailyReport, farm } = useFarm();

  const totalChickensCount = farm.activeChickens || 12;

  const [eggCount, setEggCount] = useState<number>(10);
  const [feedKg, setFeedKg] = useState<number>(1.2);
  const [chickenCondition, setChickenCondition] = useState<ChickenCondition>('healthy');
  const [chickensState, setChickensState] = useState<ChickenHealthItem[]>(() =>
    Array.from({ length: totalChickensCount }, (_, i) => ({
      number: i + 1,
      status: 'healthy' as const,
      symptoms: [],
    }))
  );
  const [notes, setNotes] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [lastProductivity, setLastProductivity] = useState<number>(83);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isQuickReportOpen) return null;

  const todayFormatted = 'Senin, 31 Agustus 2026';
  const todayDateKey = '2026-08-31';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Aggregate symptoms across all sick/dead chickens
      let aggregatedIssues: IssueType[] = [];
      if (chickenCondition === 'issue') {
        const symptomsSet = new Set<string>();
        let hasDead = false;
        let hasSick = false;

        chickensState.forEach((ch) => {
          if (ch.status === 'dead') hasDead = true;
          if (ch.status === 'sick') {
            hasSick = true;
            ch.symptoms.forEach((s) => symptomsSet.add(s));
          }
        });

        if (hasSick && symptomsSet.size === 0) {
          symptomsSet.add('Ayam sakit');
        }
        if (hasDead) {
          symptomsSet.add('Ayam mati');
        }

        aggregatedIssues = Array.from(symptomsSet) as IssueType[];
        if (aggregatedIssues.length === 0) {
          aggregatedIssues = ['Ayam sakit'];
        }
      }

      const result = await addDailyReport({
        date: todayDateKey,
        eggCount,
        feedKg,
        chickenCondition,
        issueTypes: chickenCondition === 'issue' ? aggregatedIssues : undefined,
        notes: notes.trim() || undefined,
        photoUrl: photoPreview || undefined,
      });

      const prod =
        result.productivity || Math.round((eggCount / (farm.activeChickens || 12)) * 100);
      setLastProductivity(prod);
      setIsSubmitted(true);

      // Fire celebration confetti
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsQuickReportOpen(false);
    setIsSubmitted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#FDFBF7] rounded-3xl shadow-2xl border border-[#EFECE6] overflow-hidden my-auto max-h-[92dvh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Sticky Header */}
        <div className="bg-[#1B3022] text-[#FDFBF7] px-4 py-3.5 sm:p-5 flex items-center justify-between border-b border-[#2D4A36] shrink-0">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-[#D4AF37] text-[#1B3022] rounded-lg font-bold shrink-0">
                <Egg className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold font-['Outfit'] truncate text-[#FDFBF7]">
                Lapor Hasil Hari Ini
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-[#A3B899] mt-0.5 font-medium truncate">
              {todayFormatted} • Farm ID: {farm.farmCode}
            </p>
          </div>
          <button
            type="button"
            id="close-quick-report-btn"
            onClick={handleClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer shrink-0"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {isSubmitted ? (
            /* Success View */
            <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#EAF2EC] text-[#2D4A36] flex items-center justify-center text-3xl shadow-inner border border-[#CDE3D3]">
                <CheckCircle2 className="w-10 h-10 text-[#2D4A36]" />
              </div>

              <div>
                <span className="inline-block bg-[#EAF2EC] text-[#1B3022] text-[10px] font-black px-3 py-0.5 rounded-full uppercase mb-1.5 border border-[#CDE3D3]">
                  STATUS: BAIK & TERVERIFIKASI
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#1B3022] font-['Outfit']">
                  Laporan Berhasil Disimpan!
                </h3>
                <p className="text-stone-600 text-xs sm:text-sm mt-1">
                  Data produksi dan kesehatan kandang Anda telah tercatat ke server Eggnest.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#F7F4EE] p-3.5 rounded-2xl border border-[#E5E1D8] text-left">
                <div className="p-3 bg-white rounded-xl shadow-2xs border border-[#EFECE6]">
                  <span className="text-[11px] text-stone-500 font-semibold block">
                    Panen Hari Ini
                  </span>
                  <p className="text-2xl font-black text-[#1B3022] mt-0.5 font-['Outfit']">
                    {eggCount} <span className="text-xs font-normal text-stone-600">butir</span>
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl shadow-2xs border border-[#EFECE6]">
                  <span className="text-[11px] text-stone-500 font-semibold block">
                    Produktivitas
                  </span>
                  <p className="text-2xl font-black text-[#2D4A36] mt-0.5 font-['Outfit']">
                    {lastProductivity}%
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="done-quick-report-btn"
                onClick={handleClose}
                className="w-full py-3.5 bg-[#2D4A36] hover:bg-[#1B3022] text-[#FDFBF7] font-extrabold rounded-2xl text-base shadow-md shadow-[#2D4A36]/20 transition-all cursor-pointer"
              >
                Selesai & Kembali ke Beranda
              </button>
            </div>
          ) : (
            /* Input Form */
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Step 1: Telur Hari Ini */}
              <div className="bg-[#F7F4EE] p-3.5 sm:p-4 rounded-2xl border border-[#E5E1D8] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm sm:text-base font-bold text-[#1B3022] flex items-center gap-1.5 font-['Outfit']">
                    <Egg className="w-4 h-4 text-[#D4AF37]" />
                    Telur Hari Ini
                  </label>
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-[#FEF6E9] text-[#78350F] rounded-full border border-[#FDE68A]">
                    Target: 10-12 butir
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3 py-1">
                  <button
                    type="button"
                    id="minus-egg-quick-btn"
                    onClick={() => setEggCount(Math.max(0, eggCount - 1))}
                    className="w-12 h-12 rounded-2xl bg-white border-2 border-[#E5E1D8] hover:border-[#2D4A36] active:bg-[#FAF7F2] text-[#1B3022] font-black text-2xl flex items-center justify-center shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
                    aria-label="Kurangi butir telur"
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <div className="flex-1 max-w-[140px] text-center bg-white py-2 px-3 rounded-2xl border-2 border-[#2D4A36]/30 shadow-inner">
                    <span className="text-3xl sm:text-4xl font-black text-[#1B3022] font-['Outfit'] block leading-none">
                      {eggCount}
                    </span>
                    <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block mt-0.5">
                      butir telur
                    </span>
                  </div>

                  <button
                    type="button"
                    id="plus-egg-quick-btn"
                    onClick={() => setEggCount(eggCount + 1)}
                    className="w-12 h-12 rounded-2xl bg-white border-2 border-[#E5E1D8] hover:border-[#2D4A36] active:bg-[#FAF7F2] text-[#1B3022] font-black text-2xl flex items-center justify-center shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
                    aria-label="Tambah butir telur"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Step 2: Pakan Hari Ini */}
              <div className="bg-[#F7F4EE] p-3.5 sm:p-4 rounded-2xl border border-[#E5E1D8] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm sm:text-base font-bold text-[#1B3022] flex items-center gap-1.5 font-['Outfit']">
                    <Wheat className="w-4 h-4 text-[#588157]" />
                    Pakan Hari Ini
                  </label>
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-[#EAF2EC] text-[#1B3022] rounded-full border border-[#CDE3D3]">
                    Standar: 1,2 kg
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3 py-1">
                  <button
                    type="button"
                    id="minus-feed-quick-btn"
                    onClick={() =>
                      setFeedKg(Math.max(0, Number((feedKg - 0.1).toFixed(1))))
                    }
                    className="w-12 h-12 rounded-2xl bg-white border-2 border-[#E5E1D8] hover:border-[#2D4A36] active:bg-[#FAF7F2] text-[#1B3022] font-black text-2xl flex items-center justify-center shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
                    aria-label="Kurangi takaran pakan"
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <div className="flex-1 max-w-[140px] text-center bg-white py-2 px-3 rounded-2xl border-2 border-[#2D4A36]/30 shadow-inner">
                    <span className="text-3xl sm:text-4xl font-black text-[#1B3022] font-['Outfit'] block leading-none">
                      {feedKg.toString().replace('.', ',')}
                    </span>
                    <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block mt-0.5">
                      kg pakan
                    </span>
                  </div>

                  <button
                    type="button"
                    id="plus-feed-quick-btn"
                    onClick={() =>
                      setFeedKg(Number((feedKg + 0.1).toFixed(1)))
                    }
                    className="w-12 h-12 rounded-2xl bg-white border-2 border-[#E5E1D8] hover:border-[#2D4A36] active:bg-[#FAF7F2] text-[#1B3022] font-black text-2xl flex items-center justify-center shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
                    aria-label="Tambah takaran pakan"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Step 3: Progressive Chicken Health Picker (Mobile-First UX) */}
              <ChickenHealthPicker
                totalChickens={totalChickensCount}
                chickenCondition={chickenCondition}
                onConditionChange={setChickenCondition}
                chickens={chickensState}
                onChangeChickens={setChickensState}
              />

              {/* Step 4: Catatan Tambahan (Opsional, Default 2-3 baris) */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#1B3022] mb-1">
                  Catatan Tambahan <span className="text-stone-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  id="quick-report-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tuliskan catatan jika diperlukan..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E5E1D8] focus:outline-none focus:ring-2 focus:ring-[#2D4A36] text-xs sm:text-sm bg-white text-[#1B3022]"
                />
              </div>

              {/* Step 5: Foto Kondisi (Opsional) */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#1B3022] mb-1">
                  Foto Kondisi Kandang / Ayam{' '}
                  <span className="text-stone-400 font-normal">(Opsional)</span>
                </label>
                <label className="border-2 border-dashed border-[#E5E1D8] hover:border-[#2D4A36] rounded-2xl p-3 flex flex-col items-center justify-center cursor-pointer bg-white hover:bg-[#FAF7F2] transition-all">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  {photoPreview ? (
                    <div className="relative w-full h-28 rounded-xl overflow-hidden shadow-xs">
                      <img
                        src={photoPreview}
                        alt="Preview kandang"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-[11px] font-bold">
                        Sentuh untuk mengganti foto
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-1 text-stone-500">
                      <Camera className="w-5 h-5 text-[#588157]" />
                      <span className="text-xs font-bold text-[#1B3022]">
                        Ambil Foto atau Unggah Galeri
                      </span>
                    </div>
                  )}
                </label>
              </div>

              {/* Step 6: Sticky / Prominent Submit Button */}
              <div className="pt-2 sticky bottom-0 bg-[#FDFBF7] pb-1">
                <button
                  type="submit"
                  id="submit-quick-report-btn"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#2D4A36] hover:bg-[#1B3022] active:bg-[#15251a] text-[#FDFBF7] font-black rounded-2xl text-base sm:text-lg shadow-md shadow-[#2D4A36]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
                  <span>{isSubmitting ? 'MENYIMPAN...' : 'SIMPAN LAPORAN'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

