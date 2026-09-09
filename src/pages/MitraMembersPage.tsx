import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useFarm } from '../context/FarmContext';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Users,
  Warehouse,
} from 'lucide-react';

const todayKey = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

const nf = (f: any) => ({
  ...f,
  id: String(f?.id ?? ''),
  farmCode: String(f?.farmCode ?? f?.farm_code ?? ''),
  ownerName: String(f?.ownerName ?? f?.owner_name ?? ''),
  phone: String(f?.phone ?? ''),
  location: String(f?.location ?? f?.regency ?? ''),
  activeChickens: Number(
    f?.activeChickens ?? f?.active_chickens ?? f?.initial_chickens ?? 12
  ),
  lastReportDate: String(f?.lastReportDate ?? f?.last_report_date ?? ''),
  lastEggCount: Number(f?.lastEggCount ?? f?.last_egg_count ?? 0),
  monthSalesAmount: Number(f?.monthSalesAmount ?? f?.month_sales_amount ?? 0),
  monthSoldEggs: Number(f?.monthSoldEggs ?? f?.month_sold_eggs ?? 0),
  lastChickenCondition: String(
    f?.lastChickenCondition ?? f?.last_chicken_condition ?? ''
  ).toLowerCase(),
  latitude:
    f?.latitude === null || f?.latitude === undefined || f?.latitude === ''
      ? null
      : Number(f.latitude),
  longitude:
    f?.longitude === null || f?.longitude === undefined || f?.longitude === ''
      ? null
      : Number(f.longitude),
});

export const MitraMembersPage: React.FC = () => {
  const { showToast } = useFarm();
  const navigate = useNavigate();
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'reported' | 'missing' | 'attention'>('all');

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.getMitraDashboard();
      setFarms((res.farms || []).map(nf));
    } catch (e: any) {
      showToast(e?.message || 'Gagal memuat Member.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const today = todayKey();

  const visible = useMemo(
    () =>
      farms.filter((f) => {
        const text = `${f.farmCode} ${f.ownerName} ${f.phone} ${f.location}`.toLowerCase();
        if (query && !text.includes(query.toLowerCase())) return false;
        const reported = f.lastReportDate === today;
        const issue = f.lastChickenCondition === 'issue';
        if (filter === 'reported' && !reported) return false;
        if (filter === 'missing' && reported) return false;
        if (filter === 'attention' && !issue) return false;
        return true;
      }),
    [farms, query, filter, today]
  );

  const wa = (phone: string) => {
    const clean = phone.replace(/\D/g, '').replace(/^0/, '62');
    return clean ? `https://wa.me/${clean}` : '#';
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-[#EAF2EC] border border-[#CDE3D3] text-xs font-black">
            PORTAL MITRA MARKETING
          </span>
          <h1 className="text-3xl md:text-4xl font-black font-['Outfit'] mt-2">Member Saya</h1>
          <p className="text-sm text-stone-500 mt-1">
            Hanya Member/Farm ID yang ditugaskan Admin kepada akun Mitra Anda.
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
        <Stat label="Total Member" value={farms.length} icon={Users} />
        <Stat
          label="Sudah Lapor"
          value={farms.filter((f) => f.lastReportDate === today).length}
          icon={CheckCircle2}
        />
        <Stat
          label="Belum Lapor"
          value={farms.filter((f) => f.lastReportDate !== today).length}
          icon={ClipboardCheck}
        />
        <Stat
          label="Dipantau Admin"
          value={farms.filter((f) => f.lastChickenCondition === 'issue').length}
          icon={AlertTriangle}
        />
      </div>

      <div className="bg-white border border-[#EFECE6] rounded-3xl p-4 md:p-5">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari Farm ID, nama, nomor WA, wilayah..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#E5E1D8] outline-none focus:ring-2 focus:ring-[#2D4A36]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['all', 'Semua'],
                ['reported', 'Sudah Lapor'],
                ['missing', 'Belum Lapor'],
                ['attention', 'Dipantau Admin'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black border ${
                  filter === id
                    ? 'bg-[#2D4A36] text-white border-[#2D4A36]'
                    : 'bg-white text-stone-600 border-[#E5E1D8]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center font-bold text-stone-400">Memuat Member...</div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-3xl border p-10 text-center text-stone-500">
            Tidak ada Member sesuai filter.
          </div>
        ) : (
          visible.map((f) => {
            const reported = f.lastReportDate === today;
            const issue = f.lastChickenCondition === 'issue';

            return (
              <div
                key={f.id}
                className="bg-white border border-[#EFECE6] rounded-3xl p-4 md:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#EAF2EC] flex items-center justify-center shrink-0">
                    <Warehouse className="w-6 h-6 text-[#2D4A36]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="font-mono font-black">{f.farmCode}</span>
                      {issue ? (
                        <Badge danger>DIPANTAU ADMIN</Badge>
                      ) : reported ? (
                        <Badge>SUDAH LAPOR</Badge>
                      ) : (
                        <Badge warn>BELUM LAPOR</Badge>
                      )}
                    </div>
                    <div className="font-black text-lg mt-1">{f.ownerName || 'Member Eggnest'}</div>
                    <div className="text-xs text-stone-500 mt-1">
                      {f.location || 'Lokasi belum lengkap'} • {f.activeChickens} ayam • laporan terakhir{' '}
                      {f.lastReportDate || 'belum ada'} • {f.lastEggCount} telur
                    </div>
                    <div className="text-xs font-bold text-[#2D4A36] mt-1">
                      Penjualan bulan ini: {f.monthSoldEggs} butir • {new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(f.monthSalesAmount)}
                    </div>
                    {issue && (
                      <div className="mt-2 text-xs font-bold text-amber-700">
                        Masalah teknis Member ditangani oleh Admin Eggnest.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {f.phone && (
                    <a
                      href={wa(f.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-2xl border font-black text-xs flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      WA Member
                    </a>
                  )}
                  <button
                    onClick={() =>
                      navigate(`/mitra/monitoring?farmId=${encodeURIComponent(f.id)}`)
                    }
                    className="px-4 py-2.5 rounded-2xl bg-[#EAF2EC] border border-[#CDE3D3] font-black text-xs"
                  >
                    Monitoring
                  </button>
                  {f.latitude != null && f.longitude != null ? (
                    <a
                      href={`https://www.google.com/maps?q=${f.latitude},${f.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-2xl bg-[#D4AF37] text-[#1B3022] font-black text-xs flex items-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      Lokasi Member
                    </a>
                  ) : (
                    <span className="px-4 py-2.5 rounded-2xl bg-stone-100 text-stone-400 font-black text-xs">
                      GPS belum diisi
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number; icon: any }> = ({
  label,
  value,
  icon: Icon,
}) => (
  <div className="bg-white border border-[#EFECE6] rounded-3xl p-4">
    <Icon className="w-5 h-5 text-[#2D4A36]" />
    <div className="text-3xl font-black mt-2">{value}</div>
    <div className="text-xs font-bold text-stone-500">{label}</div>
  </div>
);

const Badge: React.FC<{
  children: React.ReactNode;
  danger?: boolean;
  warn?: boolean;
}> = ({ children, danger, warn }) => (
  <span
    className={`text-[9px] font-black px-2 py-1 rounded-full border ${
      danger
        ? 'bg-rose-50 border-rose-200 text-rose-700'
        : warn
          ? 'bg-amber-50 border-amber-200 text-amber-700'
          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
    }`}
  >
    {children}
  </span>
);

export default MitraMembersPage;
