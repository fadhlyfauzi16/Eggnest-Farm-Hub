import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { api } from '../services/api';
import { useFarm } from '../context/FarmContext';
import { Activity, Award, Calendar, CheckCircle2, Copy, Download, ExternalLink, Layers, MapPin, Navigation, Pencil, Printer, QrCode, Save, ShieldCheck, Sparkles, User, Warehouse, X } from 'lucide-react';

const CHICKEN_TYPE_OPTIONS = ['Ayam Petelur Cokelat', 'Ayam Petelur Putih', 'Ayam Kampung Petelur', 'Ayam Arab Petelur', 'Ayam Joper', 'Ayam Petelur Lainnya'];
const hasCompleteFarmData = (farm: any) => Boolean(String(farm?.location || '').trim() && String(farm?.fullAddress || '').trim() && Number.isFinite(Number(farm?.latitude)) && Number.isFinite(Number(farm?.longitude)) && String(farm?.chickenBreed || '').trim() && Number(farm?.activeChickens) > 0 && Number(farm?.currentAgeWeeks) > 0);

export const FarmProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { farm, farmScore, reports, chickenCurrentAgeWeeks, setActivePage, showToast, updateMyFarm } = useFarm();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [addressEditing, setAddressEditing] = useState(false);
  const [form, setForm] = useState<any>({ location: '', fullAddress: '', province: '', regency: '', district: '', village: '', latitude: null, longitude: null, chickenBreed: '', activeChickens: 12, currentAgeWeeks: 18 });
  const dataComplete = hasCompleteFarmData(farm);
  const farmScoreReady = reports.length >= 7;

  const syncForm = () => setForm({
    location: String(farm.location || ''), fullAddress: String(farm.fullAddress || ''), province: String((farm as any).province || ''), regency: String((farm as any).regency || farm.location || ''), district: String((farm as any).district || ''), village: String((farm as any).village || ''),
    latitude: farm.latitude == null ? null : Number(farm.latitude), longitude: farm.longitude == null ? null : Number(farm.longitude), chickenBreed: String(farm.chickenBreed || 'Ayam Petelur Cokelat'), activeChickens: Number(farm.activeChickens || 12), currentAgeWeeks: Number(chickenCurrentAgeWeeks || farm.currentAgeWeeks || 18),
  });
  useEffect(() => { syncForm(); }, [farm.id, farm.location, farm.fullAddress, farm.latitude, farm.longitude, farm.chickenBreed, farm.activeChickens, farm.currentAgeWeeks, chickenCurrentAgeWeeks]);
  useEffect(() => { if (!farm.farmCode) return; QRCode.toDataURL(`${window.location.origin}/farm?code=${encodeURIComponent(farm.farmCode)}`, { width: 300, margin: 2, color: { dark: '#1B3022', light: '#FFFFFF' } }).then(setQrDataUrl).catch(console.error); }, [farm.farmCode]);

  const captureGps = () => {
    if (!navigator.geolocation) return showToast('⚠️ Browser/perangkat ini tidak mendukung GPS.');
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const latitude = Number(pos.coords.latitude.toFixed(7)); const longitude = Number(pos.coords.longitude.toFixed(7));
      setForm((x: any) => ({ ...x, latitude, longitude }));
      try {
        const res = await api.reverseGeocode(latitude, longitude);
        const loc = res.location;
        setForm((x: any) => ({ ...x, latitude, longitude, fullAddress: loc.fullAddress || x.fullAddress, location: loc.regency || loc.city || x.location, province: loc.province || '', regency: loc.regency || loc.city || '', district: loc.district || '', village: loc.village || '' }));
        setAddressEditing(false);
        showToast('📍 Lokasi dan alamat kandang berhasil diambil otomatis.');
      } catch (e: any) {
        showToast('📍 Titik GPS berhasil diambil. Alamat otomatis belum tersedia, Anda boleh mengedit alamat manual.');
        setAddressEditing(true);
      } finally { setGpsLoading(false); }
    }, (error) => { setGpsLoading(false); showToast(error.code === error.PERMISSION_DENIED ? '⚠️ Izin lokasi ditolak. Aktifkan izin lokasi browser.' : '⚠️ Lokasi belum berhasil didapatkan.'); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };

  const saveProfile = async () => {
    if (form.latitude == null || form.longitude == null) return showToast('⚠️ Tekan Ambil Lokasi Kandang terlebih dahulu.');
    if (!String(form.fullAddress).trim()) return showToast('⚠️ Alamat kandang belum tersedia.');
    if (!String(form.location).trim()) return showToast('⚠️ Kabupaten/Kota belum tersedia.');
    setSaving(true);
    try {
      const result = await updateMyFarm({ location: String(form.location).trim(), fullAddress: String(form.fullAddress).trim(), latitude: Number(form.latitude), longitude: Number(form.longitude), chickenBreed: String(form.chickenBreed).trim(), activeChickens: Number(form.activeChickens), currentAgeWeeks: Number(form.currentAgeWeeks), province: form.province, regency: form.regency, district: form.district, village: form.village } as any);
      if (result.success) setEditing(false);
    } finally { setSaving(false); }
  };

  const copyFarmCode = () => { if (farm.farmCode) { navigator.clipboard.writeText(farm.farmCode); showToast(`📋 Farm ID ${farm.farmCode} disalin.`); } };
  const downloadQr = () => { if (!qrDataUrl) return; const a = document.createElement('a'); a.href = qrDataUrl; a.download = `QR-FARM-${farm.farmCode}.png`; a.click(); };
  const printQr = () => { if (!qrDataUrl) return; const w = window.open('', '_blank'); if (!w) return; w.document.write(`<!doctype html><html><body style="font-family:Arial;text-align:center;padding:40px"><h2>EGGNEST FARM HUB</h2><img width="240" src="${qrDataUrl}"/><h2>${farm.farmCode}</h2><p>${farm.ownerName || ''}</p><script>window.onload=()=>window.print()</script></body></html>`); w.document.close(); };

  return <div className="space-y-6 sm:space-y-8 pb-24 md:pb-12">
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"><div><span className="px-3 py-1 bg-[#EAF2EC] text-[#1B3022] text-xs font-bold rounded-full border">Kandang Milik Member</span><h1 className="text-2xl md:text-4xl font-extrabold text-[#1B3022] mt-1">Profil Kandang</h1><p className="text-stone-600 text-sm mt-1">Lokasi otomatis dari GPS, data kandang tetap bisa dikoreksi bila diperlukan.</p></div><button onClick={() => { syncForm(); setEditing(true); }} className="px-5 py-3 rounded-2xl bg-[#1B3022] text-white font-black flex items-center justify-center gap-2"><Pencil className="w-4 h-4 text-[#D4AF37]" /> Edit Data Kandang</button></div>

    {!dataComplete && <div className="rounded-3xl border-2 border-[#E5B52B] bg-[#FFF8E8] p-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between"><div><h2 className="font-black">Lengkapi Lokasi Kandang</h2><p className="text-sm text-stone-600 mt-1">Cukup tekan “Ambil Lokasi Kandang”. Alamat akan diisi otomatis dari titik GPS.</p></div><button onClick={() => { syncForm(); setEditing(true); setTimeout(captureGps, 100); }} className="px-5 py-3 rounded-2xl bg-[#D4AF37] font-black">📍 Ambil Lokasi</button></div>}

    <div className="grid lg:grid-cols-12 gap-6"><div className="lg:col-span-8 bg-white rounded-3xl border p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5"><div className="flex items-center gap-4"><div className="w-16 h-16 rounded-2xl bg-[#1B3022] flex items-center justify-center"><Warehouse className="w-8 h-8 text-[#D4AF37]" /></div><div><span className="text-xs text-stone-500 font-bold">FARM ID RESMI</span><div className="flex items-center gap-2"><h2 className="text-2xl md:text-3xl font-black">{farm.farmCode || '-'}</h2><button onClick={copyFarmCode}><Copy className="w-4 h-4" /></button></div></div></div><span className={`text-xs font-black px-3 py-1.5 rounded-full border ${dataComplete ? 'bg-[#EAF2EC] text-[#1B3022]' : 'bg-[#FFF8E8] text-[#A16207]'}`}>{dataComplete ? '✓ SIAP LAPOR' : '⚠ BELUM LENGKAP'}</span></div>
      <div className="grid sm:grid-cols-2 gap-4"><Info icon={<User />} label="Pemilik Kandang" value={farm.ownerName || '-'} /><Info icon={<MapPin />} label="Kabupaten / Kota" value={farm.location || 'Belum diambil'} /><Info icon={<Calendar />} label="Tanggal Aktivasi" value={farm.activationDate || '-'} /><Info icon={<Layers />} label="Jenis Ayam" value={farm.chickenBreed || '-'} /><Info icon={<Activity />} label="Jumlah Ayam Aktif" value={`${farm.activeChickens || 0} ekor`} /><Info icon={<Sparkles />} label="Usia Ayam" value={`${chickenCurrentAgeWeeks || 0} minggu`} /></div>
      {farm.latitude != null && farm.longitude != null && <div className="rounded-2xl overflow-hidden border"><div className="p-4 bg-[#F7F4EE]"><div className="font-black">📍 Lokasi Kandang</div><p className="text-sm text-stone-600 mt-1">{farm.fullAddress || farm.location}</p><button onClick={() => window.open(`https://www.google.com/maps?q=${farm.latitude},${farm.longitude}`, '_blank')} className="mt-2 text-xs font-black text-[#2D4A36] flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Buka Google Maps</button></div><div className="h-[240px] relative"><iframe title="Lokasi kandang" src={`https://maps.google.com/maps?q=${farm.latitude},${farm.longitude}&z=17&output=embed`} className="absolute inset-0 w-full h-full border-0" loading="lazy" /></div></div>}
      <div className="p-5 rounded-2xl bg-[#EAF2EC] border flex items-center gap-3"><ShieldCheck className="w-7 h-7 text-[#2D4A36]" /><div><span className="text-xs font-bold">STATUS GARANSI</span><p className="font-black">{farm.warrantyEnd || 'Mengikuti ketentuan paket Eggnest'}</p></div></div>
      <div className="p-5 rounded-2xl bg-[#FAF7F2] border flex justify-between items-center gap-3"><div><span className="text-xs font-bold text-stone-500">FARM SCORE</span><p className="font-black">{farmScoreReady ? `${farmScore.totalScore} • ${farmScore.statusText}` : `Mengumpulkan Data (${reports.length}/7)`}</p></div><button onClick={() => { setActivePage('score'); navigate('/score'); }} className="px-4 py-2.5 bg-[#2D4A36] text-white rounded-xl font-bold text-xs flex gap-1"><Award className="w-4 h-4" /> Lihat</button></div>
    </div>
    <div className="lg:col-span-4 bg-white rounded-3xl border p-6 flex flex-col items-center"><div className="w-full flex justify-between"><span className="text-xs font-bold text-stone-500">KARTU DIGITAL</span><span className="text-xs font-black">QR FARM</span></div><div className="mt-5 w-56 h-56 bg-[#FAF7F2] rounded-3xl p-3 flex items-center justify-center">{qrDataUrl ? <img src={qrDataUrl} alt="QR Farm" className="w-full h-full" /> : <QrCode className="w-12 h-12" />}</div><div className="font-black mt-3">{farm.farmCode}</div><div className="w-full mt-6 space-y-2"><button onClick={printQr} className="w-full py-3 rounded-xl bg-[#2D4A36] text-white font-bold flex justify-center gap-2"><Printer className="w-4 h-4" /> Cetak QR</button><button onClick={downloadQr} className="w-full py-3 rounded-xl border font-bold flex justify-center gap-2"><Download className="w-4 h-4" /> Unduh PNG</button></div></div></div>

    {editing && <div className="fixed inset-0 z-[130] bg-black/50 overflow-y-auto"><div className="min-h-full p-3 sm:p-6 flex items-start justify-center"><div className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden my-3"><div className="sticky top-0 bg-white z-10 px-5 py-4 border-b flex justify-between"><div><h2 className="text-xl font-black">Edit Data Kandang</h2><p className="text-xs text-stone-500">Farm ID dan Mitra Pendamping tetap dikunci oleh sistem.</p></div><button onClick={() => setEditing(false)}><X /></button></div><div className="p-5 sm:p-7 space-y-6">
      <div className="rounded-2xl bg-[#EAF2EC] border p-4"><h3 className="font-black">Lokasi Kandang</h3><p className="text-xs text-stone-600 mt-1">Tidak perlu mengetik alamat dari awal. Ambil GPS, sistem akan mengisi alamat otomatis.</p><button type="button" onClick={captureGps} disabled={gpsLoading} className="mt-3 w-full min-h-14 rounded-2xl bg-[#1B3022] text-white font-black flex items-center justify-center gap-2 disabled:opacity-60"><Navigation className="w-5 h-5 text-[#D4AF37]" /> {gpsLoading ? 'Mengambil GPS & Alamat...' : form.latitude != null ? 'Ambil Ulang Lokasi Kandang' : 'Ambil Lokasi Kandang'}</button>{form.latitude != null && <div className="mt-3 rounded-xl bg-white border p-3"><div className="text-xs font-black text-[#2D4A36]">✓ Titik ditemukan</div><div className="text-xs text-stone-500 mt-1">{form.latitude}, {form.longitude}</div><p className="text-sm font-bold mt-2">{form.fullAddress || 'Alamat belum ditemukan otomatis'}</p><button type="button" onClick={() => setAddressEditing(!addressEditing)} className="mt-2 text-xs font-black text-[#2D4A36]">{addressEditing ? 'Selesai Edit Alamat' : 'Edit Alamat jika kurang tepat'}</button></div>}</div>
      {addressEditing && <div className="space-y-3"><Field label="Kabupaten / Kota"><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value, regency: e.target.value })} className="field" /></Field><Field label="Alamat / Patokan Tambahan"><textarea rows={3} value={form.fullAddress} onChange={(e) => setForm({ ...form, fullAddress: e.target.value })} className="field resize-none" placeholder="Boleh tambahkan RT/RW, nomor rumah atau patokan" /></Field></div>}
      <div className="grid sm:grid-cols-3 gap-4"><Field label="Jenis Ayam"><select value={form.chickenBreed} onChange={(e) => setForm({ ...form, chickenBreed: e.target.value })} className="field">{CHICKEN_TYPE_OPTIONS.map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="Jumlah Ayam Aktif"><input type="number" min="1" value={form.activeChickens} onChange={(e) => setForm({ ...form, activeChickens: Number(e.target.value) })} className="field" /></Field><Field label="Usia Ayam (minggu)"><input type="number" min="1" value={form.currentAgeWeeks} onChange={(e) => setForm({ ...form, currentAgeWeeks: Number(e.target.value) })} className="field" /></Field></div>
    </div><div className="sticky bottom-0 bg-white border-t p-4 flex gap-3"><button onClick={() => setEditing(false)} className="flex-1 min-h-12 rounded-2xl border font-bold">Batal</button><button onClick={saveProfile} disabled={saving || gpsLoading} className="flex-[2] min-h-12 rounded-2xl bg-[#D4AF37] text-[#1B3022] font-black flex justify-center items-center gap-2 disabled:opacity-60"><Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}</button></div></div></div></div>}
    <style>{`.field{width:100%;padding:.875rem 1rem;border-radius:1rem;border:1px solid #D9D4C8;background:#FDFBF7;color:#1B3022;font-weight:700;outline:none}`}</style>
  </div>;
};

const Info = ({ icon, label, value }: any) => <div className="p-4 rounded-2xl bg-[#FAF7F2] border"><span className="text-xs text-stone-500 font-semibold flex items-center gap-1.5"><span className="text-[#2D4A36] [&>svg]:w-4 [&>svg]:h-4">{icon}</span>{label}</span><p className="text-base font-bold mt-1 text-[#1B3022]">{value}</p></div>;
const Field = ({ label, children }: any) => <label className="space-y-2 block"><span className="text-sm font-black text-[#1B3022]">{label}</span>{children}</label>;
export default FarmProfilePage;
