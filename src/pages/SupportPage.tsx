import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { SupportCategory, SupportTicket, SupportStatus } from '../types';
import {
  Headphones,
  Send,
  Camera,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertTriangle,
  HelpCircle,
  Egg,
  Wheat,
  Droplets,
  HeartPulse,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  FileText,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const SupportPage: React.FC = () => {
  const { farm, tickets, createSupportTicket, replyTicketMessage, showToast } = useFarm();

  const [selectedCategory, setSelectedCategory] = useState<SupportCategory | null>(null);
  const [eggCountToday, setEggCountToday] = useState<number>(8);
  const [description, setDescription] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [activeTicketTab, setActiveTicketTab] = useState<'create' | 'history'>('create');
  const [createdTicket, setCreatedTicket] = useState<SupportTicket | null>(null);

  const categories: {
    name: SupportCategory;
    icon: string;
    description: string;
    color: string;
  }[] = [
    {
      name: 'Produksi Menurun',
      icon: '🔻',
      description: 'Panen telur berkurang drastis dibanding target harian',
      color: 'hover:border-[#D4AF37] hover:bg-[#FEF6E9]/50',
    },
    {
      name: 'Ayam Sakit',
      icon: '🐔',
      description: 'Ayam lemas, jengger pucat, ngorok, atau kotoran encer',
      color: 'hover:border-rose-500 hover:bg-rose-50/50',
    },
    {
      name: 'Masalah Pakan',
      icon: '🌾',
      description: 'Ayam tidak mau makan, pakan menggumpal/berjamur',
      color: 'hover:border-[#2D4A36] hover:bg-[#EAF2EC]/50',
    },
    {
      name: 'Air Minum',
      icon: '💧',
      description: 'Jalur nipple macet, air bocor atau berlumut',
      color: 'hover:border-blue-500 hover:bg-blue-50/50',
    },
    {
      name: 'Telur Bermasalah',
      icon: '🥚',
      description: 'Cangkang lunak/retak, bentuk kecil, atau tanpa kuning',
      color: 'hover:border-[#D4AF37] hover:bg-[#FEF6E9]/50',
    },
    {
      name: 'Klaim Garansi',
      icon: '🛡',
      description: 'Klaim penggantian bibit ayam sesuai masa garansi aktif',
      color: 'hover:border-purple-500 hover:bg-purple-50/50',
    },
    {
      name: 'Lainnya',
      icon: '❓',
      description: 'Pertanyaan umum teknis seputar kandang & kemitraan',
      color: 'hover:border-[#2D4A36] hover:bg-[#FAF7F2]',
    },
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [isSubmittingReply, setIsSubmittingReply] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) {
      showToast('⚠️ Silakan pilih kategori masalah terlebih dahulu.');
      return;
    }
    if (!description.trim()) {
      showToast('⚠️ Mohon ceritakan kondisi kandang Anda.');
      return;
    }

    const newTicket = await createSupportTicket({
      category: selectedCategory,
      title: selectedCategory,
      eggCountToday: selectedCategory === 'Produksi Menurun' ? eggCountToday : undefined,
      description,
      photoUrl: photoPreview || undefined,
    });

    if (newTicket) {
      setCreatedTicket(newTicket);
      setDescription('');
      setPhotoPreview(null);

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#2D4A36', '#1B3022', '#D4AF37'],
        });
      } catch {
        // ignore
      }
    }
  };

  const handleSendReply = async (ticketId: string) => {
    const msg = replyInputs[ticketId];
    if (!msg || !msg.trim()) return;

    setIsSubmittingReply(ticketId);
    try {
      await replyTicketMessage(ticketId, msg.trim());
      setReplyInputs((prev) => ({ ...prev, [ticketId]: '' }));
    } finally {
      setIsSubmittingReply(null);
    }
  };

  const statusSteps: SupportStatus[] = ['Diterima', 'Diproses', 'Solusi Diberikan', 'Selesai'];

  const getStepIndex = (status: SupportStatus) => {
    return statusSteps.indexOf(status);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-[#EAF2EC] text-[#1B3022] text-xs font-bold rounded-full border border-[#CDE3D3]">
            Dokter Hewan & Tim Teknis Eggnest
          </span>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1B3022] font-['Outfit'] tracking-tight mt-1">
            Bantuan & Konsultasi
          </h1>
          <p className="text-stone-600 text-sm font-medium mt-1">
            Kami siap membantu Anda mengatasi kendala kandang dan menjaga ayam tetap produktif.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#FAF7F2] p-1.5 rounded-2xl border border-[#EFECE6]">
          <button
            onClick={() => {
              setActiveTicketTab('create');
              setCreatedTicket(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTicketTab === 'create'
                ? 'bg-[#2D4A36] text-[#FDFBF7] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            + Buat Konsultasi
          </button>
          <button
            onClick={() => setActiveTicketTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTicketTab === 'history'
                ? 'bg-[#2D4A36] text-[#FDFBF7] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Riwayat Tiket ({tickets.length})
          </button>
        </div>
      </div>

      {activeTicketTab === 'create' ? (
        createdTicket ? (
          /* Ticket Created Success View with Visual Stepper */
          <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-8 space-y-6 max-w-2xl mx-auto text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-[#EAF2EC] text-[#2D4A36] flex items-center justify-center mx-auto text-3xl border border-[#CDE3D3]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                ID Tiket Konsultasi
              </span>
              <h2 className="text-3xl font-black text-[#1B3022] font-['Outfit'] mt-1">
                {createdTicket.ticketCode}
              </h2>
              <p className="text-sm font-semibold text-[#2D4A36] mt-1">
                Status: Sedang diperiksa Tim Eggnest
              </p>
            </div>

            {/* Stepper: Diterima -> Diproses -> Solusi Diberikan -> Selesai */}
            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#EFECE6]">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-4 font-['Outfit']">
                Progress Status Penanganan:
              </span>
              <div className="grid grid-cols-4 gap-2 relative">
                {statusSteps.map((step, idx) => {
                  const currentIdx = getStepIndex(createdTicket.status);
                  const isDone = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={step} className="flex flex-col items-center text-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                          isDone
                            ? 'bg-[#2D4A36] text-[#FDFBF7] shadow-xs ring-2 ring-[#2D4A36]/30'
                            : 'bg-[#E5E1D8] text-stone-500'
                        }`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <span
                        className={`text-[11px] leading-tight font-bold ${
                          isCurrent
                            ? 'text-[#2D4A36]'
                            : isDone
                            ? 'text-stone-800'
                            : 'text-stone-400'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EFECE6] text-left text-xs space-y-1.5">
              <p className="font-bold text-[#1B3022]">Kategori: {createdTicket.category}</p>
              <p className="text-stone-600">{createdTicket.description}</p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setCreatedTicket(null)}
                className="px-6 py-3 bg-[#2D4A36] text-[#FDFBF7] font-bold rounded-xl text-sm shadow-md hover:bg-[#1B3022] cursor-pointer"
              >
                + Buat Konsultasi Baru
              </button>
              <button
                onClick={() => setActiveTicketTab('history')}
                className="px-6 py-3 bg-[#FAF7F2] text-[#1B3022] font-bold rounded-xl text-sm hover:bg-[#EFECE6] border border-[#EFECE6] cursor-pointer"
              >
                Lihat Semua Tiket
              </button>
            </div>
          </div>
        ) : (
          /* Create Consultation View */
          <div className="space-y-6">
            {/* Problem Choice Cards */}
            <div>
              <h3 className="text-lg font-bold text-[#1B3022] font-['Outfit'] mb-3">
                1. Pilih Kategori Masalah yang Terjadi:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.name;

                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-[#2D4A36] bg-[#EAF2EC] shadow-md ring-2 ring-[#2D4A36]/20'
                          : `border-[#EFECE6] bg-white ${cat.color}`
                      }`}
                    >
                      <span className="text-2xl shrink-0">{cat.icon}</span>
                      <div>
                        <span className="text-base font-extrabold text-[#1B3022] block leading-snug font-['Outfit']">
                          {cat.name}
                        </span>
                        <span className="text-xs text-stone-600 mt-0.5 block leading-tight">
                          {cat.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Consultation Form (when problem selected) */}
            {selectedCategory && (
              <div className="bg-white rounded-3xl border border-[#EFECE6] p-6 md:p-8 shadow-xs space-y-6 max-w-2xl mx-auto animate-in fade-in">
                <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {categories.find((c) => c.name === selectedCategory)?.icon}
                    </span>
                    <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit']">
                      Konsultasi: {selectedCategory}
                    </h3>
                  </div>
                  <span className="text-xs text-stone-500 font-medium">Langkah 2 dari 2</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* If Produksi Menurun, show specific egg input */}
                  {selectedCategory === 'Produksi Menurun' && (
                    <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EFECE6]">
                      <label className="block text-sm font-bold text-[#1B3022] mb-2 font-['Outfit']">
                        Berapa telur hari ini?
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max={farm.activeChickens}
                          value={eggCountToday}
                          onChange={(e) => setEggCountToday(parseInt(e.target.value, 10) || 0)}
                          className="w-24 px-4 py-2 rounded-xl border border-[#EFECE6] font-black text-xl text-center text-[#1B3022] bg-white outline-none focus:ring-2 focus:ring-[#2D4A36]"
                        />
                        <span className="text-sm font-semibold text-stone-600">
                          butir (dari total {farm.activeChickens} ayam aktif)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Photo upload */}
                  <div>
                    <label className="block text-sm font-bold text-[#1B3022] mb-1.5 font-['Outfit']">
                      Upload Foto Kondisi <span className="text-stone-400 font-normal">(Sangat dianjurkan)</span>
                    </label>
                    <label className="border-2 border-dashed border-[#E5E1D8] hover:border-[#2D4A36] rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-[#FAF7F2] transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      {photoPreview ? (
                        <div className="relative w-full h-36 rounded-xl overflow-hidden">
                          <img
                            src={photoPreview}
                            alt="Foto Kondisi"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold">
                            Klik untuk ganti foto
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center py-2">
                          <Camera className="w-7 h-7 text-[#2D6A4F] mb-1" />
                          <span className="text-xs font-bold text-[#1B3022] font-['Outfit']">
                            Unggah Foto Ayam, Kotoran, atau Kandang
                          </span>
                          <span className="text-[10px] text-stone-400">JPG/PNG maks 5MB</span>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Textarea */}
                  <div>
                    <label className="block text-sm font-bold text-[#1B3022] mb-1.5 font-['Outfit']">
                      Ceritakan kondisi kandang Anda
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Contoh: Sejak 2 hari lalu ada 2 ekor ayam yang terlihat lemas dan kotoran agak encer. Suhu kandang siang hari cukup panas..."
                      className="w-full px-4 py-3 rounded-2xl border border-[#EFECE6] focus:outline-none focus:ring-2 focus:ring-[#2D4A36] text-sm bg-white"
                    />
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    className="w-full py-4 bg-[#2D4A36] hover:bg-[#1B3022] text-[#FDFBF7] font-black rounded-2xl text-lg shadow-xl shadow-[#2D4A36]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 font-['Outfit']"
                  >
                    <Send className="w-5 h-5" />
                    KIRIM KE TIM EGGNEST
                  </button>
                </form>
              </div>
            )}
          </div>
        )
      ) : (
        /* History Tickets View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit']">
              Daftar Konsultasi & Tiket Saya
            </h3>
            <span className="text-xs font-semibold text-stone-500">
              Total {tickets.length} permohonan
            </span>
          </div>

          <div className="space-y-4">
            {tickets.map((ticket) => {
              const currentStepIdx = getStepIndex(ticket.status);

              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFECE6] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-[#1B3022] font-['Outfit']">
                        {ticket.ticketCode}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EAF2EC] text-[#1B3022] font-bold border border-[#CDE3D3]">
                        {ticket.category}
                      </span>
                    </div>
                    <span className="text-xs text-stone-400 font-medium">
                      Diajukan: {ticket.createdAt}
                    </span>
                  </div>

                  {/* Progress Stepper Bar */}
                  <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#EFECE6]">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {statusSteps.map((step, idx) => {
                        const isDone = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;

                        return (
                          <div key={step} className="flex flex-col items-center">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] mb-1 ${
                                isDone
                                  ? 'bg-[#2D6A4F] text-[#FDFBF7] ring-2 ring-[#2D4A36]/30'
                                  : 'bg-[#E5E1D8] text-stone-500'
                              }`}
                            >
                              {isDone ? '✓' : idx + 1}
                            </div>
                            <span
                              className={`text-[10px] font-bold ${
                                isCurrent
                                  ? 'text-[#2D6A4F]'
                                  : isDone
                                  ? 'text-stone-800'
                                  : 'text-stone-400'
                              }`}
                            >
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="text-sm text-stone-700 space-y-1">
                    <span className="text-xs font-bold text-stone-500 uppercase block font-['Outfit']">
                      Keluhan Mitra:
                    </span>
                    <p className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EFECE6]">
                      {ticket.description}
                    </p>
                  </div>

                  {/* Message Thread */}
                  {ticket.messages && ticket.messages.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-[#EFECE6]">
                      <span className="text-xs font-bold text-stone-500 uppercase block font-['Outfit']">
                        Percakapan & Diskusi:
                      </span>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {ticket.messages.map((m) => {
                          const isAdmin = m.senderRole === 'admin';
                          return (
                            <div
                              key={m.id}
                              className={`p-3 rounded-2xl text-xs ${
                                isAdmin
                                  ? 'bg-[#EAF2EC] border border-[#CDE3D3] text-[#1B3022] ml-4'
                                  : 'bg-[#FAF7F2] border border-[#EFECE6] text-stone-800 mr-4'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold mb-1">
                                <span>{m.senderName}</span>
                                <span className="text-[10px] text-stone-400 font-normal">
                                  {m.createdAt?.split('T')[0] || m.createdAt}
                                </span>
                              </div>
                              <p className="leading-relaxed">{m.message}</p>
                              {m.attachmentUrl && (
                                <img
                                  src={m.attachmentUrl}
                                  alt="Lampiran"
                                  className="mt-2 h-24 rounded-lg object-cover border border-[#EFECE6]"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Reply Box */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Tulis balasan atau info tambahan..."
                      value={replyInputs[ticket.id] || ''}
                      onChange={(e) =>
                        setReplyInputs((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendReply(ticket.id);
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FAF7F2] text-xs text-[#1B3022] outline-none focus:ring-2 focus:ring-[#2D4A36]"
                    />
                    <button
                      type="button"
                      disabled={isSubmittingReply === ticket.id || !replyInputs[ticket.id]?.trim()}
                      onClick={() => handleSendReply(ticket.id)}
                      className="px-4 py-2.5 bg-[#2D4A36] text-[#FDFBF7] font-bold rounded-xl text-xs hover:bg-[#1B3022] disabled:opacity-50 cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
