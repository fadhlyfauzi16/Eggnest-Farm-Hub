import React, { useEffect, useRef, useState } from 'react';
import { EggnestLogo } from './EggnestLogo';
import {
  initEggnestSceneEngine,
  EggnestEngineHandle,
} from '../shaders/eggnest/EggnestSceneEngine';
import { EggnestSlideSections } from './EggnestSlideSections';
import { EGGNEST_SLIDES } from '../data/eggnestSlides';
import {
  Volume2,
  VolumeX,
  ArrowRight,
  Phone,
  Menu,
  X,
} from 'lucide-react';

export const EggnestLandingPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<EggnestEngineHandle | null>(null);

  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [eggCount, setEggCount] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Active slide tracker
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);

  // ============================================================
  // Initialize WebGL Scene Engine
  // ============================================================

  useEffect(() => {
    if (!canvasRef.current) return;

    const handle = initEggnestSceneEngine({
      canvas: canvasRef.current,

      onProgressChange: (prog, activeIdx) => {
        setScrollProgress(prog);
        setActiveSection(activeIdx);
      },

      onEggCountChange: (count) => {
        setEggCount(count);
      },
    });

    engineRef.current = handle;

    return () => {
      handle.destroy();
      engineRef.current = null;
    };
  }, []);

  // ============================================================
  // Track active slide via IntersectionObserver
  // ============================================================

  useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idxAttr = entry.target.getAttribute('data-slide-index');

          if (idxAttr !== null) {
            const idx = parseInt(idxAttr, 10);

            if (!isNaN(idx)) {
              setCurrentSlideIndex(idx);
            }
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '-30% 0px -40% 0px',
      threshold: 0.1,
    });

    const slideElements = document.querySelectorAll(
      '[data-slide-index]'
    );

    slideElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  // ============================================================
  // Web Audio Farm Morning Nature Ambience
  // ============================================================

  const toggleAudio = () => {
    if (!audioEnabled) {
      try {
        const AudioCtx =
          window.AudioContext ||
          (
            window as unknown as {
              webkitAudioContext: typeof AudioContext;
            }
          ).webkitAudioContext;

        const ctx = new AudioCtx();

        audioContextRef.current = ctx;

        const bufferSize = ctx.sampleRate * 3;

        const noiseBuffer = ctx.createBuffer(
          1,
          bufferSize,
          ctx.sampleRate
        );

        const output = noiseBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();

        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(
          450,
          ctx.currentTime
        );

        const gainNode = ctx.createGain();

        gainNode.gain.setValueAtTime(
          0.04,
          ctx.currentTime
        );

        ambientGainRef.current = gainNode;

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        whiteNoise.start();

        setAudioEnabled(true);
      } catch {
        setAudioEnabled(false);
      }
    } else {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      setAudioEnabled(false);
    }
  };

  // ============================================================
  // Jump To Slide
  // ============================================================

  const handleJumpToSlide = (slideNum: string) => {
    const el = document.getElementById(
      `slide-${slideNum}`
    );

    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
      });
    }

    setMobileMenuOpen(false);
  };

  // ============================================================
  // FARM HUB
  // ============================================================

  const goToFarmHub = () => {
    window.location.href = '/farm-hub';
  };

  // ============================================================
  // Navigation
  // ============================================================

  const NAV_ITEMS = [
    {
      label: 'Kebutuhan',
      slideNum: '02',
    },
    {
      label: 'Solusi 12 Ekor',
      slideNum: '05',
    },
    {
      label: 'Ekosistem',
      slideNum: '08',
    },
    {
      label: 'Paket & Hasil',
      slideNum: '12',
    },
    {
      label: 'Sinergi CSR',
      slideNum: '15',
    },
    {
      label: 'Cara Gabung',
      slideNum: '17',
    },
  ];

  return (
    <div className="relative w-full min-h-screen bg-[#0C1F14] text-[#F7F1E4] font-sans antialiased selection:bg-[#E9B949] selection:text-[#153A24]">

      {/* ======================================================
          1. FULLSCREEN WEBGL THREE.JS CANVAS
      ====================================================== */}

      <canvas
        ref={canvasRef}
        id="gl"
        className="fixed inset-0 w-full h-full pointer-events-none z-0 block"
        style={{
          touchAction: 'none',
        }}
      />

      {/* ======================================================
          2. FILM GRAIN & ATMOSPHERIC VIGNETTE
      ====================================================== */}

      <div
        id="vignette"
        className="fixed inset-0 pointer-events-none z-10"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(12,31,20,0) 45%, rgba(12,31,20,0.72) 100%)',
        }}
      />

      <div
        id="grain"
        className="fixed inset-0 pointer-events-none z-10 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        }}
      />

      {/* ======================================================
          3. TOP NAVIGATION
      ====================================================== */}

      <header
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-300 border-b border-[#F7F1E4]/10 bg-[#0C1F14]/80 backdrop-blur-md"
        id="main-nav"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">

          {/* Brand Logo */}

          <button
            onClick={() => handleJumpToSlide('01')}
            className="flex items-center text-left focus:outline-none"
            id="nav-logo-btn"
          >
            <EggnestLogo size={36} />
          </button>

          {/* Desktop Navigation */}

          <nav className="hidden lg:flex items-center gap-7 text-xs uppercase tracking-[0.18em] font-medium text-[#D1C8B8]">

            {NAV_ITEMS.map((item) => (
              <button
                key={item.slideNum}
                onClick={() =>
                  handleJumpToSlide(item.slideNum)
                }
                className="transition-colors py-1 hover:text-[#E9B949]"
                id={`nav-link-${item.slideNum}`}
              >
                {item.label}
              </button>
            ))}

          </nav>

          {/* Actions */}

          <div className="flex items-center gap-3">

            {/* Ambient Nature Sound Toggle */}

            <button
              onClick={toggleAudio}
              className="p-2 rounded-full border border-[#F7F1E4]/15 bg-[#153A24]/60 hover:bg-[#153A24] text-[#E9B949] transition-colors focus:outline-none"
              title={
                audioEnabled
                  ? 'Matikan Suara Alam'
                  : 'Nyalakan Suara Alam Pagi'
              }
              id="audio-toggle-btn"
              aria-label="Toggle ambient nature audio"
            >
              {audioEnabled ? (
                <Volume2 size={16} />
              ) : (
                <VolumeX size={16} />
              )}
            </button>

            {/* Primary Action */}

            <button
              onClick={() => setModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E9B949] hover:bg-[#F3C75C] text-[#153A24] text-xs uppercase tracking-widest font-bold shadow-lg shadow-[#E9B949]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              id="nav-cta-btn"
            >
              <span>GABUNG SEKARANG</span>
              <ArrowRight size={14} />
            </button>

            {/* Mobile Hamburger */}

            <button
              onClick={() =>
                setMobileMenuOpen(!mobileMenuOpen)
              }
              className="p-2 lg:hidden text-[#F7F1E4] focus:outline-none"
              id="mobile-menu-toggle"
              aria-label="Open navigation menu"
            >
              {mobileMenuOpen ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )}
            </button>

          </div>

        </div>

        {/* ====================================================
            MOBILE MENU
        ==================================================== */}

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#F7F1E4]/10 bg-[#0C1F14]/95 px-6 py-6 flex flex-col gap-3 backdrop-blur-xl max-h-[80vh] overflow-y-auto">

            <div className="text-xs font-mono text-[#E9B949] uppercase tracking-wider mb-2">
              JELAJAHI MATERI PROGRAM:
            </div>

            {EGGNEST_SLIDES.map((slide, idx) => (
              <button
                key={slide.num}
                onClick={() =>
                  handleJumpToSlide(slide.num)
                }
                className={`flex items-center justify-between text-xs py-2 text-left border-b border-[#F7F1E4]/5 ${
                  currentSlideIndex === idx
                    ? 'text-[#E9B949] font-bold'
                    : 'text-[#D1C8B8]'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">

                  <span className="font-mono text-[#E9B949] font-bold">
                    {slide.num}
                  </span>

                  <span className="truncate">
                    {slide.title}
                  </span>

                </div>

                <span className="text-[10px] text-[#8D9C8F] uppercase shrink-0 font-mono">
                  {slide.category}
                </span>

              </button>
            ))}

            <div className="pt-4 flex flex-col gap-2.5">

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setModalOpen(true);
                }}
                className="w-full py-3 rounded-xl bg-[#E9B949] text-[#153A24] font-bold text-xs uppercase tracking-widest text-center"
              >
                GABUNG PROGRAM EGGNEST
              </button>

            </div>

          </div>
        )}

      </header>

      {/* ======================================================
          4. SCROLL PROGRESS
      ====================================================== */}

      <div
        className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-[#496B32] via-[#E9B949] to-[#F7F1E4] z-50 transition-all duration-100"
        style={{
          width: `${
            ((currentSlideIndex + 1) /
              EGGNEST_SLIDES.length) *
            100
          }%`,
        }}
        id="top-progress-bar"
      />

      {/* ======================================================
          5. ALL SECTIONS
      ====================================================== */}

      <EggnestSlideSections
        eggCount={eggCount}
        onOpenModal={() => setModalOpen(true)}
        onJumpToSlide={handleJumpToSlide}
      />

      {/* ======================================================
          6. FOOTER
      ====================================================== */}

      <footer className="relative z-20 w-full pt-28 pb-20 px-6 sm:px-12 border-t border-[#F7F1E4]/10 bg-[#0C1F14]/95 backdrop-blur-xl">

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">

          {/* Official Logo */}

          <div className="mb-6 flex flex-col items-center">

            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-[#E9B949] shadow-2xl shadow-[#E9B949]/25 transition-transform duration-500 hover:scale-105 bg-[#0C1F14]">

              <img
                src="/eggnest-logo.jpg"
                alt="Eggnest Home Farm"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />

            </div>

          </div>

          <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#FFFFFF] tracking-tight mb-4 max-w-2xl">

            1 Rumah. 1 Kandang.

            <br />

            <span className="text-[#E9B949] font-normal italic">
              Untuk Ketahanan Pangan Bangsa.
            </span>

          </h2>

          <p className="text-sm sm:text-base text-[#D1C8B8] max-w-xl font-light leading-relaxed mb-10">

            Rumah lebih mandiri. Keluarga lebih kuat.

            <br />

            Kedaulatan pangan dimulai dari pekarangan kita sendiri.

          </p>

          {/* Footer Buttons */}

          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">

            <button
              onClick={() => setModalOpen(true)}
              className="px-8 py-4 rounded-full bg-[#E9B949] hover:bg-[#F3C75C] text-[#153A24] text-sm uppercase tracking-widest font-bold shadow-xl shadow-[#E9B949]/25 transition-all hover:scale-105"
              id="footer-primary-cta"
            >
              GABUNG PROGRAM SEKARANG
            </button>

            <button
              onClick={() =>
                handleJumpToSlide('02')
              }
              className="px-8 py-4 rounded-full border border-[#F7F1E4]/25 hover:border-[#E9B949] text-[#F7F1E4] hover:text-[#E9B949] text-sm uppercase tracking-widest font-medium transition-colors bg-[#153A24]/40"
              id="footer-explore-cta"
            >
              PELAJARI PROGRAM LENGKAP
            </button>

          </div>

          {/* ==================================================
              PROGRAM INFO COLUMNS
          ================================================== */}

          <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-8 text-left py-12 border-t border-b border-[#F7F1E4]/10 text-xs text-[#D1C8B8]">

            {/* Tentang Eggnest */}

            <div>

              <div className="font-display font-semibold text-sm text-[#FFFFFF] uppercase tracking-wider mb-3">
                Tentang Eggnest
              </div>

              <p className="leading-relaxed text-[#8D9C8F]">
                Gerakan inovasi peternakan rumah tangga terpadu yang
                menggabungkan bibit unggul, kandang galvanis higienis
                nirbau, pakan presisi, dan aplikasi monitoring digital.
              </p>

            </div>

            {/* Alur */}

            <div>

              <div className="font-display font-semibold text-sm text-[#FFFFFF] uppercase tracking-wider mb-3">
                Alur Gerakan Mandiri
              </div>

              <ul className="space-y-1.5 text-[#8D9C8F]">

                <li>
                  • 01-04: Kesadaran & Masalah Pangan
                </li>

                <li>
                  • 05-07: Solusi 12 Ekor & Multiplier
                </li>

                <li>
                  • 08-11: Ekosistem, Farm ID & Hub
                </li>

                <li>
                  • 12-14: Paket & Potensi Nilai Hasil
                </li>

                <li>
                  • 15-16: Sinergi CSR & Komparasi
                </li>

                <li>
                  • 17-18: Cara Bergabung & Visi Besar
                </li>

              </ul>

            </div>

            {/* Contact */}

            <div>

              <div className="font-display font-semibold text-sm text-[#FFFFFF] uppercase tracking-wider mb-3">
                Hubungi Kami
              </div>

              <ul className="space-y-3 text-[#8D9C8F]">

                <li>

                  <a
                    href="https://wa.me/6285129362461?text=Halo%20Eggnest%20Home%20Farm,%20saya%20ingin%20konsultasi%20program%201%20Rumah%201%20Kandang"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#153A24] border border-[#81B252]/40 hover:border-[#E9B949] text-[#F7F1E4] hover:text-[#E9B949] transition-all group"
                  >

                    <Phone
                      size={15}
                      className="text-[#81B252] group-hover:scale-110 transition-transform"
                    />

                    <span className="font-mono text-xs font-bold tracking-wider">
                      0851-2936-2461
                    </span>

                  </a>

                </li>

                <li className="text-[11px] text-[#8D9C8F] leading-relaxed">
                  WhatsApp resmi untuk konsultasi paket kandang, bibit
                  pullet, dan kemitraan peternakan rumah tangga.
                </li>

              </ul>

            </div>

            {/* Standard */}

            <div>

              <div className="font-display font-semibold text-sm text-[#FFFFFF] uppercase tracking-wider mb-3">
                Standar Mutu
              </div>

              <p className="leading-relaxed text-[#8D9C8F]">
                Bibit pullet bersertifikat vaksin lengkap, pakan
                teregistrasi resmi Kementan, serta garansi masa adaptasi
                awal demi kenyamanan dan keberhasilan keluarga Anda.
              </p>

            </div>

          </div>

          {/* Copyright */}

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between w-full text-[11px] text-[#8D9C8F] font-mono">

            <div>
              © 2026 EGGNEST HOME FARM. GERAKAN 1 RUMAH 1 KANDANG.
            </div>

            <div className="mt-2 sm:mt-0 flex gap-6">

              <span className="hover:text-[#F7F1E4] cursor-pointer">
                Syarat & Ketentuan
              </span>

              <span className="hover:text-[#F7F1E4] cursor-pointer">
                Kebijakan Privasi
              </span>

              <span className="hover:text-[#F7F1E4] cursor-pointer">
                Standar Kandang
              </span>

            </div>

          </div>

        </div>

      </footer>

      {/* ======================================================
          7. FARM HUB CTA MODAL
          FORM SUDAH DIHAPUS
      ====================================================== */}

      {modalOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C1F14]/85 backdrop-blur-md">

          <div className="relative w-full max-w-lg rounded-3xl bg-[#153A24] border border-[#E9B949]/40 p-8 sm:p-10 shadow-2xl">

            {/* Close Button */}

            <button
              onClick={() =>
                setModalOpen(false)
              }
              className="absolute top-5 right-5 p-2 rounded-full text-[#D1C8B8] hover:text-[#FFFFFF] bg-[#0C1F14]/50 transition-colors"
              aria-label="Tutup"
            >
              <X size={24} />
            </button>

            {/* Header */}

            <div className="flex items-center gap-4 mb-7 pr-12">

              <EggnestLogo
                size={42}
                showText={false}
              />

              <div>

                <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#FFFFFF] leading-tight">
                  Mulai Beternak di Rumah
                </h3>

                <p className="text-sm text-[#E9B949] mt-1">
                  Program 1 Rumah 1 Kandang
                </p>

              </div>

            </div>

            {/* Divider */}

            <div className="h-px w-full bg-[#F7F1E4]/10 mb-7" />

            {/* Description */}

            <div className="mb-8">

              <p className="text-[#F7F1E4] text-lg font-semibold mb-3">
                Bergabung dengan Eggnest Farm Hub
              </p>

              <p className="text-[#D1C8B8] text-sm sm:text-base leading-relaxed">
                Lanjutkan ke Eggnest Farm Hub untuk mendapatkan akses
                pendampingan, edukasi, monitoring kandang, laporan produksi,
                serta sistem pendamping resmi Eggnest.
              </p>

            </div>

            {/* Benefits */}

            <div className="grid grid-cols-2 gap-3 mb-8">

              <div className="rounded-xl bg-[#0C1F14]/55 border border-[#F7F1E4]/10 px-4 py-3">
                <div className="text-[#E9B949] text-xs uppercase tracking-wider font-bold mb-1">
                  Monitoring
                </div>
                <div className="text-[#D1C8B8] text-xs">
                  Pantau kandang & produksi
                </div>
              </div>

              <div className="rounded-xl bg-[#0C1F14]/55 border border-[#F7F1E4]/10 px-4 py-3">
                <div className="text-[#E9B949] text-xs uppercase tracking-wider font-bold mb-1">
                  Pendampingan
                </div>
                <div className="text-[#D1C8B8] text-xs">
                  Dibantu tim Eggnest
                </div>
              </div>

              <div className="rounded-xl bg-[#0C1F14]/55 border border-[#F7F1E4]/10 px-4 py-3">
                <div className="text-[#E9B949] text-xs uppercase tracking-wider font-bold mb-1">
                  Academy
                </div>
                <div className="text-[#D1C8B8] text-xs">
                  Edukasi pemeliharaan
                </div>
              </div>

              <div className="rounded-xl bg-[#0C1F14]/55 border border-[#F7F1E4]/10 px-4 py-3">
                <div className="text-[#E9B949] text-xs uppercase tracking-wider font-bold mb-1">
                  Farm ID
                </div>
                <div className="text-[#D1C8B8] text-xs">
                  Identitas kandang digital
                </div>
              </div>

            </div>

            {/* Main Button */}

            <button
              onClick={goToFarmHub}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-[#E9B949] hover:bg-[#F3C75C] text-[#153A24] font-bold text-sm uppercase tracking-[0.16em] transition-all shadow-lg shadow-[#E9B949]/20 hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>
                GABUNG FARM HUB
              </span>

              <ArrowRight size={18} />
            </button>

            {/* Small Note */}

            <p className="text-[11px] text-center text-[#8D9C8F] mt-5">
              Sistem pendamping resmi member Eggnest Home Farm
            </p>

          </div>

        </div>
      )}

    </div>
  );
};