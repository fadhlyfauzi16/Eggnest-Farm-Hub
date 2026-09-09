import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useFarm } from '../context/FarmContext';
import {
  CalendarCheck,
  CheckCircle2,
  MessageCircle,
  Phone,
  RefreshCw,
  Save,
  Search,
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
  lastReportDate: String(f?.lastReportDate ?? f?.last_report_date ?? ''),
  lastEggCount: Number(f?.lastEggCount ?? f?.last_egg_count ?? 0),
  lastChickenCondition: String(
    f?.lastChickenCondition ?? f?.last_chicken_condition ?? ''
  ).toLowerCase(),
});

const followupKey = (farmId: string) => `eggnest:mitra:followup:${farmId}`;

const readFollowup = (farmId: string) => {
  try {
    const raw = localStorage.getItem(followupKey(farmId));
    return raw
      ? JSON.parse(raw)
      : { date: '', result: '', nextDate: '', note: '' };
  } catch {
    return { date: '', result: '', nextDate: '', note: '' };
  }
};

const wa = (phone: string, name: string) => {
  const clean = String(phone || '').replace(/\D/g, '').replace(/^0/, '62');
  const msg = encodeURIComponent(
    `Halo ${name || 'Bapak/Ibu'}, saya dari Mitra Eggnest. Saya ingin follow-up kondisi dan aktivitas kandang hari ini.`
  );
  return clean ? `https://wa.me/${clean}?text=${msg}` : '#';
};

