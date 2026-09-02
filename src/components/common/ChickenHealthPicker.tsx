import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  X,
  Plus,
  Check,
  Heart,
  Skull,
  Activity,
  AlertCircle,
} from 'lucide-react';

export const CHICKEN_SYMPTOMS = [
  { id: 'Tidak mau makan', label: 'Tidak Mau Makan', icon: '🍽' },
  { id: 'Lemas / Sayap Turun', label: 'Lemas / Sayap Turun', icon: '🪽' },
  { id: 'Feses Cair / Berubah', label: 'Feses Cair / Berubah', icon: '💧' },
  { id: 'Mata Berbusa', label: 'Mata Berbusa', icon: '👁' },
  { id: 'Lumpuh / Sulit Jalan', label: 'Lumpuh / Sulit Jalan', icon: '🦵' },
  { id: 'Nafas Ngorok', label: 'Nafas Ngorok', icon: '💨' },
  { id: 'Bulu Rontok', label: 'Bulu Rontok', icon: '🪶' },
  { id: 'Masalah Bertelur', label: 'Masalah Bertelur', icon: '🥚' },
  { id: 'Luka / Cedera', label: 'Luka / Cedera', icon: '🩹' },
  { id: 'Lainnya', label: 'Lainnya', icon: '💬' },
];

export interface ChickenHealthItem {
  number: number;
  status: 'healthy' | 'sick' | 'dead';
  symptoms: string[];
}

interface ChickenHealthPickerProps {
  totalChickens?: number;
  chickenCondition: 'healthy' | 'issue';
  onConditionChange: (cond: 'healthy' | 'issue') => void;
  chickens: ChickenHealthItem[];
  onChangeChickens: (chickens: ChickenHealthItem[]) => void;
}

