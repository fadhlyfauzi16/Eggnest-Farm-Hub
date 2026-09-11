import React, { useState } from 'react';
import { EGGNEST_SLIDES, EggnestSlide } from '../data/eggnestSlides';
import { EggnestLogo } from './EggnestLogo';
import {
  Sparkles,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Smartphone,
  Users,
  Feather,
  ArrowRight,
  Calculator,
  HelpCircle,
  Building,
  HeartHandshake,
  Landmark,
  Scale,
  RefreshCw,
  Award,
  Layers,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';

interface EggnestSlideSectionsProps {
  eggCount: number;
  onOpenModal: () => void;
  onJumpToSlide: (slideNum: string) => void;
}

export const EggnestSlideSections: React.FC<EggnestSlideSectionsProps> = ({
  eggCount,
  onOpenModal,
  onJumpToSlide,
}) => {
  // Interactive calculator state for Slide 13
  const [calcEggPriceKg, setCalcEggPriceKg] = useState(24000);
  const [calcHouseCount, setCalcHouseCount] = useState(1);

  // Multiplier calculation for Slide 07 & 13
  const monthlyEggs = calcHouseCount * 330;
  const monthlyKg = Number((monthlyEggs * 0.0625).toFixed(1)); // ~16 eggs per kg => 20.6kg per 330 eggs
  const monthlyGrossValue = Math.round(monthlyKg * calcEggPriceKg);

  return (
    <div className="relative z-20 w-full flex flex-col items-center">
      {/* ========================================================================= */}
      {/* SLIDE 01 — DARI RUMAH, KITA BANGUN KETAHANAN PANGAN                      */}
      {/* ========================================================================= */}
      <section
        id="slide-01"
        data-slide-index="0"
        className="min-h-screen w-full flex flex-col justify-between pt-32 pb-16 px-6 sm:px-12 max-w-7xl mx-auto"
      >
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E9B949]/40 bg-[#153A24]/75 backdrop-blur-md text-[#E9B949] text-xs font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-[#E9B949] animate-pulse" />
            <span>SLIDE 01 • COVER GERAKAN</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#F7F1E4]/15 bg-[#153A24]/60 backdrop-blur-md text-[#D1C8B8] text-xs font-medium tracking-wider uppercase">
            <span>1 Rumah 1 Kandang</span>
          </div>
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E9B949]/30 bg-[#E9B949]/10 text-[#E9B949] text-xs font-semibold tracking-wider ml-auto">
            <Sparkles size={13} />
            <span>Kemandirian Protein Bangsa</span>
          </div>
        </div>

        <div className="my-auto py-10 max-w-3xl">
          <div className="text-xs sm:text-sm font-mono tracking-[0.3em] uppercase text-[#E9B949] mb-4 flex items-center gap-2">
            <span className="w-8 h-[1px] bg-[#E9B949]" />
            <span>EGGNEST HOME FARM PRESENTATION</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-medium tracking-tight text-[#FFFFFF] leading-[1.08] mb-6">
            Dari Rumah,
            <br />
            Kita Bangun
            <br />
            <span className="text-[#E9B949] font-normal italic">Ketahanan Pangan.</span>
          </h1>
          <p className="text-base sm:text-xl text-[#D1C8B8] leading-relaxed max-w-2xl font-light mb-8">
            Gerakan 1 Rumah 1 Kandang – Solusi peternakan rumahan modern yang higienis, terstandar, dan berprotein tinggi untuk kemandirian keluarga Indonesia.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={onOpenModal}
              className="px-8 py-4 rounded-full bg-[#E9B949] hover:bg-[#F3C75C] text-[#153A24] font-bold text-sm uppercase tracking-widest transition-all shadow-xl shadow-[#E9B949]/20 hover:scale-105 active:scale-95"
            >
              Mulai Bergabung Sekarang
            </button>
            <button
              onClick={() => onJumpToSlide('02')}
              className="px-7 py-4 rounded-full border border-[#F7F1E4]/25 hover:border-[#E9B949] text-[#F7F1E4] hover:text-[#E9B949] text-sm uppercase tracking-widest font-medium transition-colors bg-[#153A24]/40 backdrop-blur-sm"
            >
              Pelajari Alur Gerakan
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#F7F1E4]/10 pt-6">
          <div className="text-xs font-mono text-[#8D9C8F] tracking-widest uppercase flex items-center gap-2">
            <span>Scroll untuk Membaca Alur Lengkap</span>
          </div>
          <div className="animate-bounce text-[#E9B949]">
            <ChevronDown size={20} />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 02 — SETIAP HARI KITA BUTUH PANGAN                                  */}
      {/* ========================================================================= */}
      <section
        id="slide-02"
        data-slide-index="1"
        className="min-h-screen w-full flex flex-col justify-center py-28 px-6 sm:px-12 max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 bg-[#0C1F14]/90 p-8 sm:p-12 rounded-3xl border border-[#F7F1E4]/15 backdrop-blur-xl shadow-2xl">
            <div className="text-xs font-mono tracking-[0.25em] text-[#E9B949] uppercase mb-3 flex items-center gap-2">
              <span className="w-6 h-[1px] bg-[#E9B949]" />
              <span>SLIDE 02 • KEBUTUHAN DASAR</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#FFFFFF] leading-tight mb-5">
              Setiap Hari Kita Butuh Pangan.
            </h2>
            <div className="p-4 rounded-2xl bg-[#153A24]/80 border-l-4 border-[#E9B949] mb-6">
              <div className="text-xs font-mono text-[#E9B949] font-bold uppercase tracking-wider mb-1">
                PESAN UTAMA:
              </div>
              <p className="text-sm sm:text-base text-[#FFFFFF] font-medium leading-relaxed">
                Pangan bukan kebutuhan sesekali. Setiap keluarga membutuhkannya setiap hari.
              </p>
            </div>
            <div className="space-y-3.5 text-sm text-[#D1C8B8] font-light leading-relaxed mb-8">
              <p>
                Protein hewani adalah asupan krusial bagi tumbuh kembang otak anak, imunitas tubuh, dan stamina seluruh anggota keluarga.
              </p>
              <p>
                Dari sarapan hingga makan malam, telur merupakan sumber protein paling fleksibel, praktis, dan terjangkau yang dikonsumsi terus-menerus tanpa jeda hari.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#F7F1E4]/10">
              <div className="p-4 rounded-2xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
                <div className="text-2xl sm:text-3xl font-display font-bold text-[#E9B949]">3× Sehari</div>
                <div className="text-xs text-[#D1C8B8] mt-1">Kebutuhan Vital Keluarga</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
                <div className="text-2xl sm:text-3xl font-display font-bold text-[#FFFFFF]">365 Hari</div>
                <div className="text-xs text-[#D1C8B8] mt-1">Konsumsi Tanpa Terputus</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-4">
            <blockquote className="p-6 rounded-3xl bg-[#153A24]/75 border border-[#E9B949]/30 backdrop-blur-md">
              <div className="text-[#E9B949] font-serif text-3xl mb-2">“</div>
              <p className="text-sm sm:text-base text-[#F7F1E4] italic leading-relaxed">
                Pangan tidak bisa ditunda. Kita makan setiap hari, namun dari mana sumber protein harian keluarga kita berasal?
              </p>
            </blockquote>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 03 — TAPI KEBANYAKAN RUMAH MASIH HANYA MENJADI KONSUMEN             */}
      {/* ========================================================================= */}
      <section
        id="slide-03"
        data-slide-index="2"
        className="min-h-screen w-full flex flex-col justify-center py-28 px-6 sm:px-12 max-w-7xl mx-auto"
      >
        <div className="max-w-4xl bg-[#0C1F14]/90 p-8 sm:p-12 rounded-3xl border border-red-500/25 backdrop-blur-xl shadow-2xl mx-auto">
          <div className="text-xs font-mono tracking-[0.25em] text-red-400 uppercase mb-3 flex items-center gap-2">
            <span className="w-6 h-[1px] bg-red-400" />
            <span>SLIDE 03 • KESADARAN MASALAH</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#FFFFFF] leading-tight mb-5">
            Tapi Kebanyakan Rumah Masih Hanya Menjadi Konsumen.
          </h2>

          <div className="p-4 rounded-2xl bg-[#153A24]/80 border-l-4 border-red-400 mb-6">
            <div className="text-xs font-mono text-red-400 font-bold uppercase tracking-wider mb-1">
              PESAN UTAMA:
            </div>
            <p className="text-sm sm:text-base text-[#FFFFFF] font-medium leading-relaxed">
              Telur, beras, sayur dan protein hampir semuanya dibeli. Bangun kesadaran masalah.
            </p>
          </div>

          <p className="text-sm sm:text-base text-[#D1C8B8] font-light leading-relaxed mb-6">
            Ketergantungan penuh pada pasar membuat pengeluaran keluarga sangat rentan terhadap lonjakan harga pangan, kelangkaan pasokan, dan biaya distribusi yang panjang.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-[#0C1F14] border border-[#F7F1E4]/10">
              <div className="text-red-400 font-bold text-lg mb-1">Rantai Pasok Panjang</div>
              <p className="text-xs text-[#8D9C8F]">
                Telur melewati 4–6 perantara sebelum sampai di dapur, menaikkan harga dan menurunkan kesegaran.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#0C1F14] border border-[#F7F1E4]/10">
              <div className="text-red-400 font-bold text-lg mb-1">Ketergantungan Total</div>
              <p className="text-xs text-[#8D9C8F]">
                Begitu pasokan pasar tersendat, dapur rumah tangga langsung terhenti tanpa cadangan mandiri.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#0C1F14] border border-[#F7F1E4]/10">
              <div className="text-red-400 font-bold text-lg mb-1">Pengeluaran Mengalir Keluar</div>
              <p className="text-xs text-[#8D9C8F]">
                Uang belanja habis setiap bulan sebagai biaya konsumsi tanpa menghasilkan aset produktif.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-red-950/30 border border-red-850/40 text-xs text-red-200 flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0 text-red-400" />
            <span>Keluarga modern berada dalam posisi rentan jika seluruh kebutuhan pokok 100% bergantung pada rantai pasok luar.</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 04 — BAGAIMANA JIKA RUMAH JUGA BISA MENJADI PRODUSEN?               */}
      {/* ========================================================================= */}
      <section
        id="slide-04"
        data-slide-index="3"
        className="min-h-screen w-full flex flex-col justify-center py-28 px-6 sm:px-12 max-w-7xl mx-auto"
      >
        <div className="max-w-4xl bg-[#0C1F14]/90 p-8 sm:p-12 rounded-3xl border border-[#E9B949]/50 backdrop-blur-xl shadow-2xl ml-auto">
          <div className="text-xs font-mono tracking-[0.25em] text-[#E9B949] uppercase mb-3 flex items-center gap-2">
            <span className="w-6 h-[1px] bg-[#E9B949]" />
            <span>SLIDE 04 • TURNING POINT</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#FFFFFF] leading-tight mb-5">
            Bagaimana Jika Rumah Juga Bisa Menjadi Produsen?
          </h2>

          <div className="p-4 rounded-2xl bg-[#153A24]/90 border-l-4 border-[#E9B949] mb-6">
            <div className="text-xs font-mono text-[#E9B949] font-bold uppercase tracking-wider mb-1">
              PESAN UTAMA:
            </div>
            <p className="text-base sm:text-lg text-[#FFFFFF] font-medium leading-relaxed">
              Turning point. Ketahanan pangan bisa dimulai dari skala rumah tangga.
            </p>
          </div>

          <p className="text-sm sm:text-base text-[#D1C8B8] font-light leading-relaxed mb-6">
            Bayangkan pekarangan samping atau belakang rumah Anda yang selama ini hanya menjadi ruang pasif, bertransformasi menjadi lumbung pangan berprotein tinggi yang menghasilkan panen segar setiap pagi.
          </p>

          {/* Transformation comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-5 rounded-2xl bg-[#0C1F14] border border-[#F7F1E4]/10">
              <div className="text-xs font-mono text-[#8D9C8F] uppercase mb-2">PARADIGMA LAMA</div>
              <div className="text-lg font-bold text-red-400 mb-2">Konsumen Murni</div>
              <ul className="text-xs text-[#D1C8B8] space-y-1.5">
                <li>• Beli setiap hari ke pasar / toko</li>
                <li>• Menanggung kenaikan harga & inflasi</li>
                <li>• Telur disimpan lama sebelum dibeli</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-[#153A24] border border-[#E9B949]/40">
              <div className="text-xs font-mono text-[#E9B949] uppercase mb-2">PARADIGMA EGGNEST</div>
              <div className="text-lg font-bold text-[#E9B949] mb-2">Rumah Tangga Produsen</div>
              <ul className="text-xs text-[#FFFFFF] space-y-1.5">
                <li>• Panen sendiri setiap pagi dari pekarangan</li>
                <li>• Mengurangi biaya belanja bulanan</li>
                <li>• Telur fresh hangat langsung ke meja makan</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 05 — KENAPA AYAM PETELUR?                                           */}
      {/* ========================================================================= */}
      <section
        id="slide-05"
        data-slide-index="4"
        className="min-h-screen w-full flex flex-col justify-center py-28 px-6 sm:px-12 max-w-7xl mx-auto"
      >
        <div className="max-w-4xl bg-[#0C1F14]/90 p-8 sm:p-12 rounded-3xl border border-[#F7F1E4]/15 backdrop-blur-xl shadow-2xl">
          <div className="text-xs font-mono tracking-[0.25em] text-[#E9B949] uppercase mb-3 flex items-center gap-2">
            <span className="w-6 h-[1px] bg-[#E9B949]" />
            <span>SLIDE 05 • PILIHAN STRATEGIS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#FFFFFF] leading-tight mb-5">
            Kenapa Ayam Petelur?
          </h2>

          <div className="p-4 rounded-2xl bg-[#153A24]/90 border-l-4 border-[#E9B949] mb-6">
            <div className="text-xs font-mono text-[#E9B949] font-bold uppercase tracking-wider mb-1">
              PESAN UTAMA:
            </div>
            <p className="text-sm sm:text-base text-[#FFFFFF] font-medium leading-relaxed">
              Produksi harian, kebutuhan pasar terus ada, lahan relatif kecil, bisa dikonsumsi maupun dijual.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
              <div className="flex items-center gap-2 text-[#E9B949] font-bold text-sm mb-2">
                <Sparkles size={16} />
                <span>1. Panen Harian (Bukan Bulanan)</span>
              </div>
              <p className="text-xs text-[#D1C8B8] leading-relaxed">
                Ayam petelur memiliki siklus bertelur 24–26 jam. Tidak perlu menunggu berbulan-bulan untuk merasakan hasil panen seperti ternak potong atau ikan.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
              <div className="flex items-center gap-2 text-[#81B252] font-bold text-sm mb-2">
                <ShoppingBag size={16} />
                <span>2. Likuiditas Pasar Tinggi</span>
              </div>
              <p className="text-xs text-[#D1C8B8] leading-relaxed">
                Telur adalah komoditas yang selalu dicari setiap hari. Jika ada kelebihan panen, telur sangat mudah diserap tetangga sekitar.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
              <div className="flex items-center gap-2 text-[#E9B949] font-bold text-sm mb-2">
                <Layers size={16} />
                <span>3. Hemat Lahan (Desain Vertikal)</span>
              </div>
              <p className="text-xs text-[#D1C8B8] leading-relaxed">
                Cukup membutuhkan ruang 1.5 × 1.2 meter dengan sistem kandang baterai bertingkat galvanis Eggnest.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
              <div className="flex items-center gap-2 text-[#81B252] font-bold text-sm mb-2">
                <HeartHandshake size={16} />
                <span>4. Ganda Manfaat: Nutrisi & Cuan</span>
              </div>
              <p className="text-xs text-[#D1C8B8] leading-relaxed">
                Mencukupi gizi harian anak di rumah, sekaligus memberi potensi pemasukan tambahan dari penjualan surplus telur segar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 06 — CUKUP DIMULAI DARI 12 EKOR                                     */}
      {/* ========================================================================= */}
      <section
        id="slide-06"
        data-slide-index="5"
        className="min-h-screen w-full flex flex-col justify-center py-28 px-6 sm:px-12 max-w-7xl mx-auto"
      >
        <div className="max-w-4xl bg-[#0C1F14]/90 p-8 sm:p-12 rounded-3xl border border-[#E9B949]/40 backdrop-blur-xl shadow-2xl ml-auto">
          <div className="text-xs font-mono tracking-[0.25em] text-[#E9B949] uppercase mb-3 flex items-center gap-2">
            <span className="w-6 h-[1px] bg-[#E9B949]" />
            <span>SLIDE 06 • FORMULA DASAR</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#FFFFFF] leading-tight mb-5">
            Cukup Dimulai dari 12 Ekor.
          </h2>

          <div className="p-4 rounded-2xl bg-[#153A24]/90 border-l-4 border-[#E9B949] mb-8">
            <div className="text-xs font-mono text-[#E9B949] font-bold uppercase tracking-wider mb-1">
              PESAN UTAMA:
            </div>
            <p className="text-base sm:text-lg text-[#FFFFFF] font-medium leading-relaxed">
              Visual besar: 12 ekor → ±11 telur/hari → ±330 telur/bulan.
            </p>
          </div>

          {/* Big Visual Formula */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-6 rounded-2xl bg-[#153A24] border border-[#E9B949]/30 text-center">
              <div className="text-xs uppercase font-mono tracking-wider text-[#D1C8B8]">POPULASI KANDANG</div>
              <div className="text-4xl sm:text-5xl font-display font-bold text-[#E9B949] my-2">12</div>
              <div className="text-sm font-semibold text-[#FFFFFF]">Ekor Ayam Pullet</div>
              <div className="text-[11px] text-[#8D9C8F] mt-1">Umur ±16 Minggu Siap Telur</div>
            </div>

            <div className="p-6 rounded-2xl bg-[#153A24] border border-[#E9B949]/30 text-center">
              <div className="text-xs uppercase font-mono tracking-wider text-[#D1C8B8]">PANEN HARIAN</div>
              <div className="text-4xl sm:text-5xl font-display font-bold text-[#FFFFFF] my-2">±11</div>
              <div className="text-sm font-semibold text-[#E9B949]">Butir / Hari</div>
              <div className="text-[11px] text-[#8D9C8F] mt-1">Lay Rate 91.6% Rata-rata</div>
            </div>

            <div className="p-6 rounded-2xl bg-[#153A24] border border-[#E9B949]/50 text-center shadow-lg shadow-[#153A24]/50">
              <div className="text-xs uppercase font-mono tracking-wider text-[#D1C8B8]">PANEN BULANAN</div>
              <div className="text-4xl sm:text-5xl font-display font-bold text-[#81B252] my-2">±330</div>
              <div className="text-sm font-semibold text-[#FFFFFF]">Butir / Bulan</div>
              <div className="text-[11px] text-[#8D9C8F] mt-1">Setara ±20,6 kg Telur Segar</div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#D1C8B8] leading-relaxed">
            Formula 12 ekor didesain secara ilmiah untuk efisiensi ruang pekarangan rumah, kemudahan pengelolaan pakan harian (±1.4 kg pakan per hari), serta mencukupi kebutuhan konsumsi protein satu keluarga inti plus cadangan surplus.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 07 — BAYANGKAN JIKA GERAKAN INI DILAKUKAN BERSAMA                   */}
      {/* ========================================================================= */}
      <section
        id="slide-07"
        data-slide-index="6"
        className="min-h-screen w-full flex flex-col justify-center py-28 px-6 sm:px-12 max-w-7xl mx-auto"
      >
        <div className="max-w-4xl bg-[#0C1F14]/90 p-8 sm:p-12 rounded-3xl border border-[#E9B949]/40 backdrop-blur-xl shadow-2xl">
          <div className="text-xs font-mono tracking-[0.25em] text-[#E9B949] uppercase mb-3 flex items-center gap-2">
            <span className="w-6 h-[1px] bg-[#E9B949]" />
            <span>SLIDE 07 • MULTIPLIER EFFECT</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#FFFFFF] leading-tight mb-5">
            Bayangkan Jika Gerakan Ini Dilakukan Bersama.
          </h2>

          <div className="p-4 rounded-2xl bg-[#153A24]/90 border-l-4 border-[#E9B949] mb-8">
            <div className="text-xs font-mono text-[#E9B949] font-bold uppercase tracking-wider mb-1">
              PESAN UTAMA:
            </div>
            <p className="text-base sm:text-lg text-[#FFFFFF] font-medium leading-relaxed">
              1 rumah = 12 ayam. 100 rumah = 1.200 ayam. 1.000 rumah = 12.000 ayam.
            </p>
          </div>

          {/* Scaling Pyramid */}
          <div className="space-y-4 mb-8">
            <div className="p-4 rounded-2xl bg-[#153A24]/60 border border-[#F7F1E4]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#E9B949] text-[#153A24] font-bold flex items-center justify-center text-xs">
                  01
                </span>
                <div>
                  <div className="font-bold text-sm text-[#FFFFFF]">1 Rumah (Keluarga Mandiri)</div>
                  <div className="text-xs text-[#8D9C8F]">12 Ayam Petelur</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-[#E9B949]">±330 Telur / Bulan</span>
                <div className="text-[11px] text-[#8D9C8F]">Kecukupan Gizi Keluarga</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#153A24]/80 border border-[#E9B949]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#81B252] text-[#153A24] font-bold flex items-center justify-center text-xs">
                  02
                </span>
                <div>
                  <div className="font-bold text-sm text-[#FFFFFF]">100 Rumah (Klaster RW Tangguh)</div>
                  <div className="text-xs text-[#8D9C8F]">1.200 Ayam Petelur</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-[#81B252]">±33.000 Telur / Bulan</span>
                <div className="text-[11px] text-[#8D9C8F]">Suplai Mandiri Satu Lingkungan</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#153A24] border border-[#E9B949]/60 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#E9B949] text-[#153A24] font-bold flex items-center justify-center text-xs">
                  03
                </span>
                <div>
                  <div className="font-bold text-sm text-[#FFFFFF]">1.000 Rumah (Lumbung Protein Desa)</div>
                  <div className="text-xs text-[#8D9C8F]">12.000 Ayam Petelur</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-[#E9B949]">±330.000 Telur / Bulan</span>
                <div className="text-[11px] text-[#8D9C8F]">Kedaulatan Pangan Wilayah</div>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#D1C8B8]">
            Desentralisasi produksi telur menghilangkan ketergantungan pada rantai dingin industri dan mendistribusikan ketahanan ekonomi langsung ke tangan masyarakat.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 08 — INILAH EGGNEST HOME FARM                                       */}
      {/* ========================================================================= */}
      <section
        id="slide-08"
        data-slide-index="7"
        className="min-h-screen w-full flex flex-col justify-center py-28 px-6 sm:px-12 max-w-7xl mx-auto"
      >
        <div className="max-w-4xl bg-[#0C1F14]/90 p-8 sm:p-12 rounded-3xl border border-[#E9B949]/40 backdrop-blur-xl shadow-2xl ml-auto">
          <div className="text-xs font-mono tracking-[0.25em] text-[#E9B949] uppercase mb-3 flex items-center gap-2">
            <span className="w-6 h-[1px] bg-[#E9B949]" />
            <span>SLIDE 08 • NILAI INTI</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#FFFFFF] leading-tight mb-5">
            Inilah Eggnest Home Farm.
          </h2>

          <div className="p-4 rounded-2xl bg-[#153A24]/90 border-l-4 border-[#E9B949] mb-8">
            <div className="text-xs font-mono text-[#E9B949] font-bold uppercase tracking-wider mb-1">
              PESAN UTAMA:
            </div>
            <p className="text-base sm:text-lg text-[#FFFFFF] font-medium leading-relaxed">
              Eggnest bukan sekadar menjual ayam dan kandang. Eggnest membangun ekosistem peternakan rumah tangga.
            </p>
          </div>

          <p className="text-sm sm:text-base text-[#D1C8B8] font-light leading-relaxed mb-6">
            Banyak orang ragu beternak di rumah karena takut bau, ayam mati, atau tidak tahu cara perawatannya. Eggnest hadir menyelesaikan seluruh persoalan tersebut melalui standardisasi menyeluruh.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
              <div className="text-[#E9B949] font-semibold text-sm mb-1">SOP Ramah Pemula</div>
              <p className="text-xs text-[#8D9C8F]">
                Didesain khusus agar anggota keluarga mana pun—ayah, ibu, hingga anak—dapat merawatnya dalam 10 menit per hari.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
              <div className="text-[#81B252] font-semibold text-sm mb-1">Formula Tanpa Bau</div>
              <p className="text-xs text-[#8D9C8F]">
                Kombinasi probiotik fermentasi organik yang menguraikan amonia kotoran, menjaga lingkungan permukiman tetap nyaman.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 09 — 1 RUMAH • 1 KANDANG • 1 FARM ID                                */}
      {/* ========================================================================= */}
      <section
        id="slide-09"
        data-slide-index="8"
        className="min-h-screen w-full flex flex-col justify-center py-28 px-6 sm:px-12 max-w-7xl mx-auto"
      >
        <div className="max-w-4xl bg-[#0C1F14]/90 p-8 sm:p-12 rounded-3xl border border-[#F7F1E4]/15 backdrop-blur-xl shadow-2xl">
          <div className="text-xs font-mono tracking-[0.25em] text-[#E9B949] uppercase mb-3 flex items-center gap-2">
            <span className="w-6 h-[1px] bg-[#E9B949]" />
            <span>SLIDE 09 • IDENTITAS DIGITAL</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#FFFFFF] leading-tight mb-5">
            1 Rumah • 1 Kandang • 1 Farm ID.
          </h2>

          <div className="p-4 rounded-2xl bg-[#153A24]/90 border-l-4 border-[#E9B949] mb-8">
            <div className="text-xs font-mono text-[#E9B949] font-bold uppercase tracking-wider mb-1">
              PESAN UTAMA:
            </div>
            <p className="text-base sm:text-lg text-[#FFFFFF] font-medium leading-relaxed">
              Setiap kandang menjadi bagian dari jaringan Eggnest dan tercatat dalam Farm Hub.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-4 text-xs sm:text-sm text-[#D1C8B8] font-light">
              <p>
                Setiap unit kandang Eggnest dilengkapi pelat identitas logam dengan nomor registrasi resmi dan QR Code unik.
              </p>
              <p>
                Farm ID ini menghubungkan kandang Anda langsung ke server Eggnest Cloud: memudahkan pemesanan ulang pakan presisi, klaim garansi, rekam riwayat vaksinasi, hingga konsultasi instan.
              </p>
              <div className="flex items-center gap-2 text-[#E9B949] font-mono text-xs pt-2">
                <CheckCircle2 size={16} className="text-[#81B252]" />
                <span>Terdaftar resmi dalam Database Ketahanan Pangan Nusantara</span>
              </div>
            </div>

            {/* Farm ID Badge Preview */}
            <div className="md:col-span-5 flex justify-center">
              <div className="w-64 p-5 rounded-2xl bg-[#153A24] border-2 border-[#E9B949] shadow-2xl text-center">
                <EggnestLogo size={28} showText={false} />
                <div className="text-[10px] font-mono text-[#D1C8B8] mt-2">OFFICIAL REGISTERED UNIT</div>
                <div className="text-xl font-mono font-bold text-[#E9B949] tracking-widest my-1">
                  EGG-2026-0842
                </div>
                <div className="text-[10px] text-[#8D9C8F]">ISA Brown • 12 Birds Unit</div>
                <div className="mt-3 pt-3 border-t border-[#F7F1E4]/15 flex items-center justify-between text-[10px] text-[#D1C8B8]">
                  <span>Status: AKTIF</span>
                  <span className="text-[#81B252] font-semibold">● TERHUBUNG</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 10 — KENAPA HARUS EGGNEST FARM HUB?                                 */}
      {/* ========================================================================= */}
      <section
        id="slide-10"
        data-slide-index="9"
        className="min-h-screen w-full flex flex-col justify-center py-28 px-6 sm:px-12 max-w-7xl mx-auto"
      >
        <div className="max-w-4xl bg-[#0C1F14]/90 p-8 sm:p-12 rounded-3xl border border-[#E9B949]/40 backdrop-blur-xl shadow-2xl ml-auto">
          <div className="text-xs font-mono tracking-[0.25em] text-[#E9B949] uppercase mb-3 flex items-center gap-2">
            <span className="w-6 h-[1px] bg-[#E9B949]" />
            <span>SLIDE 10 • TEKNOLOGI FARM HUB</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#FFFFFF] leading-tight mb-5">
            Kenapa Harus Eggnest Farm Hub?
          </h2>

          <div className="p-4 rounded-2xl bg-[#153A24]/90 border-l-4 border-[#E9B949] mb-8">
            <div className="text-xs font-mono text-[#E9B949] font-bold uppercase tracking-wider mb-1">
              PESAN UTAMA:
            </div>
            <p className="text-base sm:text-lg text-[#FFFFFF] font-medium leading-relaxed">
              Monitoring produksi, edukasi, pendampingan, laporan kandang, bantuan masalah dan database produktivitas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
              <div className="font-bold text-sm text-[#FFFFFF] flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-[#E9B949]" />
                <span>1. Monitoring Produksi Harian</span>
              </div>
              <p className="text-xs text-[#8D9C8F]">
                Input butir telur harian dengan mudah, pantau grafik lay-rate mingguan dan bulanan.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
              <div className="font-bold text-sm text-[#FFFFFF] flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-[#81B252]" />
                <span>2. Edukasi Praktis & SOP</span>
              </div>
              <p className="text-xs text-[#8D9C8F]">
                Video panduan ringkas cara sanitasi, takaran pakan tepat, dan jadwal vitamin.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
              <div className="font-bold text-sm text-[#FFFFFF] flex items-center gap-2 mb-1">
                <ShieldCheck size={16} className="text-[#E9B949]" />
                <span>3. Bantuan Masalah & SOS Ahli</span>
              </div>
              <p className="text-xs text-[#8D9C8F]">
                Deteksi anomali jika ayam menurun produksinya dan konsultasi langsung dengan dokter hewan.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
              <div className="font-bold text-sm text-[#FFFFFF] flex items-center gap-2 mb-1">
                <Smartphone size={16} className="text-[#81B252]" />
                <span>4. Database & Efisiensi Pakan</span>
              </div>
              <p className="text-xs text-[#8D9C8F]">
                Kalkulasi otomatis biaya pakan per butir telur sehingga efisiensi usaha selalu terukur.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 11 — ANDA TIDAK BERJALAN SENDIRI                                    */}
      {/* ========================================================================= */}
      <section
        id="slide-11"
        data-slide-index="10"
        className="min-h-screen w-full flex flex-col justify-center py-28 px-6 sm:px-12 max-w-7xl mx-auto"
      >
        <div className="max-w-4xl bg-[#0C1F14]/90 p-8 sm:p-12 rounded-3xl border border-[#F7F1E4]/15 backdrop-blur-xl shadow-2xl">
          <div className="text-xs font-mono tracking-[0.25em] text-[#E9B949] uppercase mb-3 flex items-center gap-2">
            <span className="w-6 h-[1px] bg-[#E9B949]" />
            <span>SLIDE 11 • DUKUNGAN BERKELANJUTAN</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#FFFFFF] leading-tight mb-5">
            Anda Tidak Berjalan Sendiri.
          </h2>

          <div className="p-4 rounded-2xl bg-[#153A24]/90 border-l-4 border-[#E9B949] mb-8">
            <div className="text-xs font-mono text-[#E9B949] font-bold uppercase tracking-wider mb-1">
              PESAN UTAMA:
            </div>
            <p className="text-base sm:text-lg text-[#FFFFFF] font-medium leading-relaxed">
              Ada pendampingan, edukasi dokter hewan, kunjungan berkala, pakan, vitamin dan support.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-5 rounded-2xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
              <div className="text-[#E9B949] font-bold text-sm mb-2">Dokter Hewan Pendamping</div>
              <p className="text-xs text-[#D1C8B8] leading-relaxed">
                Akses konsultasi medis hewan peliharaan secara berkala untuk pencegahan dan diagnosa penyakit tropis.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
              <div className="text-[#81B252] font-bold text-sm mb-2">Kunjungan & Monev Berkala</div>
              <p className="text-xs text-[#D1C8B8] leading-relaxed">
                Tim teknisi Eggnest melakukan supervisi performa kandang dan mutu pakan secara langsung.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
              <div className="text-[#E9B949] font-bold text-sm mb-2">Suplai Pakan & Vitamin</div>
              <p className="text-xs text-[#D1C8B8] leading-relaxed">
                Pengiriman rutin pakan terstandar tepat waktu langsung ke pintu rumah Anda tanpa harus mencari sendiri.
              </p>
            </div>
          </div>

          <p className="text-xs text-[#8D9C8F] italic">
            *Komitmen Eggnest adalah memastikan setiap mitra pemula merasa aman, percaya diri, dan berhasil menikmati panen berkelanjutan.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 12 — APA YANG ANDA DAPATKAN?                                        */}
      {/* ========================================================================= */}
      <section
        id="slide-12"
        data-slide-index="11"
        className="min-h-screen w-full flex flex-col justify-center py-28 px-6 sm:px-12 max-w-7xl mx-auto"
      >
        <div className="max-w-4xl bg-[#0C1F14]/90 p-8 sm:p-12 rounded-3xl border border-[#E9B949]/40 backdrop-blur-xl shadow-2xl ml-auto">
          <div className="text-xs font-mono tracking-[0.25em] text-[#E9B949] uppercase mb-3 flex items-center gap-2">
            <span className="w-6 h-[1px] bg-[#E9B949]" />
            <span>SLIDE 12 • PAKET LENGKAP EGGNEST</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#FFFFFF] leading-tight mb-5">
            Apa yang Anda Dapatkan?
          </h2>

          <div className="p-4 rounded-2xl bg-[#153A24]/90 border-l-4 border-[#E9B949] mb-8">
            <div className="text-xs font-mono text-[#E9B949] font-bold uppercase tracking-wider mb-1">
              PESAN UTAMA:
            </div>
            <p className="text-base sm:text-lg text-[#FFFFFF] font-medium leading-relaxed">
              Kandang premium + 12 ayam ±16 minggu + pakan awal + vitamin + garansi + edukasi + pendampingan + Farm Hub/Farm ID.
            </p>
          </div>

          {/* 8-Item Comprehensive Package Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
            <div className="p-3.5 rounded-xl bg-[#153A24]/80 border border-[#F7F1E4]/10 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-[#81B252] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-[#FFFFFF]">Kandang Galvanis 2 Tingkat Premium</div>
                <div className="text-[11px] text-[#8D9C8F]">Kawat antikarat, roll-out telur bersih otomatis</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#153A24]/80 border border-[#F7F1E4]/10 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-[#81B252] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-[#FFFFFF]">12 Ekor Ayam Pullet Siap Telur</div>
                <div className="text-[11px] text-[#8D9C8F]">Umur ±16 minggu, vaksin lengkap & bersertifikasi</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#153A24]/80 border border-[#F7F1E4]/10 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-[#81B252] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-[#FFFFFF]">Paket Pakan Awal & Probiotik Alami</div>
                <div className="text-[11px] text-[#8D9C8F]">Formula nutrisi presisi pengurai aroma kotoran</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#153A24]/80 border border-[#F7F1E4]/10 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-[#81B252] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-[#FFFFFF]">Sistem Minum Otomatis (Nipple Drinker)</div>
                <div className="text-[11px] text-[#8D9C8F]">Tandon air bersih, higienis & bebas lumut</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#153A24]/80 border border-[#F7F1E4]/10 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-[#81B252] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-[#FFFFFF]">Garansi Adaptasi Awal</div>
                <div className="text-[11px] text-[#8D9C8F]">Penggantian bibit ayam jika sakit di masa transisi</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#153A24]/80 border border-[#F7F1E4]/10 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-[#81B252] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-[#FFFFFF]">Pelat Resmi Eggnest Farm ID</div>
                <div className="text-[11px] text-[#8D9C8F]">Registrasi digital dengan barcode QR unik</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#153A24]/80 border border-[#F7F1E4]/10 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-[#81B252] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-[#FFFFFF]">Akses Aplikasi Eggnest Farm Hub</div>
                <div className="text-[11px] text-[#8D9C8F]">Monitoring produksi harian dari ponsel</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#153A24]/80 border border-[#F7F1E4]/10 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-[#81B252] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-[#FFFFFF]">Bimbingan & Pendampingan Penuh</div>
                <div className="text-[11px] text-[#8D9C8F]">Konsultasi berkelanjutan bersama tim ahli</div>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenModal}
            className="w-full py-4 rounded-2xl bg-[#E9B949] hover:bg-[#F3C75C] text-[#153A24] font-bold text-xs uppercase tracking-widest text-center shadow-lg transition-all"
          >
            Pesan Paket Lengkap 12 Ayam Sekarang
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 13 — BERAPA YANG BISA DIHASILKAN?                                   */}
      {/* ========================================================================= */}
      <section
        id="slide-13"
        data-slide-index="12"
        className="min-h-screen w-full flex flex-col justify-center py-28 px-6 sm:px-12 max-w-7xl mx-auto"
      >
        <div className="max-w-4xl bg-[#0C1F14]/90 p-8 sm:p-12 rounded-3xl border border-[#E9B949]/40 backdrop-blur-xl shadow-2xl">
          <div className="text-xs font-mono tracking-[0.25em] text-[#E9B949] uppercase mb-3 flex items-center gap-2">
            <span className="w-6 h-[1px] bg-[#E9B949]" />
            <span>SLIDE 13 • ANALISIS POTENSI HASIL</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#FFFFFF] leading-tight mb-5">
            Berapa yang Bisa Dihasilkan?
          </h2>

          <div className="p-4 rounded-2xl bg-[#153A24]/90 border-l-4 border-[#E9B949] mb-8">
            <div className="text-xs font-mono text-[#E9B949] font-bold uppercase tracking-wider mb-1">
              PESAN UTAMA:
            </div>
            <p className="text-base sm:text-lg text-[#FFFFFF] font-medium leading-relaxed">
              ±11 telur/hari → ±330/bulan → ±20,6 kg/bulan → nilai kotor ±Rp495 ribu/bulan pada asumsi Rp24 ribu/kg.
            </p>
          </div>

          {/* Interactive Calculator Box */}
          <div className="p-6 rounded-2xl bg-[#153A24] border border-[#E9B949]/30 mb-6">
            <div className="flex items-center gap-2 text-xs font-mono text-[#E9B949] uppercase tracking-wider mb-4">
              <Calculator size={15} />
              <span>SIMULASI KALKULATOR POTENSI HASIL</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs text-[#D1C8B8] mb-1">Jumlah Rumah / Kandang</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={calcHouseCount}
                    onChange={(e) => setCalcHouseCount(Number(e.target.value))}
                    className="w-full accent-[#E9B949]"
                  />
                  <span className="text-sm font-bold text-[#E9B949] w-16 text-right">
                    {calcHouseCount} Unit
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#D1C8B8] mb-1">Asumsi Harga Telur Curah per Kg</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={20000}
                    max={35000}
                    step={1000}
                    value={calcEggPriceKg}
                    onChange={(e) => setCalcEggPriceKg(Number(e.target.value))}
                    className="w-full accent-[#E9B949]"
                  />
                  <span className="text-sm font-bold text-[#FFFFFF] w-24 text-right">
                    Rp {calcEggPriceKg.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#F7F1E4]/10 text-center">
              <div className="p-3 rounded-xl bg-[#0C1F14]">
                <div className="text-[10px] text-[#8D9C8F]">TOTAL AYAM</div>
                <div className="text-xl font-bold text-[#FFFFFF]">{calcHouseCount * 12} Ekor</div>
              </div>
              <div className="p-3 rounded-xl bg-[#0C1F14]">
                <div className="text-[10px] text-[#8D9C8F]">PANEN BULANAN</div>
                <div className="text-xl font-bold text-[#E9B949]">{monthlyEggs} Butir</div>
              </div>
              <div className="p-3 rounded-xl bg-[#0C1F14]">
                <div className="text-[10px] text-[#8D9C8F]">ESTIMASI BERAT</div>
                <div className="text-xl font-bold text-[#FFFFFF]">±{monthlyKg} kg</div>
              </div>
              <div className="p-3 rounded-xl bg-[#0C1F14]">
                <div className="text-[10px] text-[#8D9C8F]">NILAI KOTOR PANEN</div>
                <div className="text-xl font-bold text-[#81B252]">
                  Rp {monthlyGrossValue.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#8D9C8F] leading-relaxed">
            *Catatan: Nilai kotor di atas dihitung dengan asumsi telur curah biasa (Rp24.000/kg). Jika dipasarkan sebagai telur segar berprobiotik bebas residu antibiotik langsung ke tetangga/komunitas, nilainya dapat mencapai Rp30.000–Rp35.000/kg (±Rp600.000 - Rp750.000/bulan).
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 14 — TELUR BUKAN HANYA UNTUK DIJUAL                                 */}
      {/* ========================================================================= */}
      <section
        id="slide-14"
        data-slide-index="13"
        className="min-h-screen w-full flex flex-col justify-center py-28 px-6 sm:px-12 max-w-7xl mx-auto"
      >
        <div className="max-w-4xl bg-[#0C1F14]/90 p-8 sm:p-12 rounded-3xl border border-[#F7F1E4]/15 backdrop-blur-xl shadow-2xl ml-auto">
          <div className="text-xs font-mono tracking-[0.25em] text-[#E9B949] uppercase mb-3 flex items-center gap-2">
            <span className="w-6 h-[1px] bg-[#E9B949]" />
            <span>SLIDE 14 • POLA PEMANFAATAN</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#FFFFFF] leading-tight mb-5">
            Telur Bukan Hanya untuk Dijual.
          </h2>

          <div className="p-4 rounded-2xl bg-[#153A24]/90 border-l-4 border-[#E9B949] mb-8">
            <div className="text-xs font-mono text-[#E9B949] font-bold uppercase tracking-wider mb-1">
              PESAN UTAMA:
            </div>
            <p className="text-base sm:text-lg text-[#FFFFFF] font-medium leading-relaxed">
              Konsumsi keluarga → mengurangi belanja. Surplus → bisa dijual. Produksi bersama → membentuk suplai lokal.
            </p>
          </div>

          {/* 3 Tier Stages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-5 rounded-2xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
              <div className="w-8 h-8 rounded-full bg-[#E9B949] text-[#153A24] font-bold flex items-center justify-center text-xs mb-3">
                1
              </div>
              <h3 className="text-base font-bold text-[#FFFFFF] mb-1">Konsumsi Keluarga</h3>
              <p className="text-xs text-[#D1C8B8] leading-relaxed">
                Prioritas pertama adalah gizi keluarga: anak-anak makan telur segar bergizi tinggi setiap pagi, memotong langsung anggaran belanja dapur harian.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#153A24]/60 border border-[#E9B949]/30">
              <div className="w-8 h-8 rounded-full bg-[#81B252] text-[#153A24] font-bold flex items-center justify-center text-xs mb-3">
                2
              </div>
              <h3 className="text-base font-bold text-[#FFFFFF] mb-1">Penjualan Surplus</h3>
              <p className="text-xs text-[#D1C8B8] leading-relaxed">
                Kelebihan 4–6 butir per hari dikemas dalam wadah telur Eggnest dan dijual ke tetangga atau teman kantor sebagai telur segar organik bernilai tinggi.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
              <div className="w-8 h-8 rounded-full bg-[#E9B949] text-[#153A24] font-bold flex items-center justify-center text-xs mb-3">
                3
              </div>
              <h3 className="text-base font-bold text-[#FFFFFF] mb-1">Suplai Pasar Lokal</h3>
              <p className="text-xs text-[#D1C8B8] leading-relaxed">
                Ketika beberapa rumah dalam satu RT/RW bergabung, kumpulan telur dapat menyuplai warung sembako, kafe, atau katering lokal secara stabil.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 15 — PELUANG DUKUNGAN PEMERINTAH & CSR                              */}
      {/* ========================================================================= */}
      <section
        id="slide-15"
        data-slide-index="14"
        className="min-h-screen w-full flex flex-col justify-center py-28 px-6 sm:px-12 max-w-7xl mx-auto"
      >
        <div className="max-w-4xl bg-[#0C1F14]/90 p-8 sm:p-12 rounded-3xl border border-[#81B252]/40 backdrop-blur-xl shadow-2xl">
          <div className="text-xs font-mono tracking-[0.25em] text-[#81B252] uppercase mb-3 flex items-center gap-2">
            <span className="w-6 h-[1px] bg-[#81B252]" />
            <span>SLIDE 15 • SINERGI KEMITRAAN</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#FFFFFF] leading-tight mb-5">
            Peluang Dukungan Pemerintah & CSR.
          </h2>

          <div className="p-4 rounded-2xl bg-[#153A24]/90 border-l-4 border-[#81B252] mb-8">
            <div className="text-xs font-mono text-[#81B252] font-bold uppercase tracking-wider mb-1">
              PESAN UTAMA:
            </div>
            <p className="text-base sm:text-lg text-[#FFFFFF] font-medium leading-relaxed">
              Hubungkan dengan ketahanan pangan, pemberdayaan masyarakat, ekonomi produktif dan CSR. Hindari janji pasti memperoleh bantuan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
              <div className="flex items-center gap-2 text-[#E9B949] font-bold text-sm mb-2">
                <Landmark size={18} />
                <span>Dana Desa & Ketahanan Pangan</span>
              </div>
              <p className="text-xs text-[#D1C8B8] leading-relaxed">
                Sangat selaras dengan regulasi prioritas 20% alokasi Dana Desa untuk program ketahanan pangan hewani berbasis keluarga dan padat karya.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
              <div className="flex items-center gap-2 text-[#81B252] font-bold text-sm mb-2">
                <Building size={18} />
                <span>Program CSR / ESG Perusahaan</span>
              </div>
              <p className="text-xs text-[#D1C8B8] leading-relaxed">
                Menjadi instrumen nyata bagi program Tanggung Jawab Sosial dan Lingkungan (TJSL) perusahaan dalam pencegahan stunting di sekitar wilayah operasi.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
              <div className="flex items-center gap-2 text-[#E9B949] font-bold text-sm mb-2">
                <Users size={18} />
                <span>Pemberdayaan PKK & KWT</span>
              </div>
              <p className="text-xs text-[#D1C8B8] leading-relaxed">
                Menggerakkan kelompok wanita tani dan ibu-ibu PKK melalui unit usaha mandiri pekarangan produktif.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#153A24]/60 border border-[#F7F1E4]/10">
              <div className="flex items-center gap-2 text-[#81B252] font-bold text-sm mb-2">
                <ShieldCheck size={18} />
                <span>Pelaporan Transparan via Farm Hub</span>
              </div>
              <p className="text-xs text-[#D1C8B8] leading-relaxed">
                Data produksi terekam secara digital memudahkan institusi mengevaluasi keberhasilan program bantuan secara terukur.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0C1F14] border border-[#F7F1E4]/15 text-xs text-[#8D9C8F]">
            <strong>Disclaimer Sinergi:</strong> Eggnest memfasilitasi proposal teknis dan sistem terstandar untuk diajukan ke instansi terkait. Proses persetujuan sepenuhnya bergantung pada kebijakan dan seleksi resmi masing-masing pengelola dana.
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 16 — KENAPA TIDAK TERNAK SENDIRI SAJA?                               */}
      {/* ========================================================================= */}
      <section
        id="slide-16"
        data-slide-index="15"
        className="min-h-screen w-full flex flex-col justify-center py-28 px-6 sm:px-12 max-w-7xl mx-auto"
      >
        <div className="max-w-4xl bg-[#0C1F14]/90 p-8 sm:p-12 rounded-3xl border border-[#E9B949]/40 backdrop-blur-xl shadow-2xl ml-auto">
          <div className="text-xs font-mono tracking-[0.25em] text-[#E9B949] uppercase mb-3 flex items-center gap-2">
            <span className="w-6 h-[1px] bg-[#E9B949]" />
            <span>SLIDE 16 • KOMPARASI SISTEM</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#FFFFFF] leading-tight mb-5">
            Kenapa Tidak Ternak Sendiri Saja?
          </h2>

          <div className="p-4 rounded-2xl bg-[#153A24]/90 border-l-4 border-[#E9B949] mb-8">
            <div className="text-xs font-mono text-[#E9B949] font-bold uppercase tracking-wider mb-1">
              PESAN UTAMA:
            </div>
            <p className="text-base sm:text-lg text-[#FFFFFF] font-medium leading-relaxed">
              Perbandingan “sendiri” vs “bersama Eggnest”. Pembeda Eggnest adalah sistem, standardisasi, pendampingan, data dan ekosistem.
            </p>
          </div>

          {/* Side by side detailed matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-6 rounded-2xl bg-[#0C1F14] border border-red-500/30">
              <div className="flex items-center gap-2 text-sm font-bold text-red-400 mb-4 uppercase tracking-wider">
                <AlertCircle size={18} />
                <span>Ternak Sendiri Tanpa Sistem</span>
              </div>
              <ul className="space-y-3 text-xs text-[#D1C8B8]">
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 font-bold shrink-0">✕</span>
                  <span>Beli bibit sembarangan tanpa riwayat vaksin jelas</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 font-bold shrink-0">✕</span>
                  <span>Kandang rakitan rentan bau, kotor, dan cepat berkarat</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 font-bold shrink-0">✕</span>
                  <span>Kematian ayam tinggi karena minim pengetahuan teknis</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 font-bold shrink-0">✕</span>
                  <span>Bingung cari formula pakan yang pas dan stabil</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 font-bold shrink-0">✕</span>
                  <span>Tidak ada dokter hewan pendamping saat ayam sakit</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 font-bold shrink-0">✕</span>
                  <span>Tanpa pencatatan data dan evaluasi performa</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-[#153A24] border border-[#E9B949]/50 shadow-xl shadow-[#153A24]/60">
              <div className="flex items-center gap-2 text-sm font-bold text-[#E9B949] mb-4 uppercase tracking-wider">
                <Sparkles size={18} />
                <span>Bersama Ekosistem Eggnest</span>
              </div>
              <ul className="space-y-3 text-xs text-[#FFFFFF]">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#81B252] font-bold shrink-0">✓</span>
                  <span>Bibit pullet terseleksi ±16 minggu bersertifikasi vaksin lengkap</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#81B252] font-bold shrink-0">✓</span>
                  <span>Kandang galvanis anti-karat nirbau dengan roll-out otomatis</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#81B252] font-bold shrink-0">✓</span>
                  <span>Garansi awal adaptasi dan panduan SOP ramah pemula</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#81B252] font-bold shrink-0">✓</span>
                  <span>Pakan formula khusus berprotein tinggi dikirim berkala</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#81B252] font-bold shrink-0">✓</span>
                  <span>Akses konsultasi langsung dengan dokter hewan & tim ahli</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#81B252] font-bold shrink-0">✓</span>
                  <span>Aplikasi Eggnest Farm Hub untuk monitoring panen harian</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 17 — CARA BERGABUNG                                                 */}
      {/* ========================================================================= */}
      <section
        id="slide-17"
        data-slide-index="16"
        className="min-h-screen w-full flex flex-col justify-center py-28 px-6 sm:px-12 max-w-7xl mx-auto"
      >
        <div className="max-w-4xl bg-[#0C1F14]/90 p-8 sm:p-12 rounded-3xl border border-[#E9B949]/40 backdrop-blur-xl shadow-2xl">
          <div className="text-xs font-mono tracking-[0.25em] text-[#E9B949] uppercase mb-3 flex items-center gap-2">
            <span className="w-6 h-[1px] bg-[#E9B949]" />
            <span>SLIDE 17 • TAHAPAN BERGABUNG</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#FFFFFF] leading-tight mb-5">
            Cara Bergabung.
          </h2>

          <div className="p-4 rounded-2xl bg-[#153A24]/90 border-l-4 border-[#E9B949] mb-8">
            <div className="text-xs font-mono text-[#E9B949] font-bold uppercase tracking-wider mb-1">
              PESAN UTAMA:
            </div>
            <p className="text-base sm:text-lg text-[#FFFFFF] font-medium leading-relaxed">
              Daftar → verifikasi → aktivasi Farm ID → kandang & ayam → pendampingan → produksi → laporan Farm Hub.
            </p>
          </div>

          {/* 7 Workflow Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 mb-8">
            <div className="p-4 rounded-2xl bg-[#153A24]/80 border border-[#F7F1E4]/10">
              <div className="w-7 h-7 rounded-full bg-[#E9B949] text-[#153A24] font-bold text-xs flex items-center justify-center mb-2">
                01
              </div>
              <div className="font-bold text-sm text-[#FFFFFF] mb-1">Pendaftaran</div>
              <p className="text-xs text-[#8D9C8F]">Isi formulir online atau WhatsApp resmi kami (0851-2936-2461).</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#153A24]/80 border border-[#F7F1E4]/10">
              <div className="w-7 h-7 rounded-full bg-[#E9B949] text-[#153A24] font-bold text-xs flex items-center justify-center mb-2">
                02
              </div>
              <div className="font-bold text-sm text-[#FFFFFF] mb-1">Verifikasi Lokasi</div>
              <p className="text-xs text-[#8D9C8F]">Konsultasi kesiapan pekarangan (1.5 × 1.2 m).</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#153A24]/80 border border-[#F7F1E4]/10">
              <div className="w-7 h-7 rounded-full bg-[#E9B949] text-[#153A24] font-bold text-xs flex items-center justify-center mb-2">
                03
              </div>
              <div className="font-bold text-sm text-[#FFFFFF] mb-1">Aktivasi Farm ID</div>
              <p className="text-xs text-[#8D9C8F]">Penerbitan nomor identitas resmi dan akun app.</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#153A24]/80 border border-[#F7F1E4]/10">
              <div className="w-7 h-7 rounded-full bg-[#E9B949] text-[#153A24] font-bold text-xs flex items-center justify-center mb-2">
                04
              </div>
              <div className="font-bold text-sm text-[#FFFFFF] mb-1">Instalasi Kandang</div>
              <p className="text-xs text-[#8D9C8F]">Kandang & 12 ayam pullet tiba di lokasi Anda.</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#153A24]/80 border border-[#F7F1E4]/10">
              <div className="w-7 h-7 rounded-full bg-[#81B252] text-[#153A24] font-bold text-xs flex items-center justify-center mb-2">
                05
              </div>
              <div className="font-bold text-sm text-[#FFFFFF] mb-1">Bimbingan Awal</div>
              <p className="text-xs text-[#8D9C8F]">Masa adaptasi & pemberian pakan pertama.</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#153A24]/80 border border-[#81B252]/40">
              <div className="w-7 h-7 rounded-full bg-[#81B252] text-[#153A24] font-bold text-xs flex items-center justify-center mb-2">
                06
              </div>
              <div className="font-bold text-sm text-[#FFFFFF] mb-1">Panen Produksi</div>
              <p className="text-xs text-[#8D9C8F]">Ayam mulai bertelur setiap hari tanpa jeda.</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#153A24]/80 border border-[#E9B949]/50 sm:col-span-2">
              <div className="w-7 h-7 rounded-full bg-[#E9B949] text-[#153A24] font-bold text-xs flex items-center justify-center mb-2">
                07
              </div>
              <div className="font-bold text-sm text-[#FFFFFF] mb-1">Laporan & Pantauan Farm Hub</div>
              <p className="text-xs text-[#8D9C8F]">Input panen di aplikasi untuk pantauan kesehatan & evaluasi rutin.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              onClick={onOpenModal}
              className="w-full sm:flex-1 py-4 rounded-2xl bg-[#E9B949] hover:bg-[#F3C75C] text-[#153A24] font-bold text-xs uppercase tracking-widest text-center shadow-xl transition-all hover:scale-[1.01]"
            >
              Mulai Langkah 01: Daftar Sekarang
            </button>
            <a
              href="https://wa.me/6285129362461?text=Halo%20Eggnest%20Home%20Farm,%20saya%20tertarik%20mendaftar%20program%201%20Rumah%201%20Kandang"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-[#81B252] bg-[#153A24] text-[#81B252] hover:bg-[#81B252] hover:text-[#0C1F14] font-bold text-xs uppercase tracking-widest text-center transition-all"
            >
              WhatsApp: 0851-2936-2461
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 18 — CLOSING IMPACT — DARI 12 EKOR, KITA MULAI PERUBAHAN            */}
      {/* ========================================================================= */}
      <section
        id="slide-18"
        data-slide-index="17"
        className="min-h-screen w-full flex flex-col justify-center py-28 px-6 sm:px-12 max-w-7xl mx-auto"
      >
        <div className="max-w-4xl bg-[#0C1F14]/90 p-8 sm:p-14 rounded-3xl border border-[#E9B949]/50 backdrop-blur-xl shadow-2xl text-center mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E9B949]/35 bg-[#153A24] text-[#E9B949] text-xs font-mono tracking-widest uppercase mb-4">
            <span>SLIDE 18 • VISI BESAR</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-medium text-[#FFFFFF] leading-tight mb-4">
            Dari 12 Ekor,
            <br />
            Kita Mulai <span className="text-[#E9B949] font-normal italic">Perubahan.</span>
          </h2>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#153A24]/90 border border-[#E9B949]/30 mb-8 max-w-2xl mx-auto">
            <div className="text-xs font-mono text-[#E9B949] font-bold uppercase tracking-wider mb-1">
              PESAN UTAMA:
            </div>
            <p className="text-base sm:text-lg text-[#FFFFFF] font-medium leading-relaxed">
              Tutup dengan visi besar, bukan jualan paket.
            </p>
          </div>

          <p className="text-sm sm:text-base text-[#D1C8B8] max-w-2xl mx-auto font-light leading-relaxed mb-8">
            Kedaulatan pangan bangsa tidak dibangun dari slogan, melainkan dari piring makan di setiap rumah. 12 ekor ayam di halaman Anda adalah bibit kemandirian dan masa depan gizi anak-anak kita.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onOpenModal}
              className="px-9 py-4 rounded-full bg-[#E9B949] hover:bg-[#F3C75C] text-[#153A24] text-sm uppercase tracking-widest font-bold shadow-xl shadow-[#E9B949]/25 transition-all hover:scale-105"
            >
              GABUNG GERAKAN 1 RUMAH 1 KANDANG
            </button>
            <button
              onClick={() => onJumpToSlide('01')}
              className="px-8 py-4 rounded-full border border-[#F7F1E4]/25 hover:border-[#E9B949] text-[#F7F1E4] hover:text-[#E9B949] text-sm uppercase tracking-widest font-medium transition-colors bg-[#153A24]/40"
            >
              KEMBALI KE AWAL
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
