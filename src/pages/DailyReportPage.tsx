import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFarm } from '../context/FarmContext';
import { DailyReport } from '../types';
import { AlertTriangle, Calendar, Camera, CheckCircle2, Clock, Egg, Eye, FileCheck, HeartPulse, History, Plus, Save, Wheat, X } from 'lucide-react';

type Health = 'HEALTHY' | 'SICK' | 'DEAD';
type ChickenRow = { chickenNumber: number; condition: Health; problemTypes: string[]; customNotes: string };

const jakartaDateKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const formatLongDateId = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(y, (m || 1) - 1, d || 1));
};
const parseArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) { try { const x = JSON.parse(value); return Array.isArray(x) ? x : []; } catch { return []; } }
  return [];
};
const normalizeReport = (raw: any): DailyReport => ({
  ...raw,
  id: String(raw?.id ?? ''), farmId: String(raw?.farmId ?? raw?.farm_id ?? ''), date: String(raw?.date ?? raw?.reportDate ?? raw?.report_date ?? ''),
  eggCount: Number(raw?.eggCount ?? raw?.egg_count ?? 0), feedKg: Number(raw?.feedKg ?? raw?.feed_kg ?? 0),
  chickenCondition: raw?.chickenCondition ?? raw?.chicken_condition ?? 'healthy', issueTypes: parseArray(raw?.issueTypes ?? raw?.issue_types),
  notes: raw?.notes ?? undefined, photoUrl: raw?.photoUrl ?? raw?.photo_url ?? undefined, videoUrl: raw?.videoUrl ?? raw?.video_url ?? undefined,
  productivityRate: Number(raw?.productivityRate ?? raw?.productivity_rate ?? 0),
  layingChickens: parseArray(raw?.layingChickens ?? raw?.laying_chickens).map(Number), chickenReports: parseArray(raw?.chickenReports ?? raw?.chicken_reports),
  reportedById: raw?.reportedById ?? raw?.reported_by_id ?? undefined, reportedByName: raw?.reportedByName ?? raw?.reported_by_name ?? undefined,
  reportedByRole: raw?.reportedByRole ?? raw?.reported_by_role ?? undefined, createdAt: raw?.createdAt ?? raw?.created_at ?? '', updatedAt: raw?.updatedAt ?? raw?.updated_at ?? '',
});

const problemOptions = ['Lemas', 'Tidak mau makan', 'Diare', 'Pilek / ngorok', 'Luka', 'Lainnya'];

