import React, { useState, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { Chicken, ChickenHealthReport } from '../../types';
import { api } from '../../services/api';
import {
  X,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  ShieldCheck,
  Calendar,
  Activity,
  ChevronRight,
  Info,
} from 'lucide-react';

interface ChickenDetailModalProps {
  chickenId: string | null;
  onClose: () => void;
}

export const ChickenDetailModal: React.FC<ChickenDetailModalProps> = ({ chickenId, onClose }) => {
  const { farm, replaceChicken, fetchChickens } = useFarm();
  const [chicken, setChicken] = useState<Chicken | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [lineage, setLineage] = useState<{ replacementOf: any; replacedBy: any }>({
    replacementOf: null,
    replacedBy: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReplacing, setIsReplacing] = useState<boolean>(false);
  const [replaceNotes, setReplaceNotes] = useState<string>('');
  const [replaceAgeWeeks, setReplaceAgeWeeks] = useState<number>(18);
  const [isSubmittingReplace, setIsSubmittingReplace] = useState<boolean>(false);

  useEffect(() => {
    if (!chickenId) return;

    let isMounted = true;
    setIsLoading(true);

    api
      .getChickenDetail(chickenId)
      .then((res) => {
        if (isMounted && res.success) {
          setChicken(res.chicken);
          setTimeline(res.timeline || []);
          setLineage(res.lineage || { replacementOf: null, replacedBy: null });
        }
      })
      .catch((err) => {
        console.error('Error fetching chicken detail:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [chickenId]);

  if (!chickenId) return null;

  const handleConfirmReplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chicken) return;
    setIsSubmittingReplace(true);
    try {
      await replaceChicken(chicken.id, {
        notes: replaceNotes,
        ageWeeks: replaceAgeWeeks,
      });
      await fetchChickens(farm.id);
      setIsReplacing(false);
      onClose();
    } finally {
      setIsSubmittingReplace(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto w-full">
      <div className="relative w-full max-w-lg bg-[#FDFBF7] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#EFECE6] overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#1B3022] text-[#FDFBF7] p-4 sm:p-5 flex items-center justify-between border-b border-[#2D4A36] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-[#1B3022] font-black text-base flex items-center justify-center font-['Outfit']">
              #{chicken?.chickenNumber ?? '...'}
            </div>
            <div>
              <h3 className="text-lg font-bold font-['Outfit'] flex items-center gap-2">
                Ayam #{chicken?.chickenNumber}
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-[#A3B899]">
                  Gen {chicken?.generation || 1}
                </span>
              </h3>
              <p className="text-xs text-[#A3B899]">
                Farm {farm.farmCode} • Ras: {farm.chickenBreed || 'Lohmann Brown'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-stone-500 space-y-2">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-[#2D4A36]" />
              <p className="text-xs">Memuat rekam medis ayam...</p>
            </div>
          ) : !chicken ? (
            <div className="py-8 text-center text-stone-500">
              <p>Data ayam tidak ditemukan.</p>
            </div>
          ) : (
            <>
              {/* Status Overview Card */}
              <div className="p-4 bg-white rounded-2xl border border-[#E5E1D8] shadow-xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-semibold text-stone-500">Status Saat Ini:</span>
                  <div>
                    {chicken.status === 'DEAD' ? (
                      <span className="px-3 py-1 bg-rose-100 text-rose-900 border border-rose-200 text-xs font-bold rounded-full">
                        🔴 MATI
                      </span>
                    ) : chicken.status === 'REPLACED' ? (
                      <span className="px-3 py-1 bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold rounded-full">
                        🔄 SUDAH DIGANTI
                      </span>
                    ) : chicken.status === 'SICK' ? (
                      <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-full">
                        ⚠️ SAKIT / PERLU PERHATIAN
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold rounded-full">
                        🟢 SEHAT & AKTIF
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-stone-100">
                  <div className="p-2.5 bg-[#FAF7F2] rounded-xl">
                    <span className="text-stone-500 block">Usia Saat Ini:</span>
                    <span className="font-bold text-[#1B3022] text-sm">
                      {chicken.currentAgeWeeks || farm.currentAgeWeeks || 18} Minggu
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#FAF7F2] rounded-xl">
                    <span className="text-stone-500 block">Status Garansi:</span>
                    <span className="font-bold text-[#2D4A36] text-sm">
                      Garansi Aktif ({farm.warrantyEnd})
                    </span>
                  </div>
                </div>

                {/* Lineage Info */}
                {lineage.replacementOf && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-700" />
                    <div>
                      <span className="font-bold block">Ayam Pengganti (Gen {chicken.generation})</span>
                      <span>
                        Menggantikan ayam generasi sebelumnya pada{' '}
                        {new Date(chicken.joinedDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Replacement Action Form (If chicken is dead or user wants to replace) */}
              {isReplacing ? (
                <form
                  onSubmit={handleConfirmReplace}
                  className="p-4 bg-amber-50 rounded-2xl border border-amber-300 space-y-3 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-amber-700" />
                      Proses Penggantian Ayam #{chicken.chickenNumber}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsReplacing(false)}
                      className="text-xs text-stone-500 hover:text-stone-800"
                    >
                      Batal
                    </button>
                  </div>

                  <p className="text-xs text-amber-900 leading-relaxed">
                    Sistem akan mencatat ayam baru dengan nomor #{chicken.chickenNumber} (Generasi{' '}
                    {(chicken.generation || 1) + 1}) dan mengarsipkan riwayat kesehatan ayam sebelumnya.
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Usia Ayam Pengganti Baru (Minggu):
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={40}
                      value={replaceAgeWeeks}
                      onChange={(e) => setReplaceAgeWeeks(parseInt(e.target.value, 10) || 18)}
                      className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2D4A36]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Catatan / Alasan Penggantian:
                    </label>
                    <textarea
                      rows={2}
                      value={replaceNotes}
                      onChange={(e) => setReplaceNotes(e.target.value)}
                      placeholder="Contoh: Ayam mati karena sakit, diganti paket garansi Eggnest..."
                      className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2D4A36]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReplace}
                    className="w-full py-2.5 bg-[#2D4A36] hover:bg-[#1B3022] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmittingReplace ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Konfirmasi Penggantian Ayam #{chicken.chickenNumber}
                  </button>
                </form>
              ) : (
                chicken.status === 'DEAD' && (
                  <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 flex items-center justify-between gap-3">
                    <div className="text-xs text-rose-900">
                      <span className="font-bold block">Ayam tercatat MATI</span>
                      <span>Klaim penggantian garansi atau masukkan ayam baru.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsReplacing(true)}
                      className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer shadow-xs"
                    >
                      Ganti Ayam Sekarang
                    </button>
                  </div>
                )
              )}

              {/* Health Timeline */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1B3022] flex items-center gap-1.5 font-['Outfit']">
                    <Clock className="w-4 h-4 text-[#2D4A36]" />
                    Riwayat Laporan Kesehatan
                  </h4>
                  <span className="text-xs text-stone-500">{timeline.length} Catatan</span>
                </div>

                {timeline.length === 0 ? (
                  <div className="p-4 bg-white rounded-2xl border border-[#E5E1D8] text-center text-xs text-stone-500">
                    Belum ada riwayat keluhan khusus. Ayam dalam kondisi prima.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {timeline.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-3 bg-white rounded-xl border border-stone-200 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-800">
                            📅 {item.reportDate || item.date}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.condition === 'DEAD'
                                ? 'bg-rose-100 text-rose-900'
                                : item.condition === 'SICK'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {item.condition === 'DEAD'
                              ? 'MATI'
                              : item.condition === 'SICK'
                              ? 'SAKIT'
                              : 'SEHAT'}
                          </span>
                        </div>

                        {/* Problems Tags */}
                        {item.problems && item.problems.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.problems.map((p: any, pIdx: number) => (
                              <span
                                key={pIdx}
                                className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded text-[11px]"
                              >
                                {p.problemType || p}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.customNotes && (
                          <p className="text-stone-600 italic text-[11px] pt-1">
                            "{item.customNotes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F7F4EE] border-t border-[#EFECE6] flex items-center justify-between">
          {!isReplacing && chicken?.status !== 'DEAD' && (
            <button
              type="button"
              onClick={() => setIsReplacing(true)}
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 underline cursor-pointer"
            >
              Ganti ayam dengan ayam baru...
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-5 py-2 bg-[#2D4A36] text-white text-xs font-bold rounded-xl hover:bg-[#1B3022] transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
