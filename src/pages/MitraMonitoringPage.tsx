import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useFarm } from '../context/FarmContext';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
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

const todayKey = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

const toDate = (s: string) => new Date(`${s}T00:00:00+07:00`);

const daysAgo = (date: string) => {
  if (!date) return 999;
  return Math.max(
    0,
    Math.floor((toDate(todayKey()).getTime() - toDate(date).getTime()) / 86400000)
  );
};

const nf = (f: any) => ({
  ...f,
  id: String(f?.id ?? ''),
  farmCode: String(f?.farmCode ?? f?.farm_code ?? ''),
  ownerName: String(f?.ownerName ?? f?.owner_name ?? ''),
  phone: String(f?.phone ?? ''),
  location: String(f?.location ?? f?.regency ?? ''),
  latitude:
    f?.latitude === null || f?.latitude === undefined || f?.latitude === ''
      ? null
      : Number(f.latitude),
  longitude:
    f?.longitude === null || f?.longitude === undefined || f?.longitude === ''
      ? null
      : Number(f.longitude),
  activeChickens: Number(f?.activeChickens ?? f?.active_chickens ?? 12),
  monthSalesAmount: Number(f?.monthSalesAmount ?? f?.month_sales_amount ?? 0),
  monthSoldEggs: Number(f?.monthSoldEggs ?? f?.month_sold_eggs ?? 0),
  lastReportDate: String(f?.lastReportDate ?? f?.last_report_date ?? ''),
  lastEggCount: Number(f?.lastEggCount ?? f?.last_egg_count ?? 0),
  lastChickenCondition: String(
    f?.lastChickenCondition ?? f?.last_chicken_condition ?? ''
  ).toLowerCase(),
});

const nr = (r: any) => ({
  ...r,
  farmId: String(r?.farmId ?? r?.farm_id ?? ''),
  date: String(r?.date ?? r?.report_date ?? ''),
  eggCount: Number(r?.eggCount ?? r?.egg_count ?? 0),
  chickenCondition: String(r?.chickenCondition ?? r?.chicken_condition ?? '').toLowerCase(),
  chickenReports: parseArray(r?.chickenReports ?? r?.chicken_reports),
});

const wa = (phone: string) => {
  const clean = String(phone || '').replace(/\D/g, '').replace(/^0/, '62');
  return clean ? `https://wa.me/${clean}` : '#';
};

const followupKey = (farmId: string) => `eggnest:mitra:followup:${farmId}`;

