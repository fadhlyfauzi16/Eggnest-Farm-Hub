import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { useFarm } from '../context/FarmContext';
import {
  Warehouse,
  QrCode,
  ShieldCheck,
  Calendar,
  MapPin,
  User,
  Activity,
  Layers,
  Sparkles,
  Download,
  Printer,
  Copy,
  CheckCircle2,
  Award,
  ExternalLink,
  Pencil,
  Navigation,
  X,
  Save,
  AlertTriangle,
} from 'lucide-react';

const CHICKEN_TYPE_OPTIONS = [
  'Ayam Petelur Cokelat',
  'Ayam Petelur Putih',
  'Ayam Kampung Petelur',
  'Ayam Arab Petelur',
  'Ayam Joper',
  'Ayam Petelur Lainnya',
] as const;

const hasCompleteFarmData = (farm: any): boolean => {
  const location = String(farm?.location ?? '').trim();
  const locationKey = location.toLowerCase();
  const validLocation = location.length > 0 && locationKey !== 'indonesia' && !locationKey.includes('belum');
  const fullAddress = String(farm?.fullAddress ?? '').trim();
  const hasLatitude = farm?.latitude !== null && farm?.latitude !== undefined && farm?.latitude !== '' && Number.isFinite(Number(farm.latitude));
  const hasLongitude = farm?.longitude !== null && farm?.longitude !== undefined && farm?.longitude !== '' && Number.isFinite(Number(farm.longitude));
  const breed = String(farm?.chickenBreed ?? '').trim();
  const chickens = Number(farm?.activeChickens ?? 0);
  const age = Number(farm?.currentAgeWeeks ?? 0);
  return validLocation && fullAddress.length > 0 && hasLatitude && hasLongitude && breed.length > 0 && chickens > 0 && age > 0;
};