export const DailyReportPage: React.FC = () => {
  const { farm, reports, addDailyReport, uploadPhoto, showToast } = useFarm();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [monthFilter, setMonthFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const activeChickens = Math.max(1, Number(farm.activeChickens || farm.initialChickens || 12));
  const today = jakartaDateKey();

  const normalizedReports = useMemo(() => reports.map(normalizeReport).sort((a, b) => String(b.date).localeCompare(String(a.date))), [reports]);
  const todayReport = normalizedReports.find((r) => r.date === today);
  const latest = normalizedReports[0];

  const freshRows = (): ChickenRow[] => Array.from({ length: activeChickens }, (_, i) => ({ chickenNumber: i + 1, condition: 'HEALTHY', problemTypes: [], customNotes: '' }));
  const [date, setDate] = useState(today);
  const [feedKg, setFeedKg] = useState('');
  const [laying, setLaying] = useState<number[]>([]);
  const [chickenRows, setChickenRows] = useState<ChickenRow[]>(freshRows);
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const openForm = (report?: DailyReport) => {
    // Jika report dikirim = mode EDIT, data lama dimuat.
    // Jika tanpa report = mode LAPOR BARU, semua pilihan bertelur dikosongkan.
    const source = report;
    const targetDate = source?.date || today;

    setFormMode(source ? 'edit' : 'new');
    setDate(targetDate);
    setFeedKg(source ? String(source.feedKg ?? '') : '');
    setLaying(source?.layingChickens ? [...source.layingChickens] : []);

    const existing = new Map<number, any>(
      (source?.chickenReports || []).map((r: any) => [Number(r.chickenNumber), r])
    );

    setChickenRows(
      Array.from({ length: activeChickens }, (_, i) => {
        const n = i + 1;
        const row = existing.get(n);
        return {
          chickenNumber: n,
          condition: (row?.condition || 'HEALTHY') as Health,
          problemTypes: parseArray(row?.problemTypes),
          customNotes: String(row?.customNotes || ''),
        };
      })
    );

    setNotes(String(source?.notes || ''));
    setPhotoUrl(String(source?.photoUrl || ''));
    setIsFormOpen(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('new') === 'today') {
      openForm();
      navigate('/reports', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const setHealth = (n: number, condition: Health) => setChickenRows((prev) => prev.map((r) => r.chickenNumber === n ? { ...r, condition, problemTypes: condition === 'HEALTHY' ? [] : r.problemTypes, customNotes: condition === 'HEALTHY' ? '' : r.customNotes } : r));
  const toggleProblem = (n: number, problem: string) => setChickenRows((prev) => prev.map((r) => r.chickenNumber === n ? { ...r, problemTypes: r.problemTypes.includes(problem) ? r.problemTypes.filter((x) => x !== problem) : [...r.problemTypes, problem] } : r));
  const toggleLaying = (n: number) => setLaying((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].sort((a, b) => a - b));

  const handlePhoto = async (file?: File) => {
    if (!file) return;
    try { setUploading(true); setPhotoUrl(await uploadPhoto(file)); showToast('📷 Foto laporan berhasil diunggah.'); }
    catch (e: any) { showToast(`⚠️ ${e?.message || 'Gagal mengunggah foto.'}`); }
    finally { setUploading(false); }
  };

  const save = async () => {
    const feed = Number(String(feedKg).replace(',', '.'));
    if (!Number.isFinite(feed) || feed <= 0) return showToast('⚠️ Masukkan jumlah pakan hari ini.');
    setSaving(true);
    const result = await addDailyReport({
      date,
      eggCount: laying.length,
      feedKg: feed,
      chickenCondition: chickenRows.some((r) => r.condition !== 'HEALTHY') ? 'issue' : 'healthy',
      layingChickens: laying,
      chickenReports: chickenRows,
      notes: notes.trim() || undefined,
      photoUrl: photoUrl || undefined,
    } as any);
    setSaving(false);
    if (result.success) setIsFormOpen(false);
  };

  const monthOptions = useMemo(() => Array.from(new Set(normalizedReports.map((r) => r.date.slice(0, 7)).filter((v) => /^\d{4}-\d{2}$/.test(v)))).sort().reverse(), [normalizedReports]);
  const visibleReports = monthFilter === 'all' ? normalizedReports : normalizedReports.filter((r) => r.date.startsWith(monthFilter));
  const monthLabel = (key: string) => { const [y, m] = key.split('-').map(Number); return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1)); };

  return (
    <div className="space-y-6 pb-24 md:pb-10">
      <section className="rounded-3xl bg-[#1B3022] text-white p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div><div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">Laporan Harian Member</div><h1 className="text-2xl sm:text-3xl font-black font-['Outfit'] mt-1">Kondisi Kandang Hari Ini</h1><p className="text-sm text-white/70 mt-2">Cukup tandai Ayam #1–#{activeChickens}: bertelur atau tidak, lalu pilih sehat/sakit.</p></div>
          <button onClick={() => openForm()} className="min-h-14 px-5 rounded-2xl bg-[#D4AF37] text-[#1B3022] font-black flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Isi Laporan Hari Ini</button>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<Egg className="w-5 h-5 text-[#D4AF37]" />} value={`${latest?.eggCount ?? 0}`} label="Telur laporan terakhir" />
        <Stat icon={<Wheat className="w-5 h-5 text-[#2D4A36]" />} value={`${latest?.feedKg ?? 0} kg`} label="Pakan laporan terakhir" />
        <Stat icon={<HeartPulse className="w-5 h-5 text-[#2D4A36]" />} value={!latest ? '-' : latest.chickenCondition === 'healthy' ? 'Baik' : 'Dipantau'} label="Kondisi ayam" />
        <Stat icon={<Clock className="w-5 h-5 text-[#2D4A36]" />} value={latest?.date ? formatLongDateId(latest.date) : 'Belum ada'} label="Pembaruan terakhir" small />
      </section>

      <section className="rounded-3xl bg-white border border-[#EFECE6] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5"><div><div className="flex items-center gap-2"><History className="w-5 h-5" /><h2 className="text-xl font-black">Riwayat Laporan</h2></div><p className="text-xs text-stone-500 mt-1">Satu tanggal = satu laporan. Laporan hari ini masih bisa diperbaiki.</p></div><select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border bg-[#FAF7F2] font-bold text-sm"><option value="all">Semua Bulan</option>{monthOptions.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}</select></div>
        {visibleReports.length === 0 ? <div className="py-12 text-center"><FileCheck className="w-10 h-10 mx-auto text-stone-300 mb-3" /><div className="font-black text-stone-600">Belum ada laporan</div><button onClick={() => openForm()} className="mt-4 px-5 py-3 rounded-2xl bg-[#D4AF37] font-black">Isi Laporan Pertama</button></div> : <div className="space-y-3">{visibleReports.map((report) => { const issues = (report.chickenReports || []).filter((r: any) => r.condition !== 'HEALTHY'); return <button key={report.id} onClick={() => setSelectedReport(report)} className="w-full text-left rounded-2xl border p-4 hover:bg-[#FAFCFA]"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><div className="font-black">{formatLongDateId(report.date)}</div><div className="text-xs text-stone-500 mt-1">{report.date === today ? 'Laporan hari ini' : 'Laporan Member'}</div></div><div className="flex flex-wrap gap-2"><Badge>🥚 {report.eggCount} butir</Badge><Badge>🌾 {report.feedKg} kg</Badge>{issues.length ? <span className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black">⚠ {issues.length} ayam</span> : <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black">✓ Semua sehat</span>}<Eye className="w-4 h-4 text-stone-400 self-center" /></div></div></button>; })}</div>}
      </section>

      {isFormOpen && <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm overflow-y-auto"><div className="min-h-full p-2 sm:p-5 flex items-start justify-center"><div className="w-full max-w-4xl bg-[#FDFBF7] rounded-3xl shadow-2xl overflow-hidden my-2">
        <div className="sticky top-0 z-20 bg-[#1B3022] text-white px-5 py-4 flex items-center justify-between"><div><div className="text-[10px] text-[#D4AF37] font-black uppercase">{formMode === 'edit' ? 'Edit Laporan Harian' : 'Laporan Baru'}</div><div className="font-black text-lg">{formatLongDateId(date)}</div></div><button onClick={() => setIsFormOpen(false)} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><X className="w-5 h-5" /></button></div>
        <div className="p-4 sm:p-6 space-y-5">
          <div className="rounded-2xl bg-[#EAF2EC] border border-[#CDE3D3] p-4"><div className="font-black text-[#1B3022]">Cara mengisi</div><p className="text-xs text-stone-600 mt-1">Tekan <b>Bertelur</b> pada ayam yang menghasilkan telur. Kondisi awal semua ayam = <b>Sehat</b>; ubah hanya jika sakit atau mati.</p></div>
          <div><div className="flex items-center justify-between mb-3"><h3 className="font-black text-lg">Ayam #1–#{activeChickens}</h3><span className="px-3 py-1.5 rounded-full bg-[#D4AF37] text-[#1B3022] text-xs font-black">Total telur: {laying.length}</span></div><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{chickenRows.map((row) => <div key={row.chickenNumber} className={`rounded-2xl border-2 p-3 ${row.condition === 'SICK' ? 'border-amber-300 bg-amber-50' : row.condition === 'DEAD' ? 'border-rose-300 bg-rose-50' : 'border-[#E5E1D8] bg-white'}`}><div className="flex items-center justify-between"><span className="font-black text-lg text-[#1B3022]">Ayam #{row.chickenNumber}</span>{laying.includes(row.chickenNumber) && <Egg className="w-5 h-5 text-[#C2841E]" />}</div><button type="button" onClick={() => toggleLaying(row.chickenNumber)} className={`mt-3 w-full min-h-11 rounded-xl font-black text-xs border ${laying.includes(row.chickenNumber) ? 'bg-[#D4AF37] border-[#C39A21] text-[#1B3022]' : 'bg-stone-50 border-stone-200 text-stone-500'}`}>{laying.includes(row.chickenNumber) ? '🥚 Bertelur ✓' : '○ Tidak Bertelur'}</button><div className="grid grid-cols-3 gap-1 mt-2"><HealthButton active={row.condition === 'HEALTHY'} onClick={() => setHealth(row.chickenNumber, 'HEALTHY')} label="Sehat" /><HealthButton active={row.condition === 'SICK'} onClick={() => setHealth(row.chickenNumber, 'SICK')} label="Sakit" warning /><HealthButton active={row.condition === 'DEAD'} onClick={() => setHealth(row.chickenNumber, 'DEAD')} label="Mati" danger /></div>{row.condition !== 'HEALTHY' && <div className="mt-3 pt-3 border-t space-y-2"><div className="flex flex-wrap gap-1">{problemOptions.map((p) => <button key={p} type="button" onClick={() => toggleProblem(row.chickenNumber, p)} className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${row.problemTypes.includes(p) ? 'bg-[#1B3022] text-white' : 'bg-white text-stone-600'}`}>{p}</button>)}</div><input value={row.customNotes} onChange={(e) => setChickenRows((prev) => prev.map((x) => x.chickenNumber === row.chickenNumber ? { ...x, customNotes: e.target.value } : x))} placeholder="Catatan singkat..." className="w-full px-3 py-2 rounded-xl border text-xs" /></div>}</div>)}</div></div>
          <div className="grid sm:grid-cols-2 gap-4"><label className="space-y-2"><span className="text-sm font-black">Pakan hari ini (kg) *</span><input type="number" step="0.01" min="0" value={feedKg} onChange={(e) => setFeedKg(e.target.value)} placeholder="Contoh: 1.2" className="w-full px-4 py-3 rounded-2xl border bg-white font-bold" /></label><label className="space-y-2"><span className="text-sm font-black">Foto kandang (opsional)</span><div className="relative min-h-12 rounded-2xl border bg-white flex items-center justify-center gap-2 font-bold text-sm"><Camera className="w-4 h-4" />{uploading ? 'Mengunggah...' : photoUrl ? 'Ganti Foto' : 'Tambah Foto'}<input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhoto(e.target.files?.[0])} className="absolute inset-0 opacity-0 cursor-pointer" /></div></label></div>
          <label className="space-y-2 block"><span className="text-sm font-black">Catatan tambahan (opsional)</span><textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Contoh: kandang sudah dibersihkan, ayam #3 terlihat kurang aktif..." className="w-full px-4 py-3 rounded-2xl border bg-white resize-none" /></label>
        </div>
        <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3"><button onClick={() => setIsFormOpen(false)} className="flex-1 min-h-12 rounded-2xl border font-bold">Batal</button><button onClick={save} disabled={saving || uploading} className="flex-[2] min-h-12 rounded-2xl bg-[#D4AF37] text-[#1B3022] font-black flex items-center justify-center gap-2 disabled:opacity-60"><Save className="w-5 h-5" />{saving ? 'Menyimpan...' : formMode === 'edit' ? 'Simpan Perubahan' : 'Simpan Laporan'}</button></div>
      </div></div></div>}

      {selectedReport && <ReportDetail report={selectedReport} activeChickens={activeChickens} onClose={() => setSelectedReport(null)} onEdit={() => { setSelectedReport(null); openForm(selectedReport); }} today={today} />}
    </div>
  );
};

const Stat = ({ icon, value, label, small }: any) => <div className="bg-white border border-[#EFECE6] rounded-2xl p-4">{icon}<div className={`${small ? 'text-sm' : 'text-2xl'} font-black mt-2`}>{value}</div><div className="text-xs text-stone-500 font-semibold">{label}</div></div>;
const Badge = ({ children }: any) => <span className="px-3 py-1.5 rounded-full bg-[#FAF7F2] text-[#1B3022] border text-xs font-black">{children}</span>;
const HealthButton = ({ active, onClick, label, warning, danger }: any) => <button type="button" onClick={onClick} className={`min-h-9 rounded-lg text-[10px] font-black border ${active ? danger ? 'bg-rose-600 text-white border-rose-600' : warning ? 'bg-amber-500 text-white border-amber-500' : 'bg-[#2D4A36] text-white border-[#2D4A36]' : 'bg-white text-stone-500 border-stone-200'}`}>{label}</button>;

const ReportDetail = ({ report, activeChickens, onClose, onEdit, today }: any) => {
  const healthMap = new Map<number, any>((report.chickenReports || []).map((r: any) => [Number(r.chickenNumber), r]));
  return <div className="fixed inset-0 z-[140] bg-black/60 overflow-y-auto"><div className="min-h-full p-3 sm:p-6 flex items-start justify-center"><div className="w-full max-w-3xl bg-[#FDFBF7] rounded-3xl overflow-hidden my-3"><div className="bg-[#1B3022] text-white px-5 py-4 flex justify-between"><div><div className="text-[10px] text-[#D4AF37] font-black uppercase">Detail Laporan</div><div className="font-black text-lg">{formatLongDateId(report.date)}</div></div><button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><X className="w-5 h-5" /></button></div><div className="p-4 sm:p-6 space-y-4"><div className="grid grid-cols-3 gap-2"><Stat icon={<Egg className="w-4 h-4" />} value={report.eggCount} label="Telur" /><Stat icon={<Wheat className="w-4 h-4" />} value={`${report.feedKg} kg`} label="Pakan" /><Stat icon={<HeartPulse className="w-4 h-4" />} value={`${Math.round(report.productivityRate || 0)}%`} label="Produktivitas" /></div><div className="rounded-2xl bg-white border p-4"><h3 className="font-black mb-3">Kondisi Ayam</h3><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">{Array.from({ length: activeChickens }, (_, i) => i + 1).map((n) => { const row = healthMap.get(n); const condition = row?.condition || 'HEALTHY'; const laid = (report.layingChickens || []).includes(n); return <div key={n} className={`rounded-xl border p-3 ${condition === 'SICK' ? 'bg-amber-50 border-amber-200' : condition === 'DEAD' ? 'bg-rose-50 border-rose-200' : 'bg-stone-50'}`}><div className="font-black">Ayam #{n}</div><div className="text-xs mt-1">{laid ? '🥚 Bertelur' : '○ Tidak bertelur'}</div><div className={`text-xs font-black mt-1 ${condition === 'HEALTHY' ? 'text-emerald-700' : 'text-rose-700'}`}>{condition === 'HEALTHY' ? '✓ Sehat' : condition === 'DEAD' ? '⚠ Mati' : '⚠ Sakit'}</div></div>; })}</div></div>{report.notes && <div className="rounded-2xl bg-white border p-4"><div className="text-xs font-black text-stone-500">CATATAN</div><p className="text-sm mt-1">{report.notes}</p></div>}{report.photoUrl && <img src={report.photoUrl} alt="Foto laporan" className="w-full max-h-96 object-contain rounded-2xl bg-white border" />}</div><div className="sticky bottom-0 bg-white border-t p-4 flex gap-3"><button onClick={onClose} className="flex-1 min-h-12 rounded-2xl border font-black">Oke</button>{report.date === today && <button onClick={onEdit} className="flex-1 min-h-12 rounded-2xl bg-[#D4AF37] text-[#1B3022] font-black">Edit Hari Ini</button>}</div></div></div></div>;
};

export default DailyReportPage;
