import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useFarm } from '../context/FarmContext';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  MessageCircle,
  RefreshCw,
  Users,
} from 'lucide-react';

const todayKey = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

const normalizeFarm = (f: any) => ({
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
  lastReportDate: String(f?.lastReportDate ?? f?.last_report_date ?? ''),
  lastEggCount: Number(f?.lastEggCount ?? f?.last_egg_count ?? 0),
  lastChickenCondition: String(
    f?.lastChickenCondition ?? f?.last_chicken_condition ?? ''
  ).toLowerCase(),
});

const whatsappUrl = (phone: string) => {
  const clean = String(phone || '').replace(/\D/g, '').replace(/^0/, '62');
  return clean ? `https://wa.me/${clean}` : '#';
};

export const MitraDashboardPage: React.FC = () => {
  const { currentUser, showToast } = useFarm();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<any>(null);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.getMitraDashboard();
      setPartner(res.partner || null);
      setFarms((res.farms || []).map(normalizeFarm));
    } catch (e: any) {
      showToast(e?.message || 'Gagal memuat Dashboard Mitra.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const today = todayKey();

  const stats = useMemo(() => {
    const reported = farms.filter((f) => f.lastReportDate === today).length;
    const missing = Math.max(0, farms.length - reported);
    const attention = farms.filter((f) => f.lastChickenCondition === 'issue').length;
    return { reported, missing, attention };
  }, [farms, today]);

  const priority = useMemo(
    () =>
      [...farms]
        .sort((a, b) => {
          const score = (f: any) =>
            (f.lastReportDate !== today ? 2 : 0) +
            (f.lastChickenCondition === 'issue' ? 1 : 0);
          return score(b) - score(a);
        })
        .slice(0, 5),
    [farms, today]
  );

  return (
    <div className="space-y-6 pb-10">
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <span className="inline-flex px-3 py-1 rounded-full bg-[#EAF2EC] border border-[#CDE3D3] text-[11px] font-black text-[#2D4A36] uppercase tracking-wide">
            Portal Mitra Marketing
          </span>
          <h1 className="mt-3 text-3xl md:text-4xl font-black font-['Outfit'] tracking-tight text-[#1B3022]">
            Selamat Datang, {partner?.name || currentUser?.fullName || 'Mitra'} 👋
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Pantau Member Anda, lakukan follow-up, dan jaga hubungan Member Eggnest.
          </p>
          <div className="mt-2 text-xs font-bold text-[#2D4A36]">
            {partner?.partnerCode ||
              partner?.partner_code ||
              currentUser?.partnerCode ||
              'MITRA EGGNEST'}{' '}
            • Marketing & Follow-up
          </div>
        </div>

        <button
          type="button"
          onClick={load}
          className="self-start lg:self-auto px-4 py-2.5 rounded-2xl bg-white border border-[#E5E1D8] font-bold text-sm flex items-center gap-2 hover:bg-[#FAF7F2]"
        >
          <RefreshCw className="w-4 h-4" />
          Perbarui Data
        </button>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} value={farms.length} label="Member Saya" note="Member yang ditugaskan Admin" />
        <StatCard icon={CheckCircle2} value={stats.reported} label="Sudah Lapor" note="Laporan hari ini" />
        <StatCard icon={ClipboardCheck} value={stats.missing} label="Belum Lapor" note="Perlu diingatkan" />
        <StatCard icon={MessageCircle} value={stats.attention} label="Perlu Follow-up" note="Ada kondisi yang perlu dipantau" />
      </section>

      {(stats.missing > 0 || stats.attention > 0) && (
        <section className="rounded-3xl border border-amber-200 bg-[#FFF9EA] p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white border border-amber-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="font-black text-[#1B3022]">Prioritas Follow-up Hari Ini</div>
              <p className="text-xs text-stone-600 mt-1">
                {stats.missing > 0 ? `${stats.missing} Member belum mengisi laporan. ` : ''}
                {stats.attention > 0
                  ? `${stats.attention} Member memiliki kondisi yang sedang dipantau Admin.`
                  : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/mitra/follow-up')}
            className="px-4 py-2.5 rounded-2xl bg-[#1B3022] text-white font-black text-xs"
          >
            Buka Follow-up
          </button>
        </section>
      )}

      <section className="bg-white rounded-3xl border border-[#EFECE6] overflow-hidden">
        <div className="p-5 border-b border-[#EFECE6] flex items-center justify-between">
          <div>
            <h2 className="font-black text-xl">Member Prioritas</h2>
            <p className="text-xs text-stone-500 mt-1">
              Member yang belum lapor atau membutuhkan follow-up ditampilkan lebih dulu.
            </p>
          </div>
          <button
            onClick={() => navigate('/mitra/members')}
            className="text-xs font-black text-[#2D4A36]"
          >
            Lihat Semua Member →
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm font-bold text-stone-400">Memuat...</div>
        ) : priority.length === 0 ? (
          <div className="py-12 text-center text-sm text-stone-500">
            Belum ada Member yang ditugaskan ke akun Mitra ini.
          </div>
        ) : (
          <div className="divide-y divide-[#EFECE6]">
            {priority.map((f) => {
              const reported = f.lastReportDate === today;
              const issue = f.lastChickenCondition === 'issue';
              return (
                <div key={f.id} className="p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-xs">{f.farmCode}</span>
                      {!reported && <Badge tone="amber">BELUM LAPOR</Badge>}
                      {issue && <Badge tone="rose">DIPANTAU ADMIN</Badge>}
                      {reported && !issue && <Badge tone="green">NORMAL</Badge>}
                    </div>
                    <div className="font-black text-lg mt-1">{f.ownerName || 'Member Eggnest'}</div>
                    <div className="text-xs text-stone-500 mt-1">
                      {f.location || 'Lokasi belum lengkap'} • produksi terakhir {f.lastEggCount} butir
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {f.phone && (
                      <a
                        href={whatsappUrl(f.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-2xl border font-black text-xs"
                      >
                        WhatsApp
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
                    {f.latitude != null && f.longitude != null && (
                      <a
                        href={`https://www.google.com/maps?q=${f.latitude},${f.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-2xl bg-[#D4AF37] text-[#1B3022] font-black text-xs flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4" />
                        Lokasi
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-3 gap-3">
        <QuickCard
          title="Member Saya"
          text="Lihat Member yang memang ditugaskan Admin kepada akun Anda."
          onClick={() => navigate('/mitra/members')}
        />
        <QuickCard
          title="Laporan Member"
          text="Lihat laporan kandang Member. Data hanya dapat dibaca oleh Mitra."
          onClick={() => navigate('/mitra/reports')}
        />
        <QuickCard
          title="Follow-up"
          text="Hubungi Member yang belum lapor atau perlu dijaga komunikasinya."
          onClick={() => navigate('/mitra/follow-up')}
        />
      </section>
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  value,
  label,
  note,
}: {
  icon: any;
  value: number;
  label: string;
  note: string;
}) => (
  <div className="bg-white border border-[#EFECE6] rounded-3xl p-4 md:p-5 shadow-sm">
    <div className="w-10 h-10 rounded-2xl bg-[#EAF2EC] flex items-center justify-center mb-3">
      <Icon className="w-5 h-5 text-[#2D4A36]" />
    </div>
    <div className="text-3xl font-black text-[#1B3022]">{value}</div>
    <div className="mt-1 text-xs font-black text-[#1B3022]">{label}</div>
    <div className="mt-0.5 text-[10px] text-stone-500">{note}</div>
  </div>
);

const QuickCard = ({
  title,
  text,
  onClick,
}: {
  title: string;
  text: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="text-left bg-white rounded-3xl border border-[#EFECE6] p-5 hover:border-[#CDE3D3] transition-colors"
  >
    <div className="font-black text-[#1B3022]">{title}</div>
    <div className="text-xs text-stone-500 mt-1 leading-relaxed">{text}</div>
  </button>
);

const Badge = ({
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
  return <span className={`text-[9px] font-black px-2 py-1 rounded-full border ${cls}`}>{children}</span>;
};

export default MitraDashboardPage;