export const ChickenHealthPicker: React.FC<ChickenHealthPickerProps> = ({
  totalChickens = 12,
  chickenCondition,
  onConditionChange,
  chickens,
  onChangeChickens,
}) => {
  const [selectedChickenNum, setSelectedChickenNum] = useState<number>(1);
  const [isSymptomSheetOpen, setIsSymptomSheetOpen] = useState<boolean>(false);
  const [confirmDeadModalNum, setConfirmDeadModalNum] = useState<number | null>(null);

  // Ensure all chickens exist in the state
  const chickenList: ChickenHealthItem[] = React.useMemo(() => {
    const list: ChickenHealthItem[] = [];
    for (let i = 1; i <= totalChickens; i++) {
      const existing = chickens.find((c) => c.number === i);
      if (existing) {
        list.push(existing);
      } else {
        list.push({ number: i, status: 'healthy', symptoms: [] });
      }
    }
    return list;
  }, [chickens, totalChickens]);

  const activeChicken =
    chickenList.find((c) => c.number === selectedChickenNum) || chickenList[0] || {
      number: 1,
      status: 'healthy',
      symptoms: [],
    };

  // Helper to update a specific chicken's state
  const updateChicken = (num: number, updates: Partial<ChickenHealthItem>) => {
    const updated = chickenList.map((c) => (c.number === num ? { ...c, ...updates } : c));
    onChangeChickens(updated);
  };

  // Handle Overall Condition Selection
  const handleSelectCondition = (condition: 'healthy' | 'issue') => {
    onConditionChange(condition);
    if (condition === 'healthy') {
      // Reset all chickens to healthy with no symptoms
      const reset = chickenList.map((c) => ({
        ...c,
        status: 'healthy' as const,
        symptoms: [],
      }));
      onChangeChickens(reset);
    } else {
      // If switched to issue, default active chicken to #1
      setSelectedChickenNum(1);
    }
  };

  // Handle setting active chicken status
  const handleStatusChange = (status: 'healthy' | 'sick' | 'dead') => {
    if (status === 'dead') {
      setConfirmDeadModalNum(selectedChickenNum);
    } else if (status === 'healthy') {
      updateChicken(selectedChickenNum, { status: 'healthy', symptoms: [] });
    } else if (status === 'sick') {
      updateChicken(selectedChickenNum, { status: 'sick' });
    }
  };

  // Confirm chicken dead
  const handleConfirmDead = () => {
    if (confirmDeadModalNum !== null) {
      updateChicken(confirmDeadModalNum, { status: 'dead', symptoms: [] });
      setConfirmDeadModalNum(null);
    }
  };

  // Toggle symptom in Bottom Sheet
  const handleToggleSymptom = (symptomId: string) => {
    const currentSymptoms = activeChicken.symptoms || [];
    let nextSymptoms: string[];
    if (currentSymptoms.includes(symptomId)) {
      nextSymptoms = currentSymptoms.filter((s) => s !== symptomId);
    } else {
      nextSymptoms = [...currentSymptoms, symptomId];
    }
    updateChicken(selectedChickenNum, { symptoms: nextSymptoms });
  };

  // Count summary
  const sickCount = chickenList.filter((c) => c.status === 'sick').length;
  const deadCount = chickenList.filter((c) => c.status === 'dead').length;

  return (
    <div className="space-y-4 w-full">
      {/* 1. KONDISI UMUM KANDANG */}
      <div>
        <label className="block text-sm md:text-base font-bold text-[#1B3022] mb-2 font-['Outfit']">
          Kondisi Umum Kandang
        </label>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full">
          {/* Option 1: Aman & Sehat */}
          <button
            type="button"
            id="condition-healthy-btn"
            onClick={() => handleSelectCondition('healthy')}
            className={`p-3.5 sm:p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center w-full min-w-0 ${
              chickenCondition === 'healthy'
                ? 'border-[#2D4A36] bg-[#EAF2EC] text-[#1B3022] shadow-xs ring-2 ring-[#2D4A36]/20'
                : 'border-[#E5E1D8] bg-white text-stone-700 hover:bg-[#FAF7F2]'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#2D4A36]/10 text-[#2D4A36] flex items-center justify-center font-black text-base">
              ✓
            </div>
            <div className="w-full min-w-0">
              <span className="font-extrabold text-xs sm:text-sm text-[#1B3022] block tracking-tight">
                AMAN & SEHAT
              </span>
              <span className="text-[11px] sm:text-xs text-stone-600 block mt-0.5 leading-snug">
                Aktif & nafsu makan normal
              </span>
            </div>
          </button>

          {/* Option 2: Perlu Perhatian */}
          <button
            type="button"
            id="condition-issue-btn"
            onClick={() => handleSelectCondition('issue')}
            className={`p-3.5 sm:p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center w-full min-w-0 ${
              chickenCondition === 'issue'
                ? 'border-[#C2841E] bg-[#FEF6E9] text-[#78350F] shadow-xs ring-2 ring-[#C2841E]/20'
                : 'border-[#E5E1D8] bg-white text-stone-700 hover:bg-[#FAF7F2]'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#C2841E]/15 text-[#C2841E] flex items-center justify-center font-black text-base">
              !
            </div>
            <div className="w-full min-w-0">
              <span className="font-extrabold text-xs sm:text-sm text-[#78350F] block tracking-tight">
                PERLU PERHATIAN
              </span>
              <span className="text-[11px] sm:text-xs text-stone-600 block mt-0.5 leading-snug">
                Ada ayam sakit / mati
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. PROGRESSIVE DISCLOSURE: DETAIL AYAM JIKA "PERLU PERHATIAN" */}
      {chickenCondition === 'issue' && (
        <div className="p-4 sm:p-5 bg-[#FAF7F2] rounded-3xl border border-[#E5E1D8] space-y-4 animate-in fade-in zoom-in-95 duration-200 w-full">
          {/* Header Section Pilih Ayam */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block font-['Outfit']">
                PILIH AYAM UNTUK DIPERIKSA
              </span>
              <p className="text-xs text-stone-600 mt-0.5">
                Sentuh nomor ayam untuk mencatat kondisinya
              </p>
            </div>
            {(sickCount > 0 || deadCount > 0) && (
              <div className="flex items-center gap-1.5">
                {sickCount > 0 && (
                  <span className="px-2 py-0.5 bg-[#FEF6E9] text-[#78350F] text-[10px] font-bold rounded-md border border-[#FDE68A]">
                    {sickCount} Sakit
                  </span>
                )}
                {deadCount > 0 && (
                  <span className="px-2 py-0.5 bg-[#FDF2F2] text-[#991B1B] text-[10px] font-bold rounded-md border border-[#FCA5A5]">
                    {deadCount} Mati
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Grid Ayam 4 Kolom di Mobile */}
          <div className="grid grid-cols-4 gap-2 w-full">
            {chickenList.map((ch) => {
              const isSelected = ch.number === selectedChickenNum;
              const isSick = ch.status === 'sick';
              const isDead = ch.status === 'dead';

              let badgeStyle =
                'bg-white border-[#E5E1D8] text-stone-700 hover:border-[#2D4A36]/60';
              let statusText = 'Sehat';
              let statusBadgeColor = 'text-[#2D6A4F] bg-[#EAF2EC]';

              if (isDead) {
                badgeStyle = 'bg-[#FDF2F2] border-[#FCA5A5] text-[#991B1B]';
                statusText = 'Mati';
                statusBadgeColor = 'text-[#991B1B] bg-[#FEE2E2]';
              } else if (isSick) {
                badgeStyle = 'bg-[#FEF6E9] border-[#FDE68A] text-[#78350F]';
                statusText = 'Sakit';
                statusBadgeColor = 'text-[#78350F] bg-[#FEF3C7]';
              }

              return (
                <button
                  key={ch.number}
                  type="button"
                  id={`chicken-grid-btn-${ch.number}`}
                  onClick={() => setSelectedChickenNum(ch.number)}
                  className={`min-h-[58px] p-2 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer relative min-w-0 ${badgeStyle} ${
                    isSelected
                      ? 'ring-2 ring-[#2D4A36] border-[#2D4A36] shadow-sm scale-[1.02]'
                      : 'opacity-90 hover:opacity-100'
                  }`}
                >
                  <span className="text-sm font-black font-['Outfit'] block leading-none">
                    #{ch.number}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md mt-1 block leading-tight ${statusBadgeColor}`}
                  >
                    {statusText}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 3. STATUS AYAM TERPILIH (🐔 Status Ayam #X) */}
          <div className="pt-2 border-t border-[#E5E1D8] space-y-3 w-full">
            {/* Judul Satu Baris Jelas */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-extrabold text-[#1B3022] flex items-center gap-1.5 font-['Outfit']">
                <span>🐔</span> Status Ayam #{activeChicken.number}
              </h4>
              <span className="text-[11px] text-stone-500 font-medium">
                Pilih kondisi di bawah:
              </span>
            </div>

            {/* 3 Button Besar (1 Row, Grid 3 Kolom) */}
            <div
              className="grid gap-2 w-full"
              style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
            >
              {/* Button Sehat */}
              <button
                type="button"
                id={`status-healthy-btn-${activeChicken.number}`}
                onClick={() => handleStatusChange('healthy')}
                className={`w-full min-w-0 py-3 px-1 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 font-extrabold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 ${
                  activeChicken.status === 'healthy'
                    ? 'bg-[#EAF2EC] border-[#2D4A36] text-[#1B3022] shadow-xs'
                    : 'bg-white border-[#E5E1D8] text-stone-600 hover:bg-[#FAF7F2]'
                }`}
              >
                <span className="text-base leading-none">✓</span>
                <span className="leading-tight">Sehat</span>
              </button>

              {/* Button Sakit */}
              <button
                type="button"
                id={`status-sick-btn-${activeChicken.number}`}
                onClick={() => handleStatusChange('sick')}
                className={`w-full min-w-0 py-3 px-1 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 font-extrabold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 ${
                  activeChicken.status === 'sick'
                    ? 'bg-[#FEF6E9] border-[#C2841E] text-[#78350F] shadow-xs'
                    : 'bg-white border-[#E5E1D8] text-stone-600 hover:bg-[#FAF7F2]'
                }`}
              >
                <span className="text-base leading-none">!</span>
                <span className="leading-tight">Sakit</span>
              </button>

              {/* Button Mati */}
              <button
                type="button"
                id={`status-dead-btn-${activeChicken.number}`}
                onClick={() => handleStatusChange('dead')}
                className={`w-full min-w-0 py-3 px-1 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 font-extrabold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 ${
                  activeChicken.status === 'dead'
                    ? 'bg-[#FDF2F2] border-[#DC2626] text-[#991B1B] shadow-xs'
                    : 'bg-white border-[#E5E1D8] text-stone-600 hover:bg-[#FAF7F2]'
                }`}
              >
                <span className="text-base leading-none">✕</span>
                <span className="leading-tight">Mati</span>
              </button>
            </div>

            {/* 4. COLLAPSIBLE GEJALA JIKA STATUS SAKIT */}
            {activeChicken.status === 'sick' && (
              <div className="pt-1 w-full animate-in fade-in duration-150">
                {activeChicken.symptoms && activeChicken.symptoms.length > 0 ? (
                  /* Action card ketika sudah ada gejala dipilih */
                  <button
                    type="button"
                    id="open-symptoms-btn-edit"
                    onClick={() => setIsSymptomSheetOpen(true)}
                    className="w-full p-3 rounded-2xl bg-white border-2 border-[#C2841E]/40 hover:border-[#C2841E] flex items-center justify-between text-left transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-[#C2841E] shrink-0" />
                        <span className="text-xs font-bold text-[#78350F] truncate">
                          Gejala Ayam #{activeChicken.number} ({activeChicken.symptoms.length}{' '}
                          dipilih)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {activeChicken.symptoms.map((symId) => {
                          const symObj = CHICKEN_SYMPTOMS.find((s) => s.id === symId);
                          return (
                            <span
                              key={symId}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FEF6E9] text-[#78350F] text-[11px] font-semibold rounded-md border border-[#FDE68A]"
                            >
                              <span>{symObj?.icon || '•'}</span>
                              <span>{symObj?.label || symId}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-[#C2841E] group-hover:translate-x-0.5 transition-transform">
                      <span>Ubah</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                ) : (
                  /* Action card ketika belum memilih gejala */
                  <button
                    type="button"
                    id="open-symptoms-btn-new"
                    onClick={() => setIsSymptomSheetOpen(true)}
                    className="w-full p-3.5 rounded-2xl bg-[#FEF6E9] border-2 border-dashed border-[#C2841E] hover:bg-[#FEF3C7] flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-[#C2841E] text-white flex items-center justify-center font-bold text-xs">
                        !
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-[#78350F] block">
                          Pilih Gejala / Masalah Ayam #{activeChicken.number}
                        </span>
                        <span className="text-[11px] text-stone-600 block">
                          Sentuh untuk menandai gejala yang teramati
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 p-1 rounded-lg bg-white/80 text-[#78350F] group-hover:translate-x-0.5 transition-transform">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. BOTTOM SHEET / MODAL PILIH GEJALA (MOBILE-FIRST) */}
      {/* ========================================================================= */}
      {isSymptomSheetOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#FDFBF7] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#EFECE6] overflow-hidden flex flex-col max-h-[88dvh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            {/* Header Bottom Sheet */}
            <div className="p-4 sm:p-5 bg-[#1B3022] text-[#FDFBF7] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold font-['Outfit'] flex items-center gap-1.5 text-[#FDFBF7]">
                  <span>⚠</span> Gejala Ayam #{activeChicken.number}
                </h3>
                <p className="text-xs text-[#A3B899] mt-0.5">
                  Pilih satu atau beberapa gejala yang teramati
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSymptomSheetOpen(false)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                aria-label="Tutup Pilihan Gejala"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body: Daftar Gejala Lengkap (Multi Select, Anti-Ellipsis, 2 baris wrap) */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CHICKEN_SYMPTOMS.map((sym) => {
                  const isSelected = (activeChicken.symptoms || []).includes(sym.id);
                  return (
                    <button
                      key={sym.id}
                      type="button"
                      id={`symptom-btn-${sym.id}`}
                      onClick={() => handleToggleSymptom(sym.id)}
                      className={`min-h-[48px] px-3.5 py-2.5 rounded-2xl border-2 text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer active:scale-98 ${
                        isSelected
                          ? 'bg-[#FEF6E9] border-[#C2841E] text-[#78350F] shadow-xs'
                          : 'bg-white border-[#E5E1D8] text-stone-800 hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-xl shrink-0 leading-none">{sym.icon}</span>
                        {/* Allowed wrap up to 2 lines, no ellipsis */}
                        <span className="text-xs sm:text-sm font-bold leading-snug break-words">
                          {sym.label}
                        </span>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-black transition-all ${
                          isSelected
                            ? 'bg-[#C2841E] text-white'
                            : 'bg-stone-100 text-stone-400 border border-stone-200'
                        }`}
                      >
                        {isSelected ? '✓' : '+'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Bottom Sheet: Sticky Selesai Button */}
            <div className="p-4 bg-white border-t border-[#EFECE6] shrink-0">
              <button
                type="button"
                id="symptom-sheet-done-btn"
                onClick={() => setIsSymptomSheetOpen(false)}
                className="w-full py-3.5 bg-[#2D4A36] hover:bg-[#1B3022] text-[#FDFBF7] font-extrabold rounded-2xl text-sm sm:text-base shadow-md shadow-[#2D4A36]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Check className="w-5 h-5 text-[#D4AF37]" />
                <span>
                  SELESAI —{' '}
                  {activeChicken.symptoms && activeChicken.symptoms.length > 0
                    ? `${activeChicken.symptoms.length} GEJALA DIPILIH`
                    : 'SIMPAN STATUS'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL KONFIRMASI AYAM MATI */}
      {/* ========================================================================= */}
      {confirmDeadModalNum !== null && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#FCA5A5] p-5 sm:p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FDF2F2] text-[#DC2626] flex items-center justify-center text-2xl border border-[#FCA5A5]">
              ✕
            </div>

            <div>
              <h3 className="text-lg font-black text-[#1B3022] font-['Outfit']">
                Konfirmasi Ayam #{confirmDeadModalNum} Mati?
              </h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Ayam akan dinonaktifkan dari populasi aktif kandang, tetapi riwayat kesehatannya
                tetap tersimpan dalam sistem Eggnest.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                id="cancel-dead-btn"
                onClick={() => setConfirmDeadModalNum(null)}
                className="py-3 px-3 rounded-2xl border border-[#E5E1D8] font-bold text-xs sm:text-sm text-stone-700 hover:bg-[#FAF7F2] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="confirm-dead-btn"
                onClick={handleConfirmDead}
                className="py-3 px-3 rounded-2xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-red-500/20 transition-all cursor-pointer"
              >
                Konfirmasi Mati
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