export const MitraFollowUpPage: React.FC = () => {
  const { showToast } = useFarm();
  const [sp] = useSearchParams();
  const [farms, setFarms] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [onlyPriority, setOnlyPriority] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(sp.get('farmId'));
  const [form, setForm] = useState({
    date: todayKey(),
    result: 'Terhubung',
    nextDate: '',
    note: '',
  });
  const [refreshTick, setRefreshTick] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.getMitraDashboard();
      setFarms((res.farms || []).map(nf));
    } catch (e: any) {
      showToast(e?.message || 'Gagal memuat daftar follow-up.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (editingId) {
      const saved = readFollowup(editingId);
      setForm({
        date: saved.date || todayKey(),
        result: saved.result || 'Terhubung',
        nextDate: saved.nextDate || '',
        note: saved.note || '',
      });
    }
  }, [editingId, refreshTick]);

  const today = todayKey();

  const rows = useMemo(
    () =>
      farms.map((f) => {
        const followup = readFollowup(f.id);
        const reasons: string[] = [];
        if (f.lastReportDate !== today) reasons.push('Belum mengisi laporan hari ini');
        if (f.lastChickenCondition === 'issue') reasons.push('Kondisi kandang sedang dipantau Admin');
        if (!followup.date) reasons.push('Belum pernah dicatat follow-up');
        if (followup.nextDate && followup.nextDate <= today) reasons.push('Jadwal follow-up tiba');
        return { ...f, followup, reasons, priority: reasons.length > 0 };
      }),
    [farms, today, refreshTick]
  );

  const visible = useMemo(
    () =>
      rows.filter((r) => {
        if (onlyPriority && !r.priority) return false;
        const text = `${r.farmCode} ${r.ownerName} ${r.location}`.toLowerCase();
        return !query || text.includes(query.toLowerCase());
      }),
    [rows, query, onlyPriority]
  );

  const save = (farmId: string) => {
    localStorage.setItem(followupKey(farmId), JSON.stringify(form));
    setEditingId(null);
    setRefreshTick((v) => v + 1);
    showToast('Catatan follow-up tersimpan di perangkat ini.');
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-[#EAF2EC] border border-[#CDE3D3] text-xs font-black">
            MARKETING & RELATIONSHIP
          </span>
          <h1 className="text-3xl md:text-4xl font-black mt-2 font-['Outfit']">Follow-up Member</h1>
          <p className="text-sm text-stone-500 mt-1">
            Daftar Member yang perlu dihubungi dan catatan hasil komunikasi Mitra.
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

      <div className="rounded-3xl bg-[#FFF8E8] border border-amber-200 p-4 text-xs text-amber-800">
        Follow-up Mitra berfokus pada komunikasi, kedisiplinan laporan, hubungan Member, dan kebutuhan
        pemasaran. <strong>Masalah teknis ayam tetap ditangani Admin Eggnest.</strong>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat icon={MessageCircle} label="Perlu Follow-up" value={rows.filter((r) => r.priority).length} />
        <Stat icon={CheckCircle2} label="Sudah Dicatat" value={rows.filter((r) => r.followup.date).length} />
        <Stat
          icon={CalendarCheck}
          label="Jadwal Hari Ini"
          value={rows.filter((r) => r.followup.nextDate === today).length}
        />
      </div>

      <div className="bg-white rounded-3xl border border-[#EFECE6] p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-stone-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari Farm ID, Member, wilayah..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#E5E1D8]"
          />
        </div>
        <button
          onClick={() => setOnlyPriority((v) => !v)}
          className={`px-4 py-3 rounded-2xl border text-xs font-black ${
            onlyPriority
              ? 'bg-[#2D4A36] border-[#2D4A36] text-white'
              : 'bg-white border-[#E5E1D8] text-stone-600'
          }`}
        >
          {onlyPriority ? 'Hanya Prioritas' : 'Semua Member'}
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center font-bold text-stone-400">Memuat...</div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-3xl border p-10 text-center text-stone-500">
            Tidak ada Member yang perlu ditampilkan.
          </div>
        ) : (
          visible.map((r) => (
            <div key={r.id} className="bg-white rounded-3xl border border-[#EFECE6] p-4 md:p-5">
              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-mono font-black text-xs">{r.farmCode}</div>
                  <div className="font-black text-lg mt-1">{r.ownerName}</div>
                  <div className="text-xs text-stone-500 mt-1">{r.location || 'Lokasi belum lengkap'}</div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {r.reasons.length ? (
                      r.reasons.map((reason: string) => (
                        <span
                          key={reason}
                          className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700"
                        >
                          {reason}
                        </span>
                      ))
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                        Hubungan Member terpantau
                      </span>
                    )}
                  </div>

                  {r.followup.date && (
                    <div className="mt-3 text-xs text-stone-600">
                      Follow-up terakhir: <strong>{r.followup.date}</strong> • {r.followup.result || '-'}
                      {r.followup.note ? ` • ${r.followup.note}` : ''}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {r.phone && (
                    <a
                      href={wa(r.phone, r.ownerName)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-2xl border text-xs font-black flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() => setEditingId(editingId === r.id ? null : r.id)}
                    className="px-4 py-2.5 rounded-2xl bg-[#1B3022] text-white text-xs font-black"
                  >
                    Catat Follow-up
                  </button>
                </div>
              </div>

              {editingId === r.id && (
                <div className="mt-5 pt-5 border-t border-[#EFECE6] grid md:grid-cols-2 gap-3">
                  <label className="text-xs font-black">
                    Tanggal Follow-up
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="mt-2 w-full p-3 rounded-2xl border"
                    />
                  </label>
                  <label className="text-xs font-black">
                    Hasil Komunikasi
                    <select
                      value={form.result}
                      onChange={(e) => setForm({ ...form, result: e.target.value })}
                      className="mt-2 w-full p-3 rounded-2xl border"
                    >
                      <option>Terhubung</option>
                      <option>Belum Terhubung</option>
                      <option>Minta Dihubungi Kembali</option>
                      <option>Perlu Kunjungan</option>
                    </select>
                  </label>
                  <label className="text-xs font-black">
                    Follow-up Berikutnya
                    <input
                      type="date"
                      value={form.nextDate}
                      onChange={(e) => setForm({ ...form, nextDate: e.target.value })}
                      className="mt-2 w-full p-3 rounded-2xl border"
                    />
                  </label>
                  <label className="text-xs font-black">
                    Catatan Singkat
                    <input
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      placeholder="Contoh: Member minta dihubungi Jumat sore"
                      className="mt-2 w-full p-3 rounded-2xl border"
                    />
                  </label>
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      onClick={() => save(r.id)}
                      className="px-5 py-3 rounded-2xl bg-[#D4AF37] text-[#1B3022] font-black text-xs flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Simpan Follow-up
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="rounded-2xl border border-[#EFECE6] bg-[#FAF7F2] p-4 text-[11px] text-stone-500">
        Catatan follow-up pada versi ini disimpan di browser/perangkat Mitra. Untuk penggunaan produksi
        lintas perangkat, tahap berikutnya sebaiknya dibuat tabel follow-up di database agar Admin juga
        dapat melihat histori aktivitas Mitra.
      </div>
    </div>
  );
};

const Stat = ({ icon: Icon, label, value }: { icon: any; label: string; value: number }) => (
  <div className="bg-white border border-[#EFECE6] rounded-3xl p-4">
    <Icon className="w-5 h-5 text-[#2D4A36]" />
    <div className="text-3xl font-black mt-2">{value}</div>
    <div className="text-xs font-bold text-stone-500">{label}</div>
  </div>
);

export default MitraFollowUpPage;
