import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useFarm } from '../context/FarmContext';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Egg,
  Eye,
  RefreshCw,
  Search,
  Wheat,
  X,
} from 'lucide-react';

const parseArray = (v: any) => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const normalizeFarm = (f: any) => ({
  ...f,
  id: String(f?.id ?? ''),
  farmCode: String(f?.farmCode ?? f?.farm_code ?? ''),
  ownerName: String(f?.ownerName ?? f?.owner_name ?? ''),
});

const normalizeReport = (r: any) => ({
  ...r,
  id: String(r?.id ?? ''),
  farmId: String(r?.farmId ?? r?.farm_id ?? ''),
  farmCode: String(r?.farmCode ?? r?.farm_code ?? ''),
  ownerName: String(r?.ownerName ?? r?.owner_name ?? ''),
  date: String(r?.date ?? r?.report_date ?? ''),
  eggCount: Number(r?.eggCount ?? r?.egg_count ?? 0),
  feedKg: Number(r?.feedKg ?? r?.feed_kg ?? 0),
  productivityRate: Number(r?.productivityRate ?? r?.productivity_rate ?? 0),
  chickenCondition: String(r?.chickenCondition ?? r?.chicken_condition ?? '').toLowerCase(),
  chickenReports: parseArray(r?.chickenReports ?? r?.chicken_reports),
  issueTypes: parseArray(r?.issueTypes ?? r?.issue_types),
  notes: String(r?.notes ?? ''),
  photoUrl: String(r?.photoUrl ?? r?.photo_url ?? ''),
});

