import React, { useEffect, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { ChickenCondition, IssueType, DailyReport } from '../types';
import {
  Egg,
  Wheat,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Calendar,
  History,
  FileCheck,
  Sparkles,
  ChevronDown,
  Clock,
  ArrowRight,
  Filter,
  MapPin,
  Lock,
  Navigation,
  Check,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChickenHealthPicker, ChickenHealthItem } from '../components/common/ChickenHealthPicker';
import { api } from '../services/api';

const localDateKey = (value: Date = new Date()): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatLongDateId = (dateKey: string): string => {
  if (!dateKey) return '-';
  const [year, month, day] = dateKey.split('-').map(Number);
  const value = new Date(year, (month || 1) - 1, day || 1);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(value);
};


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
  const activeChickens = Number(farm?.activeChickens ?? 0);
  const ageWeeks = Number(farm?.currentAgeWeeks ?? 0);
  return validLocation && fullAddress.length > 0 && hasLatitude && hasLongitude && breed.length > 0 && activeChickens > 0 && ageWeeks > 0;
};

export const DailyReportPage: React.FC = () => {
  const { farm, reports, addDailyReport, updateMyFarm, showToast, textScale } = useFarm();

  const totalChickensCount = farm.activeChickens || 0;
  const farmDataComplete = hasCompleteFarmData(farm);

  const initialLocation = (() => {
    const value = String(farm.location ?? '').trim();
    if (!value || value.toLowerCase() === 'indonesia' || value.toLowerCase().includes('belum')) {
      return '';
    }
    return value;
  })();

  const [activationLocation, setActivationLocation] = useState<string>(initialLocation);
  const [activationAddress, setActivationAddress] = useState<string>(String(farm.fullAddress ?? ''));
  const [activationLatitude, setActivationLatitude] = useState<number | null>(
    farm.latitude == null || farm.latitude === '' ? null : Number(farm.latitude)
  );
  const [activationLongitude, setActivationLongitude] = useState<number | null>(
    farm.longitude == null || farm.longitude === '' ? null : Number(farm.longitude)
  );
  const [activationBreed, setActivationBreed] = useState<string>(String(farm.chickenBreed ?? '') || 'Ayam Petelur Cokelat');
  const [activationChickenCount, setActivationChickenCount] = useState<number>(Number(farm.activeChickens ?? 0));
  const [activationAgeWeeks, setActivationAgeWeeks] = useState<number>(Number(farm.currentAgeWeeks ?? 0));
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [isSavingActivation, setIsSavingActivation] = useState(false);

  useEffect(() => {
    const location = String(farm.location ?? '').trim();
    setActivationLocation(
      !location || location.toLowerCase() === 'indonesia' || location.toLowerCase().includes('belum')
        ? ''
        : location
    );
    setActivationAddress(String(farm.fullAddress ?? ''));
    setActivationLatitude(
      farm.latitude == null || farm.latitude === '' ? null : Number(farm.latitude)
    );
    setActivationLongitude(
      farm.longitude == null || farm.longitude === '' ? null : Number(farm.longitude)
    );
    setActivationBreed(String(farm.chickenBreed ?? '') || 'Ayam Petelur Cokelat');
    setActivationChickenCount(Number(farm.activeChickens ?? 0));
    setActivationAgeWeeks(Number(farm.currentAgeWeeks ?? 0));
  }, [farm.id, farm.location, farm.fullAddress, farm.latitude, farm.longitude, farm.chickenBreed, farm.activeChickens, farm.currentAgeWeeks]);

  const [date, setDate] = useState<string>(() => localDateKey());
  const [eggCount, setEggCount] = useState<number>(0);
  const [feedKg, setFeedKg] = useState<number>(0);
  const [chickenCondition, setChickenCondition] = useState<ChickenCondition>('healthy');
  const [chickensState, setChickensState] = useState<ChickenHealthItem[]>(() =>
    Array.from({ length: totalChickensCount }, (_, i) => ({
      number: i + 1,
      status: 'healthy' as const,
      symptoms: [],
    }))
  );
  useEffect(() => {
    setChickensState((prev) =>
      Array.from({ length: totalChickensCount }, (_, i) =>
        prev[i] || { number: i + 1, status: 'healthy' as const, symptoms: [] }
      )
    );
  }, [totalChickensCount]);

  const [notes, setNotes] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [selectedReportPhoto, setSelectedReportPhoto] = useState<DailyReport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Success state banner
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [lastStats, setLastStats] = useState<{ eggs: number; prod: number } | null>(null);

  // Filter for history
  const [searchFilter, setSearchFilter] = useState<string>('all');

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      showToast('⚠️ Perangkat/browser ini tidak mendukung GPS.');
      return;
    }

    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setActivationLatitude(position.coords.latitude);
        setActivationLongitude(position.coords.longitude);
        setIsGettingGps(false);
        showToast('📍 Titik GPS berhasil diambil.');
      },
      (error) => {
        setIsGettingGps(false);
        const message =
          error.code === error.PERMISSION_DENIED
            ? 'Izin lokasi ditolak. Aktifkan izin lokasi pada browser lalu coba lagi.'
            : 'Lokasi belum berhasil didapatkan. Silakan coba lagi di area dengan sinyal GPS yang baik.';
        showToast(`⚠️ ${message}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleActivateFarm = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanLocation = activationLocation.trim();
    const cleanAddress = activationAddress.trim();
    const gpsReady =
      activationLatitude !== null &&
      activationLongitude !== null &&
      Number.isFinite(activationLatitude) &&
      Number.isFinite(activationLongitude);

    if (!cleanLocation) {
      showToast('⚠️ Kabupaten/Kota wajib diisi.');
      return;
    }
    if (!cleanAddress) {
      showToast('⚠️ Alamat lengkap kandang wajib diisi.');
      return;
    }
    if (!gpsReady) {
      showToast('⚠️ Ambil titik GPS kandang terlebih dahulu.');
      return;
    }
    const cleanBreed = activationBreed.trim();
    if (!cleanBreed) {
      showToast('⚠️ Jenis ayam wajib dipilih.');
      return;
    }
    if (!Number.isInteger(activationChickenCount) || activationChickenCount < 1) {
      showToast('⚠️ Jumlah ayam aktif minimal 1 ekor.');
      return;
    }
    if (!Number.isFinite(activationAgeWeeks) || activationAgeWeeks < 1) {
      showToast('⚠️ Usia ayam wajib diisi dalam minggu.');
      return;
    }
    if (!farm.id) {
      showToast('⚠️ Farm ID belum terhubung ke akun ini.');
      return;
    }

    setIsSavingActivation(true);
    try {
      const result = await updateMyFarm({
        location: cleanLocation,
        fullAddress: cleanAddress,
        latitude: Number(activationLatitude),
        longitude: Number(activationLongitude),
        chickenBreed: cleanBreed,
        activeChickens: activationChickenCount,
        currentAgeWeeks: activationAgeWeeks,
      });
      if (result.success) {
        showToast('✅ Data Kandang aktif. Silakan isi Laporan Harian pertama Anda.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setIsSavingActivation(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('⚠️ Foto harus berformat JPG, PNG, atau WEBP.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('⚠️ Ukuran foto maksimal 5 MB.');
      e.target.value = '';
      return;
    }

    setPhotoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!Number.isInteger(eggCount) || eggCount < 0) {
      showToast('⚠️ Jumlah telur harus berupa angka bulat 0 atau lebih.');
      return;
    }

    if (!Number.isFinite(feedKg) || feedKg < 0) {
      showToast('⚠️ Jumlah pakan tidak valid.');
      return;
    }

    const activeChickenCount = Math.max(0, Number(farm.activeChickens || 0));
    const highFeedThresholdKg = activeChickenCount > 0 ? activeChickenCount * 0.2 : 0;

    if (highFeedThresholdKg > 0 && feedKg > highFeedThresholdKg) {
      const proceed = window.confirm(
        `Pakan ${String(feedKg).replace('.', ',')} kg untuk ${activeChickenCount} ayam terlihat jauh di atas takaran umum. Apakah angka ini sudah benar?`
      );
      if (!proceed) return;
    }

    setIsSubmitting(true);

    try {
      // Aggregate symptoms across all sick/dead chickens
      let aggregatedIssues: IssueType[] = [];
      if (chickenCondition === 'issue') {
        const symptomsSet = new Set<string>();
        let hasDead = false;
        let hasSick = false;

        chickensState.forEach((ch) => {
          if (ch.status === 'dead') hasDead = true;
          if (ch.status === 'sick') {
            hasSick = true;
            ch.symptoms.forEach((s) => symptomsSet.add(s));
          }
        });

        if (hasSick && symptomsSet.size === 0) {
          symptomsSet.add('Ayam sakit');
        }
        if (hasDead) {
          symptomsSet.add('Ayam mati');
        }

        aggregatedIssues = Array.from(symptomsSet) as IssueType[];
        if (aggregatedIssues.length === 0) {
          aggregatedIssues = ['Ayam sakit'];
        }
      }

      let uploadedPhotoUrl: string | undefined;

      if (photoFile) {
        try {
          showToast('📷 Mengupload foto laporan...');
          const uploaded = await api.uploadFile(photoFile);
          uploadedPhotoUrl = uploaded.url;
        } catch (error: any) {
          showToast(`⚠️ Foto gagal diupload: ${error?.message || 'Silakan coba lagi.'}`);
          setSavedSuccess(false);
          return;
        }
      }

      const res = await addDailyReport({
        date,
        eggCount,
        feedKg,
        chickenCondition,
        issueTypes: chickenCondition === 'issue' ? aggregatedIssues : undefined,
        notes: notes.trim() || undefined,
        photoUrl: uploadedPhotoUrl,
      });

      if (!res.success) {
        setSavedSuccess(false);
        return;
      }

      const prod =
        res.productivity || Math.round((eggCount / Math.max(1, farm.activeChickens || 0)) * 100);
      setLastStats({ eggs: eggCount, prod });
      setSavedSuccess(true);
      setPhotoFile(null);
      setPhotoPreview(null);

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2D6A4F', '#52B788', '#E9C46A', '#FFE6A7'],
        });
      } catch {
        // ignore
      }

      // Scroll to top to see notification
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (searchFilter === 'issue') return r.chickenCondition === 'issue';
    if (searchFilter === 'high') return r.productivityRate >= 80;
    return true;
  });

  if (!farmDataComplete) {
    const gpsReady = activationLatitude !== null && activationLongitude !== null;

    return (
      <div className="space-y-6 sm:space-y-8 pb-12 animate-in fade-in duration-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#FEF6E9] text-[#78350F] text-xs font-black rounded-full border border-[#FDE68A]">
              🔒 LAPORAN HARIAN TERKUNCI
            </span>
            {farm.farmCode && (
              <span className="text-xs text-stone-500 font-medium">Farm ID: {farm.farmCode}</span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1B3022] font-['Outfit'] tracking-tight mt-2">
            Aktifkan Data Kandang
          </h1>
          <p className="text-stone-600 text-sm font-medium mt-1 max-w-2xl">
            Sebelum laporan pertama dibuat, lengkapi lokasi dan data ayam. Setelah tersimpan, form Laporan Harian akan terbuka otomatis di halaman ini.
          </p>
        </div>

        <div className="bg-[#FFF8E8] rounded-3xl border-2 border-[#E5B52B] shadow-sm overflow-hidden">
          <div className="px-5 sm:px-7 py-5 sm:py-6 border-b border-[#E8D8A3]">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1B3022] text-[#D4AF37] flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#1B3022] font-['Outfit']">
                  Lengkapi Data Kandang Terlebih Dahulu
                </h2>
                <p className="text-sm text-stone-600 mt-1">
                  Data awal ini diisi satu kali. Setelah aktif, datanya dapat diperbarui kembali dari Profil Kandang.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleActivateFarm} className="p-5 sm:p-7 space-y-5 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-black text-[#1B3022]">Kabupaten / Kota *</label>
                <input
                  type="text"
                  value={activationLocation}
                  onChange={(e) => setActivationLocation(e.target.value)}
                  placeholder="Contoh: Kabupaten Klaten"
                  autoComplete="address-level2"
                  className="w-full px-4 py-3.5 rounded-2xl border border-[#D9D4C8] bg-[#FDFBF7] text-[#1B3022] font-bold outline-none focus:ring-2 focus:ring-[#2D4A36]"
                />
              </div>

              <div className="space-y-2 md:row-span-2">
                <label className="text-sm font-black text-[#1B3022]">Alamat Lengkap Kandang *</label>
                <textarea
                  value={activationAddress}
                  onChange={(e) => setActivationAddress(e.target.value)}
                  rows={6}
                  placeholder="Dusun/Desa, RT/RW, Kecamatan, Kabupaten/Kota, Provinsi"
                  autoComplete="street-address"
                  className="w-full px-4 py-3.5 rounded-2xl border border-[#D9D4C8] bg-[#FDFBF7] text-[#1B3022] font-medium outline-none focus:ring-2 focus:ring-[#2D4A36] resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-[#1B3022]">Titik GPS Kandang *</label>
                <button
                  type="button"
                  onClick={handleCaptureGps}
                  disabled={isGettingGps}
                  className="w-full min-h-14 px-4 py-3 rounded-2xl bg-[#1B3022] hover:bg-[#2D4A36] text-white font-black flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <Navigation className="w-5 h-5 text-[#D4AF37]" />
                  {isGettingGps ? 'Mengambil Lokasi...' : gpsReady ? 'Ambil Ulang Lokasi' : 'Ambil Lokasi Saya'}
                </button>

                {gpsReady ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-[#EAF2EC] border border-[#CDE3D3] p-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-black text-[#1B3022]">
                            <Check className="w-4 h-4" /> GPS berhasil diperoleh
                          </div>
                          <p className="text-xs text-stone-600 mt-1 font-medium">
                            {Number(activationLatitude).toFixed(6)}, {Number(activationLongitude).toFixed(6)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps?q=${activationLatitude},${activationLongitude}`,
                              '_blank',
                              'noopener,noreferrer'
                            )
                          }
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#CDE3D3] text-xs font-black text-[#1B3022] hover:bg-[#FDFBF7]"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          Buka Google Maps
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl overflow-hidden border border-[#D9D4C8] bg-white">
                      <div className="px-3.5 py-3 border-b border-[#EFECE6] flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#EAF2EC] flex items-center justify-center">
                          <Navigation className="w-4 h-4 text-[#2D4A36]" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#1B3022] uppercase tracking-wider">
                            Cek Lokasi Kandang
                          </p>
                          <p className="text-[11px] text-stone-500">
                            Pastikan titik pada peta sesuai lokasi kandang Anda.
                          </p>
                        </div>
                      </div>

                      <div className="relative w-full h-[220px] sm:h-[250px] bg-[#EAF2EC]">
                        <iframe
                          title="Preview lokasi kandang"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(
                            `${activationLatitude},${activationLongitude}`
                          )}&z=18&output=embed`}
                          className="absolute inset-0 w-full h-full border-0"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          allowFullScreen
                        />
                      </div>

                      <div className="px-3.5 py-3 bg-[#FDFBF7] flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2D4A36] shrink-0 mt-0.5" />
                        <p className="text-[11px] text-stone-600 leading-relaxed">
                          Jika titik belum tepat, tekan <strong>Ambil Ulang Lokasi</strong> sambil berada di dekat kandang.
                          Data GPS ini akan disimpan sebagai lokasi Farm ID.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#FAF7F2] border border-[#EFECE6] p-3.5 text-xs text-stone-500">
                    Belum ada titik GPS. Tekan tombol di atas dan izinkan akses lokasi pada browser.
                  </div>
                )}
              </div>

              <div className="md:col-span-2 border-t border-[#EFECE6] pt-5 mt-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#EAF2EC] text-[#2D4A36] flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-[#1B3022]">Data Ayam Saat Aktivasi</h3>
                    <p className="text-xs text-stone-500">Isi sesuai kondisi ayam yang benar-benar ada di kandang saat ini.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-sm font-black text-[#1B3022]">Jenis Ayam *</label>
                    <select
                      value={activationBreed}
                      onChange={(e) => setActivationBreed(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-[#D9D4C8] bg-[#FDFBF7] text-[#1B3022] font-bold outline-none focus:ring-2 focus:ring-[#2D4A36]"
                    >
                      {!CHICKEN_TYPE_OPTIONS.includes(activationBreed as any) && activationBreed && (
                        <option value={activationBreed}>{activationBreed}</option>
                      )}
                      {CHICKEN_TYPE_OPTIONS.map((type) => (
                        <option key={type} value={type}>
                          {type === 'Ayam Petelur Cokelat' ? `${type} — utama paket Eggnest` : type}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] font-semibold text-stone-500">Ayam pada paket utama Eggnest termasuk kategori ayam petelur cokelat.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#1B3022]">Jumlah Ayam Aktif *</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={activationChickenCount || ''}
                        onChange={(e) => setActivationChickenCount(Number(e.target.value))}
                        placeholder="12"
                        className="w-full px-4 py-3.5 pr-16 rounded-2xl border border-[#D9D4C8] bg-[#FDFBF7] text-[#1B3022] font-black outline-none focus:ring-2 focus:ring-[#2D4A36]"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">ekor</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#1B3022]">Usia Ayam Saat Ini *</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={activationAgeWeeks || ''}
                        onChange={(e) => setActivationAgeWeeks(Number(e.target.value))}
                        placeholder="18"
                        className="w-full px-4 py-3.5 pr-20 rounded-2xl border border-[#D9D4C8] bg-[#FDFBF7] text-[#1B3022] font-black outline-none focus:ring-2 focus:ring-[#2D4A36]"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">minggu</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingActivation || isGettingGps}
                className="w-full sm:w-auto min-w-[260px] px-6 py-4 rounded-2xl bg-[#D4AF37] hover:bg-[#C49C24] text-[#1B3022] text-base font-black shadow-sm transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                <MapPin className="w-5 h-5" />
                {isSavingActivation ? 'MENYIMPAN...' : 'SIMPAN & AKTIFKAN KANDANG'}
              </button>
              <p className="text-xs text-stone-500 mt-3">
                Setelah data berhasil disimpan, panel aktivasi ini hilang dan form laporan langsung muncul.
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-[#EAF2EC] text-[#1B3022] text-xs font-bold rounded-full border border-[#CDE3D3]">
            Input Cepat 20–30 Detik
          </span>
          {farm.farmCode && (
            <span className="text-xs text-stone-500 font-medium">Farm ID: {farm.farmCode}</span>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1B3022] font-['Outfit'] tracking-tight mt-1">
          Lapor Hasil Hari Ini
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm font-medium mt-1">
          Pencatatan harian menjaga ayam terpantau dan garansi bibit tetap aktif.
        </p>
      </div>

      {/* Success Notification Banner if saved */}
      {savedSuccess && lastStats && (
        <div className="p-5 sm:p-6 bg-[#EAF2EC] border-2 border-[#588157] rounded-3xl shadow-sm space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2D4A36] text-[#FDFBF7] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7 text-[#D4AF37]" />
              </div>
              <div>
                <span className="bg-[#2D4A36] text-[#FDFBF7] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  STATUS: BAIK & TERSIMPAN
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-[#1B3022] mt-0.5 font-['Outfit']">
                  Laporan berhasil disimpan ke Database.
                </h3>
              </div>
            </div>
            <button
              onClick={() => setSavedSuccess(false)}
              className="text-xs font-bold text-stone-500 hover:text-stone-800 cursor-pointer p-1"
            >
              Tutup ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-white p-3 rounded-xl border border-[#EFECE6]">
              <span className="text-xs text-stone-500 font-medium">Produksi hari ini:</span>
              <p className="text-xl font-black text-[#1B3022] font-['Outfit']">
                {lastStats.eggs} butir
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#EFECE6]">
              <span className="text-xs text-stone-500 font-medium">Produktivitas:</span>
              <p className="text-xl font-black text-[#2D4A36] font-['Outfit']">
                {lastStats.prod}%
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#EFECE6] col-span-2 sm:col-span-1">
              <span className="text-xs text-stone-500 font-medium">Kondisi Kandang:</span>
              <p className="text-xl font-black text-[#1B3022] font-['Outfit']">
                {chickenCondition === 'healthy' ? 'Semua Sehat' : 'Perlu Pantauan'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Input Form */}
      <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs overflow-hidden p-4 sm:p-6 md:p-8">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6 sm:space-y-7">
          {/* Tanggal Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EFECE6]">
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block font-['Outfit']">
                Tanggal Laporan
              </label>
              <div className="text-base sm:text-lg font-bold text-[#1B3022] font-['Outfit'] mt-0.5">
                {formatLongDateId(date)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#2D4A36] shrink-0" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#E5E1D8] font-bold text-sm text-[#1B3022] focus:ring-2 focus:ring-[#2D4A36] outline-none bg-[#FAF7F2]"
              />
            </div>
          </div>

          {/* Section 1: Telur Hari Ini */}
          <div className="bg-[#F7F4EE] p-4 sm:p-5 rounded-3xl border border-[#E5E1D8] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1B3022] flex items-center gap-2 font-['Outfit']">
                  <Egg className="w-5 h-5 text-[#D4AF37]" />
                  Telur Hari Ini
                </h3>
                <p className="text-xs text-stone-500">
                  Total panen telur pagi dan sore
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 bg-[#FEF6E9] text-[#78350F] rounded-full border border-[#FDE68A]">
                Satuan: butir
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-4 py-2">
              <button
                type="button"
                id="page-minus-egg-btn"
                onClick={() => setEggCount(Math.max(0, eggCount - 1))}
                className="w-14 h-14 rounded-2xl bg-white border-2 border-[#E5E1D8] hover:border-[#2D4A36] active:bg-[#FAF7F2] text-[#1B3022] font-black text-2xl flex items-center justify-center shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                aria-label="Kurangi butir telur"
              >
                <Minus className="w-6 h-6" />
              </button>

              <div className="flex-1 max-w-[170px] text-center bg-white py-2 px-3 rounded-2xl border-2 border-[#2D4A36]/40 shadow-inner focus-within:border-[#2D4A36] focus-within:ring-2 focus-within:ring-[#2D4A36]/10">
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={eggCount}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEggCount(value === '' ? 0 : Math.max(0, Math.floor(Number(value) || 0)));
                  }}
                  aria-label="Jumlah telur hari ini"
                  className="w-full bg-transparent text-center text-4xl sm:text-5xl font-black text-[#1B3022] font-['Outfit'] leading-none outline-none appearance-none"
                />
                <span className="text-[11px] text-stone-500 font-bold uppercase tracking-wider mt-1 block">
                  butir
                </span>
              </div>

              <button
                type="button"
                id="page-plus-egg-btn"
                onClick={() => setEggCount(eggCount + 1)}
                className="w-14 h-14 rounded-2xl bg-white border-2 border-[#E5E1D8] hover:border-[#2D4A36] active:bg-[#FAF7F2] text-[#1B3022] font-black text-2xl flex items-center justify-center shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                aria-label="Tambah butir telur"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center mt-2">
              <span className="text-xs font-semibold text-stone-600">
                Produktivitas:{' '}
                <strong className="text-[#2D4A36]">
                  {farm.activeChickens > 0 ? Math.round((eggCount / farm.activeChickens) * 100) : 0}%
                </strong>{' '}
                ({eggCount} butir / {farm.activeChickens || 0} ayam)
              </span>
            </div>
          </div>

          {/* Section 2: Pakan Hari Ini */}
          <div className="bg-[#F7F4EE] p-4 sm:p-5 rounded-3xl border border-[#E5E1D8] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1B3022] flex items-center gap-2 font-['Outfit']">
                  <Wheat className="w-5 h-5 text-[#588157]" />
                  Pakan Hari Ini
                </h3>
                <p className="text-xs text-stone-500">
                  Total takaran konsentrat pakan harian
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 bg-[#EAF2EC] text-[#1B3022] rounded-full border border-[#CDE3D3]">
                Satuan: kg
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-4 py-2">
              <button
                type="button"
                id="page-minus-feed-btn"
                onClick={() =>
                  setFeedKg(Math.max(0, Number((feedKg - 0.1).toFixed(1))))
                }
                className="w-14 h-14 rounded-2xl bg-white border-2 border-[#E5E1D8] hover:border-[#2D4A36] active:bg-[#FAF7F2] text-[#1B3022] font-black text-2xl flex items-center justify-center shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                aria-label="Kurangi takaran pakan"
              >
                <Minus className="w-6 h-6" />
              </button>

              <div className="flex-1 max-w-[170px] text-center bg-white py-2 px-3 rounded-2xl border-2 border-[#2D4A36]/40 shadow-inner focus-within:border-[#2D4A36] focus-within:ring-2 focus-within:ring-[#2D4A36]/10">
                <input
                  type="text"
                  inputMode="decimal"
                  value={feedKg === 0 ? '0' : String(feedKg).replace('.', ',')}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => {
                    const raw = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
                    const parts = raw.split('.');
                    const normalized =
                      parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : parts[0];
                    const value = normalized === '' ? 0 : Number(normalized);
                    if (Number.isFinite(value)) {
                      setFeedKg(Math.max(0, value));
                    }
                  }}
                  aria-label="Jumlah pakan hari ini dalam kilogram"
                  className="w-full bg-transparent text-center text-4xl sm:text-5xl font-black text-[#1B3022] font-['Outfit'] leading-none outline-none"
                />
                <span className="text-[11px] text-stone-500 font-bold uppercase tracking-wider mt-1 block">
                  kg pakan
                </span>
              </div>

              <button
                type="button"
                id="page-plus-feed-btn"
                onClick={() =>
                  setFeedKg(Number((feedKg + 0.1).toFixed(1)))
                }
                className="w-14 h-14 rounded-2xl bg-white border-2 border-[#E5E1D8] hover:border-[#2D4A36] active:bg-[#FAF7F2] text-[#1B3022] font-black text-2xl flex items-center justify-center shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                aria-label="Tambah takaran pakan"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center mt-2">
              <span className="text-xs font-semibold text-stone-600">
                Porsi rata-rata: <strong className="text-[#2D4A36]">100 gram/ekor</strong> (Ideal)
              </span>
            </div>
          </div>

          {/* Section 3: Chicken Health Picker (Mobile-First UX) */}
          <ChickenHealthPicker
            totalChickens={totalChickensCount}
            chickenCondition={chickenCondition}
            onConditionChange={setChickenCondition}
            chickens={chickensState}
            onChangeChickens={setChickensState}
          />

          {/* Section 4: Catatan (Optional) */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-stone-700 mb-1.5">
              Catatan Kandang <span className="text-stone-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              id="page-report-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ceritakan perkembangan khusus, misal: pemberian vitamin tambahan, pembersihan kandang..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E5E1D8] focus:outline-none focus:ring-2 focus:ring-[#2D4A36] text-xs sm:text-sm bg-white"
            />
          </div>

          {/* Section 5: Foto Kondisi */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-stone-700 mb-1.5">
              Foto Kondisi <span className="text-stone-400 font-normal">(JPG, PNG maksimal 5MB)</span>
            </label>
            <label className="border-2 border-dashed border-[#E5E1D8] hover:border-[#2D4A36] rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center cursor-pointer bg-white hover:bg-[#FAF7F2] transition-all">
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {photoPreview ? (
                <div className="relative w-full h-40 rounded-xl overflow-hidden shadow-xs">
                  <img
                    src={photoPreview}
                    alt="Preview foto kondisi"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold">
                    Sentuh untuk mengganti foto
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center py-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#EAF2EC] text-[#2D4A36] flex items-center justify-center mb-1.5 border border-[#CDE3D3]">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-[#1B3022]">
                    Ambil Foto Kandang atau Telur
                  </span>
                  <span className="text-[11px] text-stone-500 mt-0.5">
                    Sentuh untuk membuka kamera atau galeri
                  </span>
                </div>
              )}
            </label>
          </div>

          {/* Big Submit Button */}
          <button
            type="submit"
            id="page-submit-report-btn"
            disabled={isSubmitting}
            className="w-full py-4 sm:py-5 bg-[#2D6A4F] hover:bg-[#1B3022] active:bg-[#15251a] text-[#FDFBF7] font-black rounded-2xl sm:rounded-3xl text-lg sm:text-xl shadow-md shadow-[#2D6A4F]/25 transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            <CheckCircle2 className="w-6 h-6 text-[#D4AF37]" />
            <span>{isSubmitting ? 'MENYIMPAN...' : 'SIMPAN LAPORAN'}</span>
          </button>
        </form>
      </div>

      {/* Riwayat Laporan Harian Table */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#EFECE6] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit'] flex items-center gap-2">
              <History className="w-5 h-5 text-[#2D4A36]" />
              Riwayat Laporan Kandang
            </h3>
            <p className="text-xs text-stone-500">
              Menampilkan {filteredReports.length} catatan produksi
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                searchFilter === 'all'
                  ? 'bg-[#1B3022] text-[#FDFBF7]'
                  : 'bg-[#FAF7F2] text-stone-600 hover:bg-[#EFECE6] border border-[#EFECE6]'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setSearchFilter('high')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                searchFilter === 'high'
                  ? 'bg-[#2D4A36] text-[#FDFBF7]'
                  : 'bg-[#FAF7F2] text-stone-600 hover:bg-[#EFECE6] border border-[#EFECE6]'
              }`}
            >
              Produksi Tinggi (80%+)
            </button>
            <button
              onClick={() => setSearchFilter('issue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                searchFilter === 'issue'
                  ? 'bg-[#C2841E] text-white'
                  : 'bg-[#FAF7F2] text-stone-600 hover:bg-[#EFECE6] border border-[#EFECE6]'
              }`}
            >
              Ada Masalah
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#EFECE6] text-stone-500 text-xs uppercase tracking-wider">
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Produksi Telur</th>
                <th className="py-3 px-3">Pakan (kg)</th>
                <th className="py-3 px-3">Produktivitas</th>
                <th className="py-3 px-3">Kondisi</th>
                <th className="py-3 px-3">Foto</th>
                <th className="py-3 px-3">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6]">
              {filteredReports.slice(-10).reverse().map((rep) => (
                <tr key={rep.id} className="hover:bg-[#FAF7F2] transition-colors">
                  <td className="py-3.5 px-3 font-bold text-[#1B3022]">
                    {rep.date}
                  </td>
                  <td className="py-3.5 px-3 font-extrabold text-[#1B3022] font-['Outfit']">
                    {rep.eggCount} butir
                  </td>
                  <td className="py-3.5 px-3 text-stone-700">
                    {rep.feedKg.toString().replace('.', ',')} kg
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-black text-[#2D4A36]">
                      {rep.productivityRate}%
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    {rep.chickenCondition === 'healthy' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1B3022] bg-[#EAF2EC] px-2.5 py-0.5 rounded-full border border-[#CDE3D3]">
                        ✓ Sehat
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#78350F] bg-[#FEF6E9] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
                        ⚠️ {(rep.issueTypes || []).join(', ') || 'Masalah'}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3">
                    {rep.photoUrl ? (
                      <button
                        type="button"
                        onClick={() => setSelectedReportPhoto(rep)}
                        className="group relative w-14 h-14 rounded-xl overflow-hidden border-2 border-[#E5E1D8] hover:border-[#2D4A36] shadow-sm cursor-pointer bg-[#F7F4EE]"
                        title="Lihat foto laporan"
                      >
                        <img
                          src={rep.photoUrl}
                          alt={`Foto laporan ${rep.date}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                        </span>
                      </button>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-xs text-stone-500 max-w-xs truncate">
                    {rep.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReportPhoto?.photoUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedReportPhoto(null)}
        >
          <div
            className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-[#1B3022] text-white flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-black">
                  Foto Laporan Kandang
                </p>
                <h3 className="font-black font-['Outfit']">
                  {formatLongDateId(selectedReportPhoto.date)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReportPhoto(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 font-black cursor-pointer"
                aria-label="Tutup foto"
              >
                ✕
              </button>
            </div>

            <div className="bg-black">
              <img
                src={selectedReportPhoto.photoUrl}
                alt={`Foto kondisi kandang ${selectedReportPhoto.date}`}
                className="w-full max-h-[65vh] object-contain"
              />
            </div>

            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#F7F4EE] rounded-xl p-3">
                <span className="text-stone-500">Farm ID</span>
                <p className="font-black text-[#1B3022] mt-1">{farm.farmCode}</p>
              </div>
              <div className="bg-[#F7F4EE] rounded-xl p-3">
                <span className="text-stone-500">Telur</span>
                <p className="font-black text-[#1B3022] mt-1">{selectedReportPhoto.eggCount} butir</p>
              </div>
              <div className="bg-[#F7F4EE] rounded-xl p-3">
                <span className="text-stone-500">Pakan</span>
                <p className="font-black text-[#1B3022] mt-1">
                  {String(selectedReportPhoto.feedKg).replace('.', ',')} kg
                </p>
              </div>
              <div className="bg-[#F7F4EE] rounded-xl p-3">
                <span className="text-stone-500">Kondisi</span>
                <p className="font-black text-[#1B3022] mt-1">
                  {selectedReportPhoto.chickenCondition === 'healthy' ? '🟢 Sehat' : '🟡 Perlu Pantauan'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