export const FarmProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    farm,
    farmScore,
    reports,
    chickenCurrentAgeWeeks,
    setActivePage,
    showToast,
    updateMyFarm,
  } = useFarm();

  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGettingGps, setIsGettingGps] = useState(false);

  const [location, setLocation] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [chickenBreed, setChickenBreed] = useState('');
  const [activeChickens, setActiveChickens] = useState(0);
  const [currentAgeWeeks, setCurrentAgeWeeks] = useState(0);

  const dataComplete = hasCompleteFarmData(farm);
  const farmScoreReady = reports.length >= 7;

  const syncForm = () => {
    const rawLocation = String(farm.location ?? '').trim();
    setLocation(
      !rawLocation || rawLocation.toLowerCase() === 'indonesia' || rawLocation.toLowerCase().includes('belum')
        ? ''
        : rawLocation
    );
    setFullAddress(String(farm.fullAddress ?? ''));
    setLatitude(farm.latitude == null || farm.latitude === '' ? null : Number(farm.latitude));
    setLongitude(farm.longitude == null || farm.longitude === '' ? null : Number(farm.longitude));
    setChickenBreed(String(farm.chickenBreed ?? '') || 'Ayam Petelur Cokelat');
    setActiveChickens(Number(farm.activeChickens ?? 0));
    setCurrentAgeWeeks(Number(chickenCurrentAgeWeeks || farm.currentAgeWeeks || 0));
  };

  useEffect(() => {
    syncForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farm.id, farm.location, farm.fullAddress, farm.latitude, farm.longitude, farm.chickenBreed, farm.activeChickens, farm.currentAgeWeeks, chickenCurrentAgeWeeks]);

  useEffect(() => {
    if (!farm?.farmCode) return;
    const payload = `${window.location.origin}/farm?code=${encodeURIComponent(farm.farmCode)}`;
    QRCode.toDataURL(payload, {
      width: 300,
      margin: 2,
      color: { dark: '#1B3022', light: '#FFFFFF' },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error('Error generating QR code:', err));
  }, [farm?.farmCode]);

  const copyFarmCode = () => {
    if (!farm.farmCode) return;
    navigator.clipboard.writeText(farm.farmCode);
    showToast(`📋 Farm ID ${farm.farmCode} disalin.`);
  };

  const captureGps = () => {
    if (!navigator.geolocation) {
      showToast('⚠️ Browser/perangkat ini tidak mendukung GPS.');
      return;
    }
    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setIsGettingGps(false);
        showToast('📍 Titik GPS berhasil diambil.');
      },
      (error) => {
        setIsGettingGps(false);
        showToast(
          error.code === error.PERMISSION_DENIED
            ? '⚠️ Izin lokasi ditolak. Aktifkan izin lokasi pada browser.'
            : '⚠️ Lokasi belum berhasil didapatkan. Silakan coba lagi.'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return showToast('⚠️ Kabupaten/Kota wajib diisi.');
    if (!fullAddress.trim()) return showToast('⚠️ Alamat lengkap wajib diisi.');
    if (latitude == null || longitude == null) return showToast('⚠️ Ambil titik GPS terlebih dahulu.');
    if (!chickenBreed.trim()) return showToast('⚠️ Jenis ayam wajib dipilih.');
    if (!Number.isInteger(activeChickens) || activeChickens < 1) return showToast('⚠️ Jumlah ayam aktif minimal 1 ekor.');
    if (!Number.isFinite(currentAgeWeeks) || currentAgeWeeks < 1) return showToast('⚠️ Usia ayam wajib diisi.');

    setIsSaving(true);
    try {
      const result = await updateMyFarm({
        location: location.trim(),
        fullAddress: fullAddress.trim(),
        latitude,
        longitude,
        chickenBreed: chickenBreed.trim(),
        activeChickens,
        currentAgeWeeks,
      });
      if (result.success) setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const downloadQr = () => {
    if (!qrDataUrl) return showToast('⚠️ QR Code belum siap.');
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR-FARM-${farm.farmCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQr = () => {
    if (!qrDataUrl) return showToast('⚠️ QR Code belum siap.');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>QR Farm ${farm.farmCode}</title><style>body{font-family:Arial;text-align:center;padding:40px;color:#1B3022}.card{border:2px solid #2D4A36;border-radius:16px;max-width:360px;margin:auto;padding:24px}.code{font-size:22px;font-weight:800;letter-spacing:2px}img{width:220px;height:220px}</style></head><body><div class="card"><h2>EGGNEST FARM HUB</h2><img src="${qrDataUrl}"/><div class="code">${farm.farmCode}</div><p>${farm.ownerName || 'Mitra'}</p></div><script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-[#EAF2EC] text-[#1B3022] text-xs font-bold rounded-full border border-[#CDE3D3]">
            Identitas Digital Kemitraan
          </span>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1B3022] font-['Outfit'] tracking-tight mt-1">
            Profil Kandang
          </h1>
          <p className="text-stone-600 text-sm font-medium mt-1">Identitas Farm ID, data kandang, lokasi, dan QR verifikasi.</p>
        </div>
        <button
          onClick={() => { syncForm(); setIsEditing(true); }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#1B3022] hover:bg-[#2D4A36] text-white text-sm font-black shadow-sm"
        >
          <Pencil className="w-4 h-4 text-[#D4AF37]" /> Edit Data Kandang
        </button>
      </div>

      {!dataComplete && (
        <div className="rounded-3xl border-2 border-[#E5B52B] bg-[#FFF8E8] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-[#A16207] shrink-0 mt-0.5" />
            <div>
              <h2 className="font-black text-[#1B3022]">Data Kandang Belum Lengkap</h2>
              <p className="text-sm text-stone-600 mt-1">Lengkapi lokasi, GPS, jenis ayam, jumlah ayam, dan usia ayam agar Laporan Harian aktif.</p>
            </div>
          </div>
          <button onClick={() => navigate('/reports')} className="px-5 py-3 rounded-2xl bg-[#D4AF37] text-[#1B3022] font-black text-sm whitespace-nowrap">
            Aktifkan di Laporan →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFECE6] pb-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#1B3022] flex items-center justify-center shadow-md"><Warehouse className="w-8 h-8 text-[#D4AF37]" /></div>
              <div>
                <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">Farm ID Resmi</span>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-black text-[#1B3022] font-['Outfit']">{farm.farmCode || '-'}</h2>
                  <button onClick={copyFarmCode} className="p-2 rounded-lg hover:bg-[#FAF7F2]"><Copy className="w-4 h-4 text-stone-500" /></button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="bg-[#EAF2EC] text-[#1B3022] text-xs font-black px-3.5 py-1.5 rounded-full border border-[#CDE3D3]">✓ KEMITRAAN AKTIF</span>
              <span className={`text-xs font-black px-3.5 py-1.5 rounded-full border ${dataComplete ? 'bg-[#EAF2EC] text-[#1B3022] border-[#CDE3D3]' : 'bg-[#FFF8E8] text-[#A16207] border-[#E5B52B]'}`}>
                {dataComplete ? '✓ SIAP LAPOR' : '⚠ DATA BELUM LENGKAP'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Info icon={<User className="w-4 h-4" />} label="Pemilik Kandang" value={farm.ownerName || '-'} />
            <Info icon={<MapPin className="w-4 h-4" />} label="Kabupaten / Kota" value={dataComplete ? farm.location : 'Belum dilengkapi'} muted={!dataComplete} />
            <Info icon={<Calendar className="w-4 h-4" />} label="Tanggal Aktivasi Kemitraan" value={farm.activationDate || '-'} />
            <Info icon={<Layers className="w-4 h-4" />} label="Jenis Ayam" value={farm.chickenBreed || 'Belum diisi'} muted={!farm.chickenBreed} />
            <Info icon={<Activity className="w-4 h-4" />} label="Jumlah Ayam Aktif" value={farm.activeChickens > 0 ? `${farm.activeChickens} ekor` : 'Belum diisi'} muted={!farm.activeChickens} />
            <Info icon={<Sparkles className="w-4 h-4" />} label="Usia Ayam Saat Ini" value={chickenCurrentAgeWeeks > 0 ? `${chickenCurrentAgeWeeks} minggu` : 'Belum diisi'} muted={!chickenCurrentAgeWeeks} />
          </div>

          {dataComplete && (
            <div className="p-5 rounded-2xl bg-[#F7F4EE] border border-[#E5E1D8] space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Lokasi Kandang</span>
                  <p className="text-sm font-black text-[#1B3022] mt-0.5">Terverifikasi untuk laporan harian</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF2EC] border border-[#CDE3D3] px-3 py-1 text-[11px] font-black text-[#1B3022]"><CheckCircle2 className="w-3.5 h-3.5" /> AKTIF</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl bg-white border border-[#EFECE6] p-4">
                  <span className="text-xs font-semibold text-stone-500">Alamat Lengkap</span>
                  <p className="text-sm font-bold text-[#1B3022] mt-1 leading-relaxed">{farm.fullAddress}</p>
                </div>
                <div className="rounded-xl bg-white border border-[#EFECE6] p-4">
                  <span className="text-xs font-semibold text-stone-500">Titik GPS</span>
                  <p className="text-sm font-bold text-[#1B3022] mt-1">{Number(farm.latitude).toFixed(6)}, {Number(farm.longitude).toFixed(6)}</p>
                  <button
                    onClick={() => window.open(`https://www.google.com/maps?q=${farm.latitude},${farm.longitude}`, '_blank', 'noopener,noreferrer')}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#2D4A36]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Buka Google Maps
                  </button>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden bg-white border border-[#E5E1D8]">
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#EFECE6]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#EAF2EC] flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-[#2D4A36]" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#1B3022] uppercase tracking-wider">Peta Lokasi Kandang</p>
                      <p className="text-[11px] text-stone-500">Titik berdasarkan GPS Farm ID {farm.farmCode}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open(`https://www.google.com/maps?q=${farm.latitude},${farm.longitude}`, '_blank', 'noopener,noreferrer')}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#1B3022] text-white text-xs font-black hover:bg-[#2D4A36]"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Buka Google Maps
                  </button>
                </div>

                <div className="relative w-full h-[220px] sm:h-[260px] bg-[#EAF2EC]">
                  <iframe
                    title={`Lokasi kandang ${farm.farmCode}`}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(`${farm.latitude},${farm.longitude}`)}&z=17&output=embed`}
                    className="absolute inset-0 w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>

                <div className="px-4 py-3 bg-[#FDFBF7] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2D4A36] shrink-0 mt-0.5" />
                  <p className="text-[11px] sm:text-xs text-stone-600">
                    Lokasi ditampilkan dari koordinat GPS yang tersimpan pada profil kandang.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-5 rounded-2xl bg-[#EAF2EC] border border-[#CDE3D3] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#2D4A36]"><ShieldCheck className="w-6 h-6 text-[#D4AF37]" /></div>
            <div>
              <span className="text-xs font-bold text-[#1B3022] uppercase">Status Garansi Kemitraan</span>
              <p className="text-base font-black text-[#1B3022]">{farm.warrantyEnd || 'Mengikuti ketentuan paket Eggnest'}</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#2D4A36] text-white flex items-center justify-center font-black text-lg">{farmScoreReady ? farmScore.totalScore : '—'}</div>
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Farm Score</span>
                <p className="text-base font-black text-[#1B3022]">{farmScoreReady ? farmScore.statusText : `Mengumpulkan Data (${reports.length}/7)`}</p>
              </div>
            </div>
            <button onClick={() => { setActivePage('score'); navigate('/score'); }} className="px-4 py-2.5 bg-[#2D4A36] text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5"><Award className="w-4 h-4 text-[#D4AF37]" /> Lihat Farm Score →</button>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-8 flex flex-col justify-between items-center text-center">
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between"><span className="text-xs font-bold text-stone-500 uppercase">Kartu Digital</span><span className="text-xs font-black text-[#1B3022] bg-[#EAF2EC] px-2.5 py-0.5 rounded-full border border-[#CDE3D3]">QR FARM</span></div>
            <div className="p-4 bg-[#FAF7F2] rounded-3xl border-2 border-dashed border-[#E5E1D8] flex flex-col items-center">
              <div className="w-52 h-52 bg-white rounded-2xl p-2.5 flex items-center justify-center shadow-md border border-[#EFECE6]">
                {qrDataUrl ? <img src={qrDataUrl} alt={`QR ${farm.farmCode}`} className="w-full h-full object-contain rounded-xl" /> : <QrCode className="w-12 h-12 text-stone-400 animate-pulse" />}
              </div>
              <span className="text-sm font-black text-[#1B3022] mt-3 tracking-wider">{farm.farmCode}</span>
              <p className="text-[11px] text-stone-500 mt-1">Scan untuk verifikasi Farm ID Eggnest</p>
            </div>
          </div>
          <div className="w-full pt-4 space-y-2">
            <button onClick={printQr} className="w-full py-3 bg-[#2D4A36] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Cetak QR Code</button>
            <button onClick={downloadQr} className="w-full py-2.5 bg-[#FAF7F2] text-[#1B3022] font-bold text-xs rounded-xl border border-[#EFECE6] flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Unduh PNG</button>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] p-3 sm:p-6 flex items-center justify-center" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsEditing(false); }}>
          <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-[#EFECE6]">
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between gap-4 px-5 sm:px-7 py-5 border-b border-[#EFECE6]">
              <div><h2 className="text-xl sm:text-2xl font-black text-[#1B3022]">Edit Data Kandang</h2><p className="text-xs sm:text-sm text-stone-500">Farm ID dan data administrasi tetap dikunci oleh Eggnest.</p></div>
              <button onClick={() => setIsEditing(false)} className="p-2 rounded-xl hover:bg-[#FAF7F2]"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveProfile} className="p-5 sm:p-7 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Kabupaten / Kota *"><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Contoh: Kabupaten Klaten" className="field" /></Field>
                <Field label="Alamat Lengkap Kandang *"><textarea rows={4} value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} placeholder="Dusun/Desa, RT/RW, Kecamatan, Kabupaten/Kota, Provinsi" className="field resize-none" /></Field>
                <Field label="Titik GPS *">
                  <button type="button" onClick={captureGps} disabled={isGettingGps} className="w-full min-h-12 rounded-2xl bg-[#1B3022] text-white font-black flex items-center justify-center gap-2 disabled:opacity-60"><Navigation className="w-4 h-4 text-[#D4AF37]" /> {isGettingGps ? 'Mengambil Lokasi...' : latitude != null && longitude != null ? 'Ambil Ulang GPS' : 'Ambil Lokasi Saya'}</button>
                  {latitude != null && longitude != null && <p className="text-xs font-bold text-[#2D4A36] mt-2">{latitude.toFixed(6)}, {longitude.toFixed(6)}</p>}
                </Field>
                <Field label="Jenis Ayam *">
                  <select value={chickenBreed} onChange={(e) => setChickenBreed(e.target.value)} className="field">
                    {!CHICKEN_TYPE_OPTIONS.includes(chickenBreed as any) && chickenBreed && (
                      <option value={chickenBreed}>{chickenBreed}</option>
                    )}
                    {CHICKEN_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type === 'Ayam Petelur Cokelat' ? `${type} — utama paket Eggnest` : type}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] font-semibold text-stone-500 mt-2">Ayam pada paket utama Eggnest termasuk kategori ayam petelur cokelat.</p>
                </Field>
                <Field label="Jumlah Ayam Aktif *"><input type="number" min={1} max={1000} value={activeChickens || ''} onChange={(e) => setActiveChickens(Number(e.target.value))} className="field" /></Field>
                <Field label="Usia Ayam Saat Ini *"><input type="number" min={1} max={200} value={currentAgeWeeks || ''} onChange={(e) => setCurrentAgeWeeks(Number(e.target.value))} className="field" /></Field>
              </div>
              <div className="rounded-2xl bg-[#FAF7F2] border border-[#EFECE6] p-4 text-xs text-stone-600">Usia yang Anda simpan menjadi patokan baru. Sistem akan menambah usia otomatis setiap 7 hari.</div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-3 rounded-2xl border border-[#D9D4C8] font-bold text-stone-700">Batal</button>
                <button type="submit" disabled={isSaving || isGettingGps} className="px-6 py-3 rounded-2xl bg-[#D4AF37] text-[#1B3022] font-black flex items-center justify-center gap-2 disabled:opacity-60"><Save className="w-4 h-4" /> {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`.field{width:100%;padding:.875rem 1rem;border-radius:1rem;border:1px solid #D9D4C8;background:#FDFBF7;color:#1B3022;font-weight:700;outline:none}.field:focus{box-shadow:0 0 0 2px #2D4A36}`}</style>
    </div>
  );
};

const Info: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; muted?: boolean }> = ({ icon, label, value, muted }) => (
  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6]">
    <span className="text-xs text-stone-500 font-semibold flex items-center gap-1.5"><span className="text-[#2D4A36]">{icon}</span>{label}</span>
    <p className={`text-base font-bold mt-1 ${muted ? 'text-stone-400' : 'text-[#1B3022]'}`}>{value}</p>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-2"><label className="text-sm font-black text-[#1B3022]">{label}</label>{children}</div>
);
