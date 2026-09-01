import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { Chicken } from '../../types';
import { ChickenDetailModal } from './ChickenDetailModal';
import {
  HeartPulse,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  Info,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const ChickenHealthGrid: React.FC = () => {
  const { farm, chickens, setIsQuickReportOpen } = useFarm();
  const [selectedChickenId, setSelectedChickenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'HEALTHY' | 'SICK' | 'DEAD'>('ALL');

  // Fallback: if chickens are still loading or empty, generate initial list based on initialChickens
  const chickenList: Chicken[] = React.useMemo(() => {
    if (chickens && chickens.length > 0) {
      return chickens;
    }
    const count = farm.initialChickens || 12;
    const dummyList: Chicken[] = [];
    for (let i = 1; i <= count; i++) {
      dummyList.push({
        id: `chk-${farm.id}-${i}`,
        farmId: farm.id,
        chickenNumber: i,
        initialAgeWeeks: farm.initialAgeWeeks || 18,
        currentAgeWeeks: farm.currentAgeWeeks || 18,
        joinedDate: farm.activationDate || '2026-07-20',
        status: 'HEALTHY',
        generation: 1,
        createdAt: new Date().toISOString(),
      });
    }
    return dummyList;
  }, [chickens, farm]);

  const healthyCount = chickenList.filter((c) => c.status === 'HEALTHY').length;
  const sickCount = chickenList.filter((c) => c.status === 'SICK').length;
  const deadCount = chickenList.filter((c) => c.status === 'DEAD').length;

  const filteredChickens = chickenList.filter((c) => {
    if (filter === 'HEALTHY') return c.status === 'HEALTHY';
    if (filter === 'SICK') return c.status === 'SICK';
    if (filter === 'DEAD') return c.status === 'DEAD';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-[#EFECE6] shadow-xs space-y-4 sm:space-y-5 w-full min-w-0">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EFECE6] pb-3 sm:pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
              <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5 text-[#2D4A36]" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#1B3022] font-['Outfit']">
              Status Kesehatan Ayam Individu
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 sm:mt-1">
            Data kondisi kesehatan dan riwayat medis per ekor ayam (Kandang {farm.farmCode})
          </p>
        </div>

        {/* Filter Pills with Horizontal Scroll on Mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap w-full sm:w-auto shrink-0">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              filter === 'ALL'
                ? 'bg-[#1B3022] text-[#FDFBF7] shadow-xs'
                : 'bg-[#F7F4EE] text-stone-700 hover:bg-[#EAE4D9]'
            }`}
          >
            Semua ({chickenList.length})
          </button>
          <button
            onClick={() => setFilter('HEALTHY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              filter === 'HEALTHY'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            🟢 Sehat ({healthyCount})
          </button>
          {sickCount > 0 && (
            <button
              onClick={() => setFilter('SICK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                filter === 'SICK'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              ⚠️ Sakit ({sickCount})
            </button>
          )}
          {deadCount > 0 && (
            <button
              onClick={() => setFilter('DEAD')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                filter === 'DEAD'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              🔴 Mati ({deadCount})
            </button>
          )}
        </div>
      </div>

      {/* Grid of Chickens */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
        {filteredChickens.map((chk) => {
          const isSick = chk.status === 'SICK';
          const isDead = chk.status === 'DEAD';
          const isReplaced = chk.status === 'REPLACED';

          let borderStyle = 'border-[#E5E1D8] hover:border-[#2D4A36] bg-[#FDFBF7]';
          let badgeText = 'Sehat';
          let badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';

          if (isDead) {
            borderStyle = 'border-rose-200 bg-rose-50/50 hover:border-rose-400';
            badgeText = 'Mati';
            badgeClass = 'bg-rose-100 text-rose-900 border-rose-200';
          } else if (isSick) {
            borderStyle = 'border-amber-200 bg-amber-50/50 hover:border-amber-400';
            badgeText = 'Sakit';
            badgeClass = 'bg-amber-100 text-amber-900 border-amber-200';
          } else if (isReplaced) {
            borderStyle = 'border-purple-200 bg-purple-50/50 hover:border-purple-400';
            badgeText = 'Diganti';
            badgeClass = 'bg-purple-100 text-purple-900 border-purple-200';
          }

          return (
            <div
              key={chk.id}
              onClick={() => setSelectedChickenId(chk.id)}
              className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 sm:space-y-2.5 hover:shadow-md ${borderStyle}`}
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#1B3022] text-[#FDFBF7] font-black text-[11px] sm:text-xs flex items-center justify-center font-['Outfit']">
                  #{chk.chickenNumber}
                </div>
                <span className="text-[9px] sm:text-[10px] text-stone-400 font-semibold">
                  Gen {chk.generation || 1}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-xs sm:text-sm text-[#1B3022] font-['Outfit']">
                  Ayam #{chk.chickenNumber}
                </h4>
                <p className="text-[10px] sm:text-[11px] text-stone-500">
                  {chk.currentAgeWeeks || farm.currentAgeWeeks || 18} Minggu
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
                <span
                  className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md border ${badgeClass}`}
                >
                  {badgeText}
                </span>
                <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Info Banner */}
      <div className="p-3 sm:p-3.5 bg-[#FAF7F2] rounded-xl sm:rounded-2xl border border-[#E5E1D8] flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 text-xs text-stone-600">
        <div className="flex items-start sm:items-center gap-2">
          <Info className="w-4 h-4 text-[#2D4A36] shrink-0 mt-0.5 sm:mt-0" />
          <span className="text-[11px] sm:text-xs">
            Klik kartu ayam mana saja untuk melihat rekam medis, riwayat keluhan, atau memproses penggantian garansi ayam.
          </span>
        </div>
        <button
          onClick={() => setIsQuickReportOpen(true)}
          className="w-full sm:w-auto px-4 py-2 bg-[#2D4A36] hover:bg-[#1B3022] text-[#FDFBF7] font-bold rounded-xl text-xs shrink-0 cursor-pointer shadow-xs"
        >
          + Lapor Kondisi Harian
        </button>
      </div>

      {/* Chicken Detail Modal */}
      {selectedChickenId && (
        <ChickenDetailModal
          chickenId={selectedChickenId}
          onClose={() => setSelectedChickenId(null)}
        />
      )}
    </div>
  );
};