export const MitraReportsPage: React.FC = () => {
  const { showToast } = useFarm();
  const [sp, setSp] = useSearchParams();
  const [farms, setFarms] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [farmFilter, setFarmFilter] = useState(sp.get('farmId') || 'all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [dash, rep] = await Promise.all([api.getMitraDashboard(), api.getReports()]);
      setFarms((dash.farms || []).map(normalizeFarm));
      setReports((rep.reports || []).map(normalizeReport));
    } catch (e: any) {
      showToast(e?.message || 'Gagal memuat laporan Member.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const farmMap = useMemo(
    () => new Map(farms.map((f) => [f.id, f])),
    [farms]
  );

  const visible = useMemo(
    () =>
      reports
        .filter((r) => farmFilter === 'all' || r.farmId === farmFilter)
        .filter((r) => {
          if (!query.trim()) return true;
          const farm = farmMap.get(r.farmId);
          const haystack = `${r.date} ${r.farmCode} ${r.ownerName} ${farm?.farmCode || ''} ${farm?.ownerName || ''}`.toLowerCase();
          return haystack.includes(query.toLowerCase());
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [reports, farmFilter, query, farmMap]
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-[#EAF2EC] border border-[#CDE3D3] text-xs font-black">
            VIEW ONLY
          </span>
          <h1 className="text-3xl md:text-4xl font-black font-['Outfit'] mt-2">Laporan Member</h1>
          <p className="text-sm text-stone-500 mt-1">
            Laporan diisi oleh Member. Mitra hanya melihat untuk kebutuhan monitoring dan follow-up.
          </p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2.5 rounded-2xl border bg-white font-bold text-sm flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Perbarui
        </button>
      </div>

      <div className="rounded-3xl border border-[#CDE3D3] bg-[#EAF2EC] p-4 text-xs text-[#1B3022]">
        <strong>Hak akses Mitra:</strong> data laporan tidak dapat diedit dari Portal Mitra. Jika ada
        masalah kesehatan ayam, penanganan teknis dilakukan oleh Admin Eggnest.
      </div>

      <div className="bg-white rounded-3xl border border-[#EFECE6] p-4 grid lg:grid-cols-[1fr_1fr] gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari tanggal, Farm ID, atau nama Member..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#E5E1D8]"
          />
        </div>
        <select
          value={farmFilter}
          onChange={(e) => {
            setFarmFilter(e.target.value);
            const next = new URLSearchParams(sp);
            e.target.value === 'all'
              ? next.delete('farmId')
              : next.set('farmId', e.target.value);
            setSp(next, { replace: true });
          }}
          className="w-full px-4 py-3 rounded-2xl border border-[#E5E1D8] font-bold"
        >
          <option value="all">Semua Member Saya</option>
          {farms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.farmCode} — {f.ownerName}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-stone-400 font-bold">Memuat laporan...</div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-3xl border p-10 text-center text-stone-500">
            Belum ada laporan Member.
          </div>
        ) : (
          visible.map((r) => {
            const farm = farmMap.get(r.farmId);
            const owner = r.ownerName || farm?.ownerName || 'Member Eggnest';
            const farmCode = r.farmCode || farm?.farmCode || r.farmId;
            const issue = r.chickenCondition === 'issue';

            return (
              <div
                key={r.id || `${r.farmId}-${r.date}`}
                className="bg-white rounded-3xl border border-[#EFECE6] p-4 md:p-5"
              >
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black">{farmCode}</span>
                      {issue ? (
                        <span className="px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-[9px] font-black text-amber-700">
                          DITANGANI ADMIN
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[9px] font-black text-emerald-700">
                          NORMAL
                        </span>
                      )}
                    </div>
                    <div className="font-black text-lg mt-1">{owner}</div>
                    <div className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {r.date}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 min-w-[320px]">
                    <MiniStat icon={Egg} value={`${r.eggCount}`} label="Telur" />
                    <MiniStat icon={Wheat} value={`${r.feedKg}`} label="Pakan kg" />
                    <MiniStat
                      icon={issue ? AlertTriangle : CheckCircle2}
                      value={`${Math.round(r.productivityRate)}%`}
                      label="Produktivitas"
                    />
                  </div>

                  <button
                    onClick={() => setSelected(r)}
                    className="px-4 py-2.5 rounded-2xl bg-[#1B3022] text-white font-black text-xs flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Lihat Detail
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center">
          <div className="bg-white w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-3xl p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-mono text-xs font-black">
                  {selected.farmCode || farmMap.get(selected.farmId)?.farmCode || selected.farmId}
                </div>
                <h2 className="text-2xl font-black mt-1">
                  {selected.ownerName ||
                    farmMap.get(selected.farmId)?.ownerName ||
                    'Member Eggnest'}
                </h2>
                <div className="text-xs text-stone-500 mt-1">{selected.date}</div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-10 h-10 rounded-2xl border flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              <DetailStat label="Telur" value={`${selected.eggCount} butir`} />
              <DetailStat label="Pakan" value={`${selected.feedKg} kg`} />
              <DetailStat label="Produktivitas" value={`${Math.round(selected.productivityRate)}%`} />
              <DetailStat
                label="Kondisi"
                value={selected.chickenCondition === 'issue' ? 'Ada masalah' : 'Sehat'}
              />
            </div>

            {selected.chickenReports?.length > 0 && (
              <div className="mt-5">
                <h3 className="font-black">Kondisi Ayam</h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                  {selected.chickenReports.map((c: any, index: number) => {
                    const condition = String(c?.condition || '').toUpperCase();
                    const abnormal = condition && condition !== 'HEALTHY';
                    return (
                      <div
                        key={`${c?.chickenNumber ?? index}`}
                        className={`rounded-2xl border p-3 text-xs ${
                          abnormal
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-[#FAF7F2] border-[#EFECE6]'
                        }`}
                      >
                        <div className="font-black">Ayam #{c?.chickenNumber ?? index + 1}</div>
                        <div className="mt-1 text-stone-600">
                          {condition === 'SICK'
                            ? 'Sakit'
                            : condition === 'DEAD'
                              ? 'Mati'
                              : 'Sehat'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selected.notes && (
              <div className="mt-5 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6] p-4">
                <div className="text-xs font-black">Catatan Member</div>
                <div className="text-sm text-stone-600 mt-1 whitespace-pre-wrap">{selected.notes}</div>
              </div>
            )}

            {selected.chickenCondition === 'issue' && (
              <div className="mt-5 rounded-2xl bg-[#FFF8E8] border border-amber-200 p-4 text-xs text-amber-800">
                <strong>Status:</strong> masalah teknis dari laporan ini menjadi tanggung jawab Admin Eggnest.
                Mitra cukup melakukan follow-up hubungan dengan Member.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MiniStat = ({
  icon: Icon,
  value,
  label,
}: {
  icon: any;
  value: string;
  label: string;
}) => (
  <div className="rounded-2xl bg-[#FAF7F2] border border-[#EFECE6] p-3">
    <Icon className="w-4 h-4 text-[#2D4A36]" />
    <div className="font-black mt-1">{value}</div>
    <div className="text-[9px] text-stone-500">{label}</div>
  </div>
);

const DetailStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-[#EFECE6] p-4">
    <div className="text-[10px] font-bold text-stone-500">{label}</div>
    <div className="font-black mt-1">{value}</div>
  </div>
);

export default MitraReportsPage;