const getFollowup = (farmId: string) => {
  try {
    const raw = localStorage.getItem(followupKey(farmId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const MitraMonitoringPage: React.FC = () => {
  const { showToast } = useFarm();
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const [farms, setFarms] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [farmFilter, setFarmFilter] = useState(sp.get('farmId') || 'all');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'missing' | 'followup' | 'normal'>('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [dash, rep] = await Promise.all([api.getMitraDashboard(), api.getReports()]);
      const fs = (dash.farms || []).map(nf);
      setFarms(fs);
      setReports((rep.reports || []).map(nr));
      const requested = sp.get('farmId');
      if (requested && fs.some((f) => f.id === requested)) setFarmFilter(requested);
    } catch (e: any) {
      showToast(e?.message || 'Gagal memuat monitoring.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const today = todayKey();

  const rows = useMemo(() => {
    return farms.map((farm) => {
      const farmReports = reports
        .filter((r) => r.farmId === farm.id)
        .sort((a, b) => b.date.localeCompare(a.date));

      const recent7 = farmReports.filter((r) => daysAgo(r.date) <= 6);
      const previous7 = farmReports.filter((r) => {
        const d = daysAgo(r.date);
        return d >= 7 && d <= 13;
      });

      const avg = (arr: any[]) =>
        arr.length ? arr.reduce((s, r) => s + r.eggCount, 0) / arr.length : 0;

      const avg7 = avg(recent7);
      const prev7 = avg(previous7);
      const trend =
        prev7 > 0
          ? Math.round(((avg7 - prev7) / prev7) * 100)
          : recent7.length > 0
            ? 0
            : null;

      const last = farmReports[0];
      const issue =
        farm.lastChickenCondition === 'issue' ||
        last?.chickenCondition === 'issue' ||
        (last?.chickenReports || []).some(
          (c: any) => String(c?.condition || '').toUpperCase() !== 'HEALTHY'
        );

      const followup = getFollowup(farm.id);
      const followupAge = followup?.date ? daysAgo(followup.date) : 999;
      const missing = farm.lastReportDate !== today;
      const needsFollowup = missing || issue || followupAge >= 7;

      return {
        ...farm,
        reportsCount: farmReports.length,
        avg7: Math.round(avg7 * 10) / 10,
        trend,
        issue,
        missing,
        followup,
        followupAge,
        needsFollowup,
      };
    });
  }, [farms, reports, today]);

  const visible = useMemo(
    () =>
      rows.filter((r) => {
        if (farmFilter !== 'all' && r.id !== farmFilter) return false;
        const text = `${r.farmCode} ${r.ownerName} ${r.location}`.toLowerCase();
        if (query && !text.includes(query.toLowerCase())) return false;
        if (status === 'missing' && !r.missing) return false;
        if (status === 'followup' && !r.needsFollowup) return false;
        if (status === 'normal' && (r.needsFollowup || r.issue)) return false;
        return true;
      }),
    [rows, farmFilter, query, status]
  );

  const summary = useMemo(
    () => ({
      total: rows.length,
      reported: rows.filter((r) => !r.missing).length,
      missing: rows.filter((r) => r.missing).length,
      followup: rows.filter((r) => r.needsFollowup).length,
    }),
    [rows]
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-[#EAF2EC] border border-[#CDE3D3] text-xs font-black">
            MONITORING MARKETING
          </span>
          <h1 className="text-3xl md:text-4xl font-black mt-2 font-['Outfit']">Monitoring Member</h1>
          <p className="text-sm text-stone-500 mt-1">
            Pantau kedisiplinan laporan, tren produksi, kondisi umum, dan kebutuhan follow-up.
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card icon={Users} label="Total Member" value={summary.total} />
        <Card icon={CheckCircle2} label="Sudah Lapor Hari Ini" value={summary.reported} />
        <Card icon={ClipboardCheck} label="Belum Lapor" value={summary.missing} />
        <Card icon={MessageCircle} label="Perlu Follow-up" value={summary.followup} />
      </div>

      <div className="bg-white border border-[#EFECE6] rounded-3xl p-4 space-y-3">
        <div className="grid lg:grid-cols-[1fr_280px] gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari Farm ID, Member, wilayah..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#E5E1D8]"
            />
          </div>
          <select
            value={farmFilter}
            onChange={(e) => {
              setFarmFilter(e.target.value);
              const n = new URLSearchParams(sp);
              e.target.value === 'all' ? n.delete('farmId') : n.set('farmId', e.target.value);
              setSp(n, { replace: true });
            }}
            className="w-full px-4 py-3 rounded-2xl border border-[#E5E1D8] font-bold"
          >
            <option value="all">Semua Member</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.farmCode} — {f.ownerName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'Semua'],
              ['missing', 'Belum Lapor'],
              ['followup', 'Perlu Follow-up'],
              ['normal', 'Normal'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setStatus(id)}
              className={`px-4 py-2 rounded-2xl border text-xs font-black ${
                status === id
                  ? 'bg-[#2D4A36] text-white border-[#2D4A36]'
                  : 'bg-white text-stone-600 border-[#E5E1D8]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center font-bold text-stone-400">Memuat monitoring...</div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-3xl border p-10 text-center text-stone-500">
            Tidak ada Member sesuai filter.
          </div>
        ) : (
          visible.map((r) => (
            <div key={r.id} className="bg-white rounded-3xl border border-[#EFECE6] p-4 md:p-5">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-xs">{r.farmCode}</span>
                    {r.missing ? (
                      <Status tone="amber">BELUM LAPOR</Status>
                    ) : (
                      <Status tone="green">SUDAH LAPOR</Status>
                    )}
                    {r.issue && <Status tone="rose">DITANGANI ADMIN</Status>}
                  </div>
                  <div className="font-black text-lg mt-1">{r.ownerName}</div>
                  <div className="text-xs text-stone-500 mt-1">
                    {r.location || 'Lokasi belum lengkap'} • laporan terakhir{' '}
                    {r.lastReportDate || 'belum ada'}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 flex-1 xl:max-w-3xl">
                  <Info label="Produksi terakhir" value={`${r.lastEggCount} butir`} />
                  <Info label="Terjual bulan ini" value={`${r.monthSoldEggs} butir`} />
                  <Info label="Rata-rata 7 hari" value={`${r.avg7} butir`} />
                  <Info
                    label="Tren produksi"
                    value={
                      r.trend === null
                        ? 'Belum cukup data'
                        : r.trend > 0
                          ? `↑ ${r.trend}%`
                          : r.trend < 0
                            ? `↓ ${Math.abs(r.trend)}%`
                            : 'Stabil'
                    }
                    icon={r.trend && r.trend < 0 ? TrendingDown : TrendingUp}
                  />
                  <Info
                    label="Follow-up terakhir"
                    value={r.followup?.date ? `${r.followupAge} hari lalu` : 'Belum ada'}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {r.phone && (
                    <a
                      href={wa(r.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2.5 rounded-2xl border text-xs font-black flex items-center gap-1.5"
                    >
                      <Phone className="w-4 h-4" />
                      WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() =>
                      navigate(`/mitra/reports?farmId=${encodeURIComponent(r.id)}`)
                    }
                    className="px-3 py-2.5 rounded-2xl bg-[#EAF2EC] border border-[#CDE3D3] text-xs font-black"
                  >
                    Riwayat
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/mitra/follow-up?farmId=${encodeURIComponent(r.id)}`)
                    }
                    className="px-3 py-2.5 rounded-2xl bg-[#1B3022] text-white text-xs font-black"
                  >
                    Follow-up
                  </button>
                  {r.latitude != null && r.longitude != null && (
                    <a
                      href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2.5 rounded-2xl bg-[#D4AF37] text-[#1B3022] text-xs font-black flex items-center gap-1.5"
                    >
                      <MapPin className="w-4 h-4" />
                      Lokasi
                    </a>
                  )}
                </div>
              </div>

              {r.issue && (
                <div className="mt-4 rounded-2xl bg-[#FFF8E8] border border-amber-200 p-3 flex gap-2 text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Member sedang memiliki masalah kandang. <strong>Penanganan teknis dilakukan Admin Eggnest.</strong>{' '}
                    Mitra cukup menjaga komunikasi dan memastikan Member tetap ter-follow-up.
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const Card = ({ icon: Icon, label, value }: { icon: any; label: string; value: number }) => (
  <div className="bg-white border border-[#EFECE6] rounded-3xl p-4">
    <Icon className="w-5 h-5 text-[#2D4A36]" />
    <div className="text-3xl font-black mt-2">{value}</div>
    <div className="text-xs font-bold text-stone-500">{label}</div>
  </div>
);

const Info = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: any;
}) => (
  <div className="rounded-2xl bg-[#FAF7F2] border border-[#EFECE6] p-3">
    <div className="text-[9px] font-bold text-stone-500">{label}</div>
    <div className="font-black text-xs mt-1 flex items-center gap-1">
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {value}
    </div>
  </div>
);

const Status = ({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'green' | 'amber' | 'rose';
}) => {
  const cls =
    tone === 'rose'
      ? 'bg-rose-50 border-rose-200 text-rose-700'
      : tone === 'amber'
        ? 'bg-amber-50 border-amber-200 text-amber-700'
        : 'bg-emerald-50 border-emerald-200 text-emerald-700';
  return <span className={`px-2 py-1 rounded-full border text-[9px] font-black ${cls}`}>{children}</span>;
};

export default MitraMonitoringPage;
