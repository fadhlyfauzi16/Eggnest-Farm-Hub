import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  MapPin,
  Navigation,
  ShieldCheck,
  Warehouse,
} from 'lucide-react';
import { api } from '../services/api';
import { useFarm } from '../context/FarmContext';
import { EggnestLogo } from '../components/common/EggnestLogo';

const CHICKEN_TYPE_OPTIONS = [
  'Layer Lohmann Brown Petelur Unggul',
  'Ayam Petelur Cokelat',
  'Ayam Petelur Putih',
  'Ayam Kampung Petelur',
  'Ayam Arab Petelur',
  'Ayam Joper',
  'Ayam Petelur Lainnya',
];

const isActivationComplete = (farm: any): boolean => {
  const location = String(farm?.location || '').trim();
  const fullAddress = String(farm?.fullAddress || farm?.full_address || '').trim();
  const key = location.toLowerCase();

  const validLocation =
    location.length > 0 &&
    key !== 'indonesia' &&
    !key.includes('belum') &&
    !key.includes('menunggu');

  const validLat =
    farm?.latitude !== null &&
    farm?.latitude !== undefined &&
    farm?.latitude !== '' &&
    Number.isFinite(Number(farm.latitude));

  const validLng =
    farm?.longitude !== null &&
    farm?.longitude !== undefined &&
    farm?.longitude !== '' &&
    Number.isFinite(Number(farm.longitude));

  return validLocation && fullAddress.length > 0 && validLat && validLng;
};

