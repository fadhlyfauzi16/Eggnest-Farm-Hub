import React, { useState } from 'react';
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
  Share2,
  Lock,
  Wallet,
  ShoppingBag,
  Trophy,
  ExternalLink,
  Copy,
} from 'lucide-react';

export const FarmProfilePage: React.FC = () => {
  const { farm, showToast } = useFarm();
  const [showQrModal, setShowQrModal] = useState(false);

  const copyFarmCode = () => {
    navigator.clipboard.writeText(farm.farmCode);
    showToast(`📋 Kode Kandang ${farm.farmCode} disalin ke clipboard!`);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <span className="px-3 py-1 bg-[#EAF2EC] text-[#1B3022] text-xs font-bold rounded-full border border-[#CDE3D3]">
          Identitas Digital Kemitraan
        </span>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1B3022] font-['Outfit'] tracking-tight mt-1">
          Profil Kandang
        </h1>
        <p className="text-stone-600 text-sm font-medium mt-1">
          Data registrasi, verifikasi sertifikat, status garansi, dan kartu QR Farm petugas.
        </p>
      </div>

      {/* Main Farm Card & QR Code Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Detailed Info Card */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFECE6] pb-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#1B3022] text-[#FDFBF7] flex items-center justify-center shadow-md">
                <Warehouse className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <div>
                <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                  Farm ID Resmi
                </span>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-black text-[#1B3022] font-['Outfit']">
                    {farm.farmCode}
                  </h2>
                  <button
                    onClick={copyFarmCode}
                    className="p-1.5 text-stone-400 hover:text-[#2D4A36] hover:bg-[#FAF7F2] rounded-lg transition-colors cursor-pointer"
                    title="Salin Kode Farm"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <span className="bg-[#EAF2EC] text-[#1B3022] text-xs font-black px-3.5 py-1.5 rounded-full uppercase border border-[#CDE3D3] self-start sm:self-auto">
              ✓ KANDANG AKTIF
            </span>
          </div>

          {/* Structured Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6]">
              <span className="text-xs text-stone-500 font-semibold flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#2D4A36]" /> Pemilik Kandang
              </span>
              <p className="text-base font-bold text-[#1B3022] mt-1">{farm.ownerName}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6]">
              <span className="text-xs text-stone-500 font-semibold flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#2D4A36]" /> Lokasi Kandang
              </span>
              <p className="text-base font-bold text-[#1B3022] mt-1">{farm.location}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6]">
              <span className="text-xs text-stone-500 font-semibold flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#2D4A36]" /> Tanggal Aktivasi
              </span>
              <p className="text-base font-bold text-[#1B3022] mt-1">{farm.activationDate}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6]">
              <span className="text-xs text-stone-500 font-semibold flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#2D4A36]" /> Jenis Ayam
              </span>
              <p className="text-base font-bold text-[#1B3022] mt-1">{farm.chickenBreed}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6]">
              <span className="text-xs text-stone-500 font-semibold flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#2D4A36]" /> Jumlah Ayam
              </span>
              <p className="text-base font-bold text-[#1B3022] mt-1">
                {farm.activeChickens} ekor aktif{' '}
                <span className="text-xs text-stone-500 font-normal">
                  (Awal: {farm.initialChickens} ekor)
                </span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6]">
              <span className="text-xs text-stone-500 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#2D4A36]" /> Usia Ayam
              </span>
              <p className="text-base font-bold text-[#1B3022] mt-1">
                {farm.currentAgeWeeks} minggu{' '}
                <span className="text-xs text-stone-500 font-normal">
                  (Diterima: {farm.initialAgeWeeks} minggu)
                </span>
              </p>
            </div>
          </div>

          {/* Garansi Card */}
          <div className="p-5 rounded-2xl bg-[#EAF2EC] border border-[#CDE3D3] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#2D4A36] text-[#FDFBF7]">
                <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#1B3022] uppercase font-['Outfit']">
                  Status Garansi Kemitraan
                </span>
                <p className="text-base font-black text-[#1B3022] font-['Outfit']">
                  Garansi Aktif • Berakhir: {farm.warrantyEnd}
                </p>
                <p className="text-xs text-stone-600">
                  Penggantian gratis jika ayam sakit/mati dengan syarat rutin lapor harian.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: QR Farm Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-8 flex flex-col justify-between items-center text-center">
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Kartu Digital
              </span>
              <span className="text-xs font-black text-[#1B3022] bg-[#EAF2EC] px-2.5 py-0.5 rounded-full border border-[#CDE3D3]">
                QR FARM
              </span>
            </div>

            {/* Visual QR Code Display */}
            <div className="p-4 bg-[#FAF7F2] rounded-3xl border-2 border-dashed border-[#E5E1D8] shadow-inner flex flex-col items-center justify-center">
              <div className="w-48 h-48 bg-[#1B3022] rounded-2xl p-3 relative flex items-center justify-center shadow-md">
                {/* SVG Mock of Crisp Vector QR */}
                <svg viewBox="0 0 100 100" className="w-full h-full fill-[#FDFBF7]">
                  {/* Top-Left Corner Box */}
                  <rect x="10" y="10" width="25" height="25" fill="#FDFBF7" rx="3" />
                  <rect x="14" y="14" width="17" height="17" fill="#1B3022" rx="2" />
                  <rect x="18" y="18" width="9" height="9" fill="#FDFBF7" rx="1" />

                  {/* Top-Right Corner Box */}
                  <rect x="65" y="10" width="25" height="25" fill="#FDFBF7" rx="3" />
                  <rect x="69" y="14" width="17" height="17" fill="#1B3022" rx="2" />
                  <rect x="73" y="18" width="9" height="9" fill="#FDFBF7" rx="1" />

                  {/* Bottom-Left Corner Box */}
                  <rect x="10" y="65" width="25" height="25" fill="#FDFBF7" rx="3" />
                  <rect x="14" y="69" width="17" height="17" fill="#1B3022" rx="2" />
                  <rect x="18" y="73" width="9" height="9" fill="#FDFBF7" rx="1" />

                  {/* Data Dots & Matrix Patterns */}
                  <rect x="42" y="12" width="6" height="6" />
                  <rect x="52" y="12" width="6" height="6" />
                  <rect x="42" y="24" width="6" height="6" />
                  <rect x="48" y="32" width="6" height="6" />
                  <rect x="12" y="42" width="6" height="6" />
                  <rect x="24" y="48" width="6" height="6" />
                  <rect x="40" y="45" width="20" height="20" fill="#D4AF37" rx="4" />
                  <circle cx="50" cy="55" r="5" fill="#1B3022" />
                  <rect x="68" y="42" width="6" height="6" />
                  <rect x="80" y="48" width="6" height="6" />
                  <rect x="42" y="70" width="6" height="6" />
                  <rect x="52" y="78" width="6" height="6" />
                  <rect x="68" y="68" width="8" height="8" />
                  <rect x="80" y="76" width="6" height="6" />
                </svg>
              </div>

              <span className="text-xs font-black text-[#1B3022] mt-3 font-['Outfit'] tracking-wider">
                {farm.farmCode}
              </span>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Scan oleh Petugas Lapangan Eggnest
              </p>
            </div>
          </div>

          <div className="w-full pt-4 space-y-2">
            <button
              onClick={() => showToast('🖨️ Mengirim instruksi cetak QR Farm...')}
              className="w-full py-3 bg-[#2D4A36] hover:bg-[#1B3022] text-[#FDFBF7] font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak QR Code Kandang
            </button>
            <button
              onClick={() => showToast('📥 File QR Code berhasil diunduh!')}
              className="w-full py-2.5 bg-[#FAF7F2] hover:bg-[#EFECE6] text-[#1B3022] font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer border border-[#EFECE6]"
            >
              <Download className="w-4 h-4" />
              Unduh Gambar PNG
            </button>
          </div>
        </div>
      </div>

      {/* Ekosistem Mendatang (Eggnest Expansion Roadmap) */}
      <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-8 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#FEF6E9] text-[#78350F] rounded-full border border-[#FDE68A]">
              Ekosistem Terintegrasi
            </span>
            <span className="text-xs text-stone-400">Tahap Pengembangan Lanjutan</span>
          </div>
          <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit'] mt-1">
            Fitur Masa Depan Eggnest Farm Hub
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6] space-y-2 opacity-90">
            <div className="w-8 h-8 rounded-xl bg-[#EAF2EC] text-[#2D4A36] flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-[#1B3022]">Proof of Productivity</h4>
            <p className="text-xs text-stone-500">
              Sertifikat digital terenkripsi yang membuktikan performa panen organik Anda.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6] space-y-2 opacity-90">
            <div className="w-8 h-8 rounded-xl bg-[#FEF6E9] text-[#78350F] flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-[#1B3022]">Wallet & Eggnesting</h4>
            <p className="text-xs text-stone-500">
              Dompet digital untuk pencairan hasil panen & tabungan pakan konsentrat.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6] space-y-2 opacity-90">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold border border-blue-200">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-[#1B3022]">Marketplace Mitra</h4>
            <p className="text-xs text-stone-500">
              Jual telur langsung ke tetangga atau pelanggan sekitar via katalog Eggnest.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6] space-y-2 opacity-90">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center font-bold border border-purple-200">
              <Trophy className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-[#1B3022]">Leaderboard & Field Officer</h4>
            <p className="text-xs text-stone-500">
              Peringkat produksi regional dan jadwal kunjungan berkala petugas lapangan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
