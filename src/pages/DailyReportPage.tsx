import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { ChickenCondition, IssueType, DailyReport } from '../types';
import {
  Egg,
  Wheat,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Calendar,
  History,
  FileCheck,
  Sparkles,
  ChevronDown,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const DailyReportPage: React.FC = () => {
  const { farm, reports, addDailyReport, textScale, chickens } = useFarm();

  const [date, setDate] = useState('2026-08-31');
  const [eggCount, setEggCount] = useState<number>(10);
  const [feedKg, setFeedKg] = useState<number>(1.2);
  const [chickenCondition, setChickenCondition] = useState<ChickenCondition>('healthy');
  const [selectedIssues, setSelectedIssues] = useState<IssueType[]>([]);
  const [affectedChickenId, setAffectedChickenId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Success state banner
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [lastStats, setLastStats] = useState<{ eggs: number; prod: number } | null>(null);

  // Filter for history
  const [searchFilter, setSearchFilter] = useState<string>('all');

  const issueOptions: IssueType[] = [
    'Ayam sakit',
    'Tidak mau makan',
    'Produksi menurun',
    'Ayam mati',
    'Lainnya',
  ];

  const handleToggleIssue = (issue: IssueType) => {
    if (selectedIssues.includes(issue)) {
      setSelectedIssues(selectedIssues.filter((i) => i !== issue));
    } else {
      setSelectedIssues([...selectedIssues, issue]);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const chickenReports =
        chickenCondition === 'issue' && affectedChickenId
          ? [
              {
                chickenId: affectedChickenId,
                condition: selectedIssues.includes('Ayam mati') ? ('DEAD' as const) : ('SICK' as const),
                symptoms: selectedIssues,
                notes: notes,
              },
            ]
          : [];

      const res = await addDailyReport(
        {
          date,
          eggCount,
          feedKg,
          chickenCondition,
          issueTypes: chickenCondition === 'issue' ? selectedIssues : undefined,
          notes,
          photoUrl: photoPreview || undefined,
        },
        chickenReports
      );

      setLastStats({ eggs: eggCount, prod: res.productivity });
      setSavedSuccess(true);

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2D6A4F', '#52B788', '#E9C46A', '#FFE6A7'],
        });
      } catch {
        // ignore
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error submitting daily report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (searchFilter === 'issue') return r.chickenCondition === 'issue';
    if (searchFilter === 'high') return r.productivityRate >= 80;
    return true;
  });

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-[#EAF2EC] text-[#1B3022] text-xs font-bold rounded-full border border-[#CDE3D3]">
            Input Cepat 20–30 Detik
          </span>
          <span className="text-xs text-stone-500 font-medium">Farm ID: {farm.farmCode}</span>
        </div>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1B3022] font-['Outfit'] tracking-tight mt-1">
          Lapor Hasil Hari Ini
        </h1>
        <p className="text-stone-600 text-sm font-medium mt-1">
          Pencatatan harian menjaga ayam terpantau dan garansi bibit tetap aktif.
        </p>
      </div>

      {/* Success Notification Banner if saved */}
      {savedSuccess && lastStats && (
        <div className="p-6 bg-[#EAF2EC] border-2 border-[#588157] rounded-3xl shadow-sm space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2D4A36] text-[#FDFBF7] flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-[#D4AF37]" />
              </div>
              <div>
                <span className="bg-[#2D4A36] text-[#FDFBF7] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  STATUS: BAIK
                </span>
                <h3 className="text-xl font-bold text-[#1B3022] mt-0.5 font-['Outfit']">
                  Laporan berhasil disimpan.
                </h3>
              </div>
            </div>
            <button
              onClick={() => setSavedSuccess(false)}
              className="text-xs font-bold text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              Tutup ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-white p-3 rounded-xl border border-[#EFECE6]">
              <span className="text-xs text-stone-500 font-medium">Produksi hari ini:</span>
              <p className="text-xl font-black text-[#1B3022] font-['Outfit']">
                {lastStats.eggs} telur
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#EFECE6]">
              <span className="text-xs text-stone-500 font-medium">Produktivitas:</span>
              <p className="text-xl font-black text-[#2D4A36] font-['Outfit']">
                {lastStats.prod}%
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#EFECE6] col-span-2 sm:col-span-1">
              <span className="text-xs text-stone-500 font-medium">Kondisi Kandang:</span>
              <p className="text-xl font-black text-[#1B3022] font-['Outfit']">
                {chickenCondition === 'healthy' ? 'Semua Sehat' : 'Perlu Pantauan'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Input Form */}
      <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs overflow-hidden p-6 md:p-8">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
          {/* Tanggal Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[#EFECE6]">
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                Tanggal Laporan
              </label>
              <div className="text-lg font-bold text-[#1B3022] font-['Outfit'] mt-0.5">
                Senin, 31 Agustus 2026
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#2D4A36]" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#E5E1D8] font-bold text-sm text-[#1B3022] focus:ring-2 focus:ring-[#2D4A36] outline-none bg-[#FAF7F2]"
              />
            </div>
          </div>

          {/* Section 1: Telur Hari Ini */}
          <div className="bg-[#F7F4EE] p-6 rounded-3xl border border-[#E5E1D8]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-[#1B3022] flex items-center gap-2 font-['Outfit']">
                  <Egg className="w-6 h-6 text-[#D4AF37]" />
                  Telur Hari Ini
                </h3>
                <p className="text-xs text-stone-500">
                  Hitung seluruh telur yang dipanen pagi dan sore hari
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-[#FEF6E9] text-[#78350F] rounded-full border border-[#FDE68A]">
                Satuan: butir
              </span>
            </div>

            <div className="flex items-center justify-center gap-4 md:gap-6 py-2">
              <button
                type="button"
                onClick={() => setEggCount(Math.max(0, eggCount - 1))}
                className="w-16 h-16 rounded-2xl bg-white border-2 border-[#E5E1D8] hover:border-[#2D4A36] active:bg-[#FAF7F2] text-[#1B3022] font-black text-3xl flex items-center justify-center shadow-xs transition-all cursor-pointer"
                aria-label="Kurangi jumlah telur"
              >
                <Minus className="w-8 h-8" />
              </button>

              <div className="min-w-[140px] text-center bg-white py-3 px-6 rounded-2xl border-2 border-[#2D4A36]/40 shadow-inner">
                <span className="text-5xl font-black text-[#1B3022] font-['Outfit'] block leading-none">
                  {eggCount}
                </span>
                <span className="text-xs text-stone-500 font-bold uppercase tracking-wider mt-1 block">
                  butir
                </span>
              </div>

              <button
                type="button"
                onClick={() => setEggCount(eggCount + 1)}
                className="w-16 h-16 rounded-2xl bg-white border-2 border-[#E5E1D8] hover:border-[#2D4A36] active:bg-[#FAF7F2] text-[#1B3022] font-black text-3xl flex items-center justify-center shadow-xs transition-all cursor-pointer"
                aria-label="Tambah jumlah telur"
              >
                <Plus className="w-8 h-8" />
              </button>
            </div>

            <div className="text-center mt-3">
              <span className="text-xs font-semibold text-stone-500">
                Produktivitas terhitung:{' '}
                <strong className="text-[#2D4A36]">
                  {Math.round((eggCount / farm.activeChickens) * 100)}%
                </strong>{' '}
                ({eggCount} telur / {farm.activeChickens} ayam)
              </span>
            </div>
          </div>

          {/* Section 2: Pakan Hari Ini */}
          <div className="bg-[#F7F4EE] p-6 rounded-3xl border border-[#E5E1D8]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-[#1B3022] flex items-center gap-2 font-['Outfit']">
                  <Wheat className="w-6 h-6 text-[#588157]" />
                  Pakan Hari Ini
                </h3>
                <p className="text-xs text-stone-500">
                  Total takaran konsentrat pakan yang diberikan hari ini
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-[#EAF2EC] text-[#1B3022] rounded-full border border-[#CDE3D3]">
                Satuan: kg
              </span>
            </div>

            <div className="flex items-center justify-center gap-4 md:gap-6 py-2">
              <button
                type="button"
                onClick={() => setFeedKg(Math.max(0, Number((feedKg - 0.1).toFixed(1))))}
                className="w-16 h-16 rounded-2xl bg-white border-2 border-[#E5E1D8] hover:border-[#2D4A36] active:bg-[#FAF7F2] text-[#1B3022] font-black text-3xl flex items-center justify-center shadow-xs transition-all cursor-pointer"
                aria-label="Kurangi pakan"
              >
                <Minus className="w-8 h-8" />
              </button>

              <div className="min-w-[140px] text-center bg-white py-3 px-6 rounded-2xl border-2 border-[#2D4A36]/40 shadow-inner">
                <span className="text-5xl font-black text-[#1B3022] font-['Outfit'] block leading-none">
                  {feedKg.toString().replace('.', ',')}
                </span>
                <span className="text-xs text-stone-500 font-bold uppercase tracking-wider mt-1 block">
                  kg pakan
                </span>
              </div>

              <button
                type="button"
                onClick={() => setFeedKg(Number((feedKg + 0.1).toFixed(1)))}
                className="w-16 h-16 rounded-2xl bg-white border-2 border-[#E5E1D8] hover:border-[#2D4A36] active:bg-[#FAF7F2] text-[#1B3022] font-black text-3xl flex items-center justify-center shadow-xs transition-all cursor-pointer"
                aria-label="Tambah pakan"
              >
                <Plus className="w-8 h-8" />
              </button>
            </div>

            <div className="text-center mt-3">
              <span className="text-xs font-semibold text-stone-500">
                Porsi rata-rata: <strong className="text-[#2D4A36]">100 gram/ekor</strong> (Ideal)
              </span>
            </div>
          </div>

          {/* Section 3: Kondisi Ayam */}
          <div>
            <label className="block text-lg font-bold text-[#1B3022] mb-3 font-['Outfit']">
              Kondisi Ayam
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Semua Sehat */}
              <button
                type="button"
                onClick={() => {
                  setChickenCondition('healthy');
                  setSelectedIssues([]);
                }}
                className={`p-5 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-center ${
                  chickenCondition === 'healthy'
                    ? 'border-[#2D4A36] bg-[#EAF2EC] text-[#1B3022] shadow-xs'
                    : 'border-[#E5E1D8] bg-white text-stone-700 hover:bg-[#FAF7F2]'
                }`}
              >
                <span className="text-3xl">✅</span>
                <span className="font-extrabold text-lg text-[#1B3022]">Semua Sehat</span>
                <span className="text-xs text-stone-600">Ayam lincah, nafsu makan normal</span>
              </button>

              {/* Option 2: Ada Masalah */}
              <button
                type="button"
                onClick={() => setChickenCondition('issue')}
                className={`p-5 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-center ${
                  chickenCondition === 'issue'
                    ? 'border-[#C2841E] bg-[#FEF6E9] text-[#78350F] shadow-xs'
                    : 'border-[#E5E1D8] bg-white text-stone-700 hover:bg-[#FAF7F2]'
                }`}
              >
                <span className="text-3xl">⚠️</span>
                <span className="font-extrabold text-lg text-[#78350F]">Ada Masalah</span>
                <span className="text-xs text-stone-600">Ada indikasi sakit atau masalah</span>
              </button>
            </div>

            {/* Sub Issues if Ada Masalah */}
            {chickenCondition === 'issue' && (
              <div className="mt-4 p-5 bg-[#FEF6E9] rounded-3xl border border-[#FDE68A] space-y-4 animate-in fade-in">
                <div>
                  <label className="text-sm font-bold text-[#78350F] block mb-1">
                    Pilih Nomor Ayam yang Mengalami Masalah (Opsional):
                  </label>
                  <select
                    value={affectedChickenId}
                    onChange={(e) => setAffectedChickenId(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-[#FDE68A] text-stone-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C2841E]"
                  >
                    <option value="">-- Pilih Ayam Spesifik (Misal: Ayam #1) --</option>
                    {chickens && chickens.length > 0 ? (
                      chickens.map((c) => (
                        <option key={c.id} value={c.id}>
                          Ayam #{c.chickenNumber} (Status: {c.status})
                        </option>
                      ))
                    ) : (
                      Array.from({ length: farm.initialChickens || 12 }, (_, i) => (
                        <option key={i + 1} value={`chk-${farm.id}-${i + 1}`}>
                          Ayam #{i + 1}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <span className="text-sm font-bold text-[#78350F] block mb-2">
                    Pilih masalah yang dialami (Bisa pilih lebih dari satu):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {issueOptions.map((issue) => (
                      <button
                        key={issue}
                        type="button"
                        onClick={() => handleToggleIssue(issue)}
                        className={`p-3 rounded-2xl text-xs sm:text-sm font-bold border text-left transition-all cursor-pointer ${
                          selectedIssues.includes(issue)
                            ? 'bg-[#C2841E] text-white border-[#C2841E] shadow-xs'
                            : 'bg-white text-stone-800 border-[#FDE68A] hover:bg-[#FEF3C7]'
                        }`}
                      >
                        {selectedIssues.includes(issue) ? '✓ ' : '+ '}
                        {issue}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Catatan (Optional) */}
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">
              Catatan Kandang <span className="text-stone-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ceritakan perkembangan khusus, misal: pemberian suplemen kalsium, perubahan cuaca sekitar kandang..."
              className="w-full px-4 py-3.5 rounded-2xl border border-[#E5E1D8] focus:outline-none focus:ring-2 focus:ring-[#2D4A36] text-sm bg-white"
            />
          </div>

          {/* Section 5: Foto Kondisi */}
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">
              Foto Kondisi <span className="text-stone-400 font-normal">(JPG, PNG maksimal 5MB)</span>
            </label>
            <label className="border-2 border-dashed border-[#E5E1D8] hover:border-[#2D4A36] rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer bg-white hover:bg-[#FAF7F2] transition-all">
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {photoPreview ? (
                <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-md">
                  <img
                    src={photoPreview}
                    alt="Preview foto kondisi"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm font-bold">
                    Klik untuk mengganti foto
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center py-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#EAF2EC] text-[#2D4A36] flex items-center justify-center mb-2 border border-[#CDE3D3]">
                    <Camera className="w-7 h-7" />
                  </div>
                  <span className="text-base font-bold text-[#1B3022]">
                    Ambil Foto Kandang atau Telur
                  </span>
                  <span className="text-xs text-stone-500 mt-1">
                    Sentuh di sini untuk membuka kamera atau galeri
                  </span>
                </div>
              )}
            </label>
          </div>

          {/* Big Submit Button */}
          <button
            type="submit"
            className="w-full py-5 bg-[#2D6A4F] hover:bg-[#1B3022] text-[#FDFBF7] font-black rounded-3xl text-xl shadow-md shadow-[#2D6A4F]/20 transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-3"
          >
            <CheckCircle2 className="w-7 h-7" />
            SIMPAN LAPORAN
          </button>
        </form>
      </div>

      {/* Riwayat Laporan Harian */}
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-[#EFECE6] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-[#1B3022] font-['Outfit'] flex items-center gap-2">
              <History className="w-5 h-5 text-[#2D4A36]" />
              Riwayat Laporan Kandang
            </h3>
            <p className="text-xs text-stone-500">
              Menampilkan {filteredReports.length} catatan produksi
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap w-full sm:w-auto">
            <button
              onClick={() => setSearchFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                searchFilter === 'all'
                  ? 'bg-[#1B3022] text-[#FDFBF7]'
                  : 'bg-[#FAF7F2] text-stone-600 hover:bg-[#EFECE6] border border-[#EFECE6]'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setSearchFilter('high')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                searchFilter === 'high'
                  ? 'bg-[#2D4A36] text-[#FDFBF7]'
                  : 'bg-[#FAF7F2] text-stone-600 hover:bg-[#EFECE6] border border-[#EFECE6]'
              }`}
            >
              Produksi Tinggi (80%+)
            </button>
            <button
              onClick={() => setSearchFilter('issue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                searchFilter === 'issue'
                  ? 'bg-[#C2841E] text-white'
                  : 'bg-[#FAF7F2] text-stone-600 hover:bg-[#EFECE6] border border-[#EFECE6]'
              }`}
            >
              Ada Masalah
            </button>
          </div>
        </div>

        {/* Mobile View: Clean Card List */}
        <div className="block sm:hidden space-y-2.5">
          {filteredReports.slice(-10).reverse().map((rep) => (
            <div
              key={rep.id}
              className="p-3.5 rounded-xl border border-[#EFECE6] bg-[#FAF7F2] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#1B3022]">{rep.date}</span>
                {rep.chickenCondition === 'healthy' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1B3022] bg-[#EAF2EC] px-2 py-0.5 rounded-full border border-[#CDE3D3]">
                    ✓ Sehat
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#78350F] bg-[#FEF6E9] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                    ⚠️ {(rep.issueTypes || []).join(', ') || 'Masalah'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-[#E5E1D8]">
                <div>
                  <span className="text-[10px] text-stone-500 block">Telur</span>
                  <span className="font-black text-[#1B3022] font-['Outfit'] text-sm">
                    {rep.eggCount} butir
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Pakan</span>
                  <span className="font-bold text-stone-700 text-sm">
                    {rep.feedKg.toString().replace('.', ',')} kg
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Produktivitas</span>
                  <span className="font-black text-[#2D4A36] text-sm">
                    {rep.productivityRate}%
                  </span>
                </div>
              </div>

              {rep.notes && (
                <p className="text-[11px] text-stone-600 bg-white p-2 rounded-lg border border-[#EFECE6] italic">
                  "{rep.notes}"
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Desktop / Tablet View: Table */}
        <div className="hidden sm:block overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm min-w-[580px]">
            <thead>
              <tr className="border-b border-[#EFECE6] text-stone-500 text-xs uppercase tracking-wider">
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Produksi Telur</th>
                <th className="py-3 px-3">Pakan (kg)</th>
                <th className="py-3 px-3">Produktivitas</th>
                <th className="py-3 px-3">Kondisi</th>
                <th className="py-3 px-3">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6]">
              {filteredReports.slice(-10).reverse().map((rep) => (
                <tr key={rep.id} className="hover:bg-[#FAF7F2] transition-colors">
                  <td className="py-3.5 px-3 font-bold text-[#1B3022]">
                    {rep.date}
                  </td>
                  <td className="py-3.5 px-3 font-extrabold text-[#1B3022] font-['Outfit']">
                    {rep.eggCount} butir
                  </td>
                  <td className="py-3.5 px-3 text-stone-700">
                    {rep.feedKg.toString().replace('.', ',')} kg
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-black text-[#2D4A36]">
                      {rep.productivityRate}%
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    {rep.chickenCondition === 'healthy' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1B3022] bg-[#EAF2EC] px-2.5 py-0.5 rounded-full border border-[#CDE3D3]">
                        ✓ Sehat
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#78350F] bg-[#FEF6E9] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
                        ⚠️ {(rep.issueTypes || []).join(', ') || 'Masalah'}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-xs text-stone-500 max-w-xs truncate">
                    {rep.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