export const MemberActivationPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    farm,
    updateMyFarm,
    showToast,
    logout,
  } = useFarm();

  const [gpsLoading, setGpsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allowAddressEdit, setAllowAddressEdit] = useState(false);
  const [form, setForm] = useState<any>({
    location: '',
    fullAddress: '',
    province: '',
    regency: '',
    district: '',
    village: '',
    latitude: null,
    longitude: null,
    chickenBreed: 'Layer Lohmann Brown Petelur Unggul',
    activeChickens: 12,
    currentAgeWeeks: 18,
  });

  const alreadyComplete = useMemo(() => isActivationComplete(farm), [
    farm?.id,
    farm?.location,
    farm?.fullAddress,
    farm?.latitude,
    farm?.longitude,
  ]);

  useEffect(() => {
    if (!farm?.id) return;
    setForm({
      location: String(farm.location || ''),
      fullAddress: String(farm.fullAddress || ''),
      province: String((farm as any).province || ''),
      regency: String((farm as any).regency || ''),
      district: String((farm as any).district || ''),
      village: String((farm as any).village || ''),
      latitude:
        farm.latitude === null || farm.latitude === undefined
          ? null
          : Number(farm.latitude),
      longitude:
        farm.longitude === null || farm.longitude === undefined
          ? null
          : Number(farm.longitude),
      chickenBreed: String(
        farm.chickenBreed || 'Layer Lohmann Brown Petelur Unggul'
      ),
      activeChickens: Number(farm.activeChickens || 12),
      currentAgeWeeks: Number(farm.currentAgeWeeks || 18),
    });
  }, [farm?.id]);

  if (currentUser?.role !== 'member') {
    return <Navigate to="/" replace />;
  }

  if (alreadyComplete) {
    return <Navigate to="/profile" replace />;
  }

  const captureGps = () => {
    if (!navigator.geolocation) {
      showToast('⚠️ Browser/perangkat ini tidak mendukung GPS.');
      return;
    }

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = Number(position.coords.latitude.toFixed(7));
        const longitude = Number(position.coords.longitude.toFixed(7));

        setForm((prev: any) => ({
          ...prev,
          latitude,
          longitude,
        }));

        try {
          const response = await api.reverseGeocode(latitude, longitude);
          const loc = (response.location || {}) as {
            fullAddress?: string;
            province?: string;
            regency?: string;
            city?: string;
            district?: string;
            village?: string;
          };

          setForm((prev: any) => ({
            ...prev,
            latitude,
            longitude,
            fullAddress: loc.fullAddress || prev.fullAddress,
            location:
              loc.regency ||
              loc.city ||
              loc.district ||
              prev.location,
            province: loc.province || prev.province,
            regency: loc.regency || loc.city || prev.regency,
            district: loc.district || prev.district,
            village: loc.village || prev.village,
          }));

          showToast('📍 Lokasi kandang berhasil ditemukan.');
        } catch (error: any) {
          setAllowAddressEdit(true);
          showToast(
            '📍 Titik GPS sudah didapat. Alamat otomatis belum lengkap, silakan lengkapi alamat.'
          );
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        setGpsLoading(false);

        if (error.code === error.PERMISSION_DENIED) {
          showToast(
            '⚠️ Izin lokasi ditolak. Aktifkan izin lokasi browser lalu tekan Ambil Lokasi lagi.'
          );
          return;
        }

        showToast(
          '⚠️ Lokasi belum berhasil didapatkan. Coba lagi di area dengan sinyal GPS yang baik.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleActivate = async (event: React.FormEvent) => {
    event.preventDefault();

    const cleanLocation = String(form.location || '').trim();
    const cleanAddress = String(form.fullAddress || '').trim();
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      showToast('⚠️ Tekan Ambil Lokasi Kandang terlebih dahulu.');
      return;
    }

    if (!cleanLocation) {
      showToast('⚠️ Kabupaten/Kota belum tersedia.');
      setAllowAddressEdit(true);
      return;
    }

    if (!cleanAddress) {
      showToast('⚠️ Alamat lengkap kandang belum tersedia.');
      setAllowAddressEdit(true);
      return;
    }

    try {
      setSaving(true);

      const result = await updateMyFarm({
        location: cleanLocation,
        fullAddress: cleanAddress,
        latitude: lat,
        longitude: lng,
        chickenBreed: String(form.chickenBreed || '').trim(),
        activeChickens: Number(form.activeChickens || 12),
        currentAgeWeeks: Number(form.currentAgeWeeks || 18),
        province: String(form.province || ''),
        regency: String(form.regency || cleanLocation),
        district: String(form.district || ''),
        village: String(form.village || ''),
      } as any);

      if (!result.success) return;

      showToast('✅ Kandang berhasil diaktifkan. Selamat datang di Eggnest Farm Hub.');
      navigate('/profile', { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1B3022] font-['Plus_Jakarta_Sans']">
      <header className="border-b border-[#EFECE6] bg-white/90 px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <EggnestLogo size="md" />
          <button
            type="button"
            onClick={logout}
            className="text-xs sm:text-sm font-black text-stone-500 hover:text-[#1B3022]"
          >
            Keluar
          </button>
        </div>
      </header>

      <main className="px-4 py-7 sm:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-7">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF2EC] border border-[#CDE3D3] text-xs font-black">
              <Warehouse className="w-4 h-4" />
              AKTIVASI KANDANG PERTAMA
            </span>

            <h1 className="mt-4 text-3xl sm:text-4xl font-black font-['Outfit']">
              Lengkapi Lokasi Kandang
            </h1>

            <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-xl mx-auto">
              Sebelum mulai membuat laporan, kami perlu menyimpan lokasi kandang
              untuk Farm ID <strong>{farm?.farmCode || '-'}</strong>.
            </p>
          </div>

          <form
            onSubmit={handleActivate}
            className="bg-white rounded-[28px] border border-[#E8E3DA] shadow-sm overflow-hidden"
          >
            <div className="p-5 sm:p-7 border-b border-[#EFECE6] bg-[#FAF7F2]">
              <div className="grid sm:grid-cols-3 gap-3">
                <Step number="1" title="Ambil GPS" active />
                <Step number="2" title="Periksa Alamat" active={form.latitude != null} />
                <Step number="3" title="Aktifkan" active={Boolean(form.fullAddress)} />
              </div>
            </div>

            <div className="p-5 sm:p-7 space-y-6">
              <div className="rounded-3xl bg-[#EAF2EC] border border-[#CDE3D3] p-5">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#1B3022] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-black text-lg">Lokasi Kandang</h2>
                    <p className="text-xs sm:text-sm text-stone-600 mt-1">
                      Tekan tombol di bawah. GPS dan alamat akan diambil otomatis.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={captureGps}
                  disabled={gpsLoading}
                  className="mt-4 w-full min-h-14 rounded-2xl bg-[#1B3022] hover:bg-[#2D4A36] text-white font-black flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {gpsLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                  ) : (
                    <Navigation className="w-5 h-5 text-[#D4AF37]" />
                  )}
                  {gpsLoading
                    ? 'Mengambil GPS & Alamat...'
                    : form.latitude != null
                    ? 'Ambil Ulang Lokasi Kandang'
                    : 'Ambil Lokasi Kandang'}
                </button>

                {form.latitude != null && form.longitude != null && (
                  <div className="mt-4 bg-white rounded-2xl border border-[#CDE3D3] p-4">
                    <div className="flex items-center gap-2 text-xs font-black text-[#2D4A36]">
                      <CheckCircle2 className="w-4 h-4" />
                      TITIK GPS DITEMUKAN
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1">
                      {form.latitude}, {form.longitude}
                    </div>
                    <div className="mt-3 text-sm font-bold leading-relaxed">
                      {form.fullAddress || 'Alamat otomatis belum ditemukan.'}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setAllowAddressEdit((v) => !v)}
                  className="text-xs font-black text-[#2D4A36] underline underline-offset-4"
                >
                  {allowAddressEdit
                    ? 'Sembunyikan koreksi alamat'
                    : 'Alamat kurang tepat? Koreksi manual'}
                </button>
              </div>

              {allowAddressEdit && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-black">
                      Kabupaten / Kota *
                    </span>
                    <input
                      value={form.location}
                      onChange={(e) =>
                        setForm((prev: any) => ({
                          ...prev,
                          location: e.target.value,
                          regency: e.target.value,
                        }))
                      }
                      placeholder="Contoh: Kabupaten Klaten"
                      className="mt-2 field"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="text-sm font-black">
                      Alamat Lengkap / Patokan *
                    </span>
                    <textarea
                      rows={4}
                      value={form.fullAddress}
                      onChange={(e) =>
                        setForm((prev: any) => ({
                          ...prev,
                          fullAddress: e.target.value,
                        }))
                      }
                      placeholder="Dusun/Desa, RT/RW, Kecamatan, Kabupaten/Kota, Provinsi"
                      className="mt-2 field resize-none"
                    />
                  </label>
                </div>
              )}

              <div className="rounded-2xl border border-[#EFECE6] p-4 bg-[#FAF7F2]">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#2D4A36] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-black text-sm">
                      Setelah aktivasi selesai
                    </div>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      Anda akan masuk ke Profil Kandang. Setelah itu menu Beranda,
                      Laporan Kandang, Penjualan Telur, Perkembangan, Academy, dan
                      Farm Score dapat digunakan seperti biasa.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-7 pt-0">
              <button
                type="submit"
                disabled={saving || gpsLoading}
                className="w-full min-h-14 rounded-2xl bg-[#D4AF37] hover:bg-[#E2BE45] text-[#1B3022] font-black text-base flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Mengaktifkan Kandang...
                  </>
                ) : (
                  <>
                    SIMPAN & AKTIFKAN KANDANG
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <style>{`
        .field {
          width: 100%;
          padding: .875rem 1rem;
          border-radius: 1rem;
          border: 1px solid #D9D4C8;
          background: #FDFBF7;
          color: #1B3022;
          font-weight: 700;
          outline: none;
        }
        .field:focus {
          border-color: #2D4A36;
          box-shadow: 0 0 0 3px rgba(45, 74, 54, .10);
        }
      `}</style>
    </div>
  );
};

const Step = ({
  number,
  title,
  active,
}: {
  number: string;
  title: string;
  active?: boolean;
}) => (
  <div
    className={`rounded-2xl border px-3 py-3 flex items-center gap-3 ${
      active
        ? 'bg-white border-[#CDE3D3]'
        : 'bg-[#F7F4EE] border-[#EFECE6] opacity-60'
    }`}
  >
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
        active
          ? 'bg-[#1B3022] text-white'
          : 'bg-[#E5E1D8] text-stone-500'
      }`}
    >
      {number}
    </div>
    <span className="text-xs font-black">{title}</span>
  </div>
);

export default MemberActivationPage;
