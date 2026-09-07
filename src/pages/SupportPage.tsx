import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bot,
  Camera,
  CheckCircle2,
  ChevronRight,
  History,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  UserRound,
  X,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { api } from '../services/api';
import { SupportCategory, SupportTicket } from '../types';

type AiMessage = {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  attachment_url?: string | null;
  created_at?: string;
};

const QUICK_QUESTIONS = [
  { icon: '🥚', label: 'Produksi telur turun', prompt: 'Produksi telur kandang saya menurun. Tolong analisis berdasarkan data laporan kandang saya dan beri langkah pemeriksaan awal.' },
  { icon: '🐔', label: 'Ayam terlihat sakit', prompt: 'Ada ayam yang terlihat kurang sehat. Apa saja yang perlu saya periksa terlebih dahulu?' },
  { icon: '🌾', label: 'Masalah pakan', prompt: 'Tolong cek data pakan kandang saya. Apakah ada hal yang perlu diperhatikan?' },
  { icon: '💧', label: 'Air minum', prompt: 'Saya ingin memastikan kondisi air minum ayam sudah baik. Apa saja yang perlu saya cek?' },
  { icon: '🥚', label: 'Telur bermasalah', prompt: 'Saya menemukan telur yang kualitasnya kurang baik. Apa kemungkinan faktor yang perlu saya periksa?' },
  { icon: '📷', label: 'Analisis foto', prompt: 'Saya ingin mengirim foto kondisi ayam atau kandang untuk dianalisis.' },
];

const getMessageAttachment = (msg: any): string =>
  String(msg?.attachmentUrl ?? msg?.attachment_url ?? '');
const getTicketPhoto = (ticket: any): string =>
  String(ticket?.photoUrl ?? ticket?.photo_url ?? '');

const getStatusClasses = (status?: string): string => {
  switch (status) {
    case 'Diterima':
      return 'bg-sky-50 text-sky-700 border border-sky-200';
    case 'Diproses':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'Solusi Diberikan':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'Selesai':
      return 'bg-[#EAF2EC] text-[#1B3022] border border-[#CDE3D3]';
    default:
      return 'bg-stone-100 text-stone-600 border border-stone-200';
  }
};

export const SupportPage: React.FC = () => {
  const { farm, tickets, createSupportTicket, uploadPhoto, showToast } = useFarm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<'ai' | 'tickets'>('ai');
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const sortedTickets = useMemo(
    () =>
      [...tickets].sort((a: any, b: any) =>
        String(b?.createdAt ?? b?.created_at ?? '').localeCompare(
          String(a?.createdAt ?? a?.created_at ?? '')
        )
      ),
    [tickets]
  );

  useEffect(() => {
    const ticketId = searchParams.get('ticket');
    if (!ticketId || tickets.length === 0) return;
    const found = tickets.find((t: any) => String(t.id) === ticketId);
    if (found) {
      setMode('tickets');
      setActiveTicket(found);
    }
  }, [tickets, searchParams]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.getVetAiHistory();
        if (mounted) setMessages((res.messages || []) as AiMessage[]);
      } catch (err: any) {
        if (mounted) showToast(`⚠️ ${err?.message || 'Gagal memuat riwayat Asisten Kandang.'}`);
      } finally {
        if (mounted) setIsLoadingHistory(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const resetPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handlePhotoChange = (file?: File) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast('⚠️ Foto harus JPG, PNG, atau WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('⚠️ Ukuran foto maksimal 5 MB.');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const sendMessage = async (overrideText?: string) => {
    const text = String(overrideText ?? draft).trim();
    if (!text && !photoFile) {
      showToast('⚠️ Tulis pertanyaan atau pilih foto terlebih dahulu.');
      return;
    }

    setIsSending(true);
    setUrgent(false);

    try {
      let uploadedPhotoUrl = '';
      if (photoFile) uploadedPhotoUrl = await uploadPhoto(photoFile);

      const optimistic: AiMessage = {
        id: `local-${Date.now()}`,
        role: 'user',
        message: text || 'Mohon analisis foto kondisi kandang ini.',
        attachment_url: uploadedPhotoUrl || photoPreview || undefined,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setDraft('');
      resetPhoto();

      const res = await api.chatVetAi(
        text || 'Mohon analisis foto kondisi kandang ini.',
        uploadedPhotoUrl || undefined
      );

      setMessages((prev) => [...prev, res.message as AiMessage]);
      setUrgent(Boolean(res.urgent));
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Asisten Kandang sedang tidak dapat menjawab.'}`);
    } finally {
      setIsSending(false);
    }
  };

  const clearChat = async () => {
    if (!window.confirm('Mulai percakapan baru? Riwayat chat Asisten Kandang akan dikosongkan.')) return;
    try {
      await api.clearVetAiHistory();
      setMessages([]);
      setUrgent(false);
      resetPhoto();
      setDraft('');
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal memulai percakapan baru.'}`);
    }
  };

  const escalateToTeam = async () => {
    const userMessages = messages.filter((m) => m.role === 'user');
    if (userMessages.length === 0) {
      showToast('⚠️ Ceritakan kondisi kandang ke Asisten Kandang terlebih dahulu.');
      return;
    }

    setIsEscalating(true);
    try {
      const lastUser = userMessages[userMessages.length - 1];
      const lastAi = [...messages].reverse().find((m) => m.role === 'assistant');
      const latestPhoto = [...userMessages].reverse().find((m) => m.attachment_url)?.attachment_url || undefined;

      const transcript = [
        'Eskalasi dari Dokter Hewan Siaga — Asisten Kandang 24 Jam.',
        '',
        `Pertanyaan member: ${lastUser.message}`,
        lastAi ? `Panduan awal Asisten Kandang: ${lastAi.message}` : '',
      ].filter(Boolean).join('\n');

      const ticket = await createSupportTicket({
        category: 'Lainnya' as SupportCategory,
        title: 'Eskalasi dari Asisten Kandang',
        description: transcript,
        photoUrl: latestPhoto,
      });

      if (ticket) {
        setMode('tickets');
        setActiveTicket(ticket);
        showToast('✓ Konsultasi diteruskan ke Tim Eggnest.');
      }
    } finally {
      setIsEscalating(false);
    }
  };

  const renderMessageText = (value: string) =>
    value.split('\n').map((line, index) => (
      <React.Fragment key={`${index}-${line.slice(0, 10)}`}>
        {line}
        {index < value.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EAF2EC] text-[#1B3022] text-xs font-bold rounded-full border border-[#CDE3D3]">
            <Stethoscope className="w-3.5 h-3.5" />
            Dokter Hewan Siaga
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1B3022] font-['Outfit'] tracking-tight mt-2">
            Asisten Kandang 24 Jam
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Tanya kondisi kandang, kirim foto, dan dapatkan panduan awal berdasarkan data Farm ID Anda.
          </p>
        </div>

        <div className="flex rounded-2xl border border-[#EFECE6] bg-white p-1 shadow-xs self-start">
          <button
            onClick={() => setMode('ai')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 ${
              mode === 'ai' ? 'bg-[#2D4A36] text-white' : 'text-stone-600'
            }`}
          >
            <MessageCircle className="w-4 h-4" /> Konsultasi 24 Jam
          </button>
          <button
            onClick={() => setMode('tickets')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 ${
              mode === 'tickets' ? 'bg-[#2D4A36] text-white' : 'text-stone-600'
            }`}
          >
            <History className="w-4 h-4" /> Tim Eggnest ({tickets.length})
          </button>
        </div>
      </div>

      {mode === 'ai' ? (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
          <div className="bg-white rounded-3xl border border-[#E8E3D9] shadow-sm overflow-hidden min-h-[650px] flex flex-col">
            <div className="px-5 py-4 border-b border-[#EFECE6] bg-[#FDFBF7] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#1B3022] text-white flex items-center justify-center relative">
                  <Bot className="w-6 h-6" />
                  <span className="absolute -right-0.5 -bottom-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div>
                  <div className="font-black text-[#1B3022]">Dokter Hewan Siaga</div>
                  <div className="text-[11px] text-stone-500">Asisten Kandang 24 Jam • Farm {farm.farmCode}</div>
                </div>
              </div>
              <button
                onClick={clearChat}
                className="p-2.5 rounded-xl hover:bg-white text-stone-500"
                title="Percakapan baru"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#FAF9F6] max-h-[620px]">
              {isLoadingHistory ? (
                <div className="h-64 flex items-center justify-center text-stone-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat percakapan...
                </div>
              ) : messages.length === 0 ? (
                <div className="max-w-2xl mx-auto py-8">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-3xl bg-[#EAF2EC] mx-auto flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-[#2D4A36]" />
                    </div>
                    <h2 className="text-xl font-black text-[#1B3022] mt-4">
                      Ada yang ingin dikonsultasikan?
                    </h2>
                    <p className="text-sm text-stone-500 mt-2">
                      Saya dapat membaca konteks kandang {farm.farmCode} dan laporan terbaru Anda.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2.5 mt-6">
                    {QUICK_QUESTIONS.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          if (item.label === 'Analisis foto') {
                            photoInputRef.current?.click();
                            setDraft(item.prompt);
                          } else {
                            sendMessage(item.prompt);
                          }
                        }}
                        className="text-left p-4 rounded-2xl bg-white border border-[#E8E3D9] hover:border-[#2D4A36] transition-colors"
                      >
                        <span className="text-lg">{item.icon}</span>
                        <div className="text-sm font-bold text-[#1B3022] mt-1">{item.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div key={msg.id} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {!isUser && (
                        <div className="w-8 h-8 rounded-xl bg-[#1B3022] text-white flex items-center justify-center shrink-0 mt-1">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                      <div className={`max-w-[86%] md:max-w-[76%] rounded-2xl px-4 py-3 ${
                        isUser
                          ? 'bg-[#2D4A36] text-white rounded-br-md'
                          : 'bg-white border border-[#E8E3D9] text-stone-700 rounded-bl-md'
                      }`}>
                        {msg.attachment_url && (
                          <img
                            src={msg.attachment_url}
                            alt="Lampiran konsultasi"
                            className="max-h-64 rounded-xl object-contain mb-3 bg-black/5"
                          />
                        )}
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {renderMessageText(msg.message)}
                        </div>
                      </div>
                      {isUser && (
                        <div className="w-8 h-8 rounded-xl bg-[#EAF2EC] flex items-center justify-center shrink-0 mt-1">
                          <UserRound className="w-4 h-4 text-[#2D4A36]" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {isSending && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-[#1B3022] text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-[#E8E3D9] rounded-2xl rounded-bl-md px-4 py-3 text-sm text-stone-500">
                    <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                    Sedang membaca data kandang...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {urgent && (
              <div className="mx-4 mt-3 p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-black text-red-800">Disarankan diteruskan ke Tim Eggnest</div>
                  <div className="text-xs text-red-700 mt-0.5">Ada indikator yang sebaiknya ditinjau manusia/dokter hewan.</div>
                </div>
                <button
                  onClick={escalateToTeam}
                  disabled={isEscalating}
                  className="px-3 py-2 bg-red-700 text-white rounded-xl text-xs font-black disabled:opacity-50"
                >
                  Hubungkan
                </button>
              </div>
            )}

            <div className="p-4 border-t border-[#EFECE6] bg-white">
              {photoPreview && (
                <div className="mb-3 inline-flex relative">
                  <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-2xl object-cover border border-[#E8E3D9]" />
                  <button
                    onClick={resetPhoto}
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#1B3022] text-white flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handlePhotoChange(e.target.files?.[0])}
              />

              <div className="flex items-end gap-2">
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#E8E3D9] flex items-center justify-center shrink-0"
                  title="Kirim foto"
                >
                  <Camera className="w-5 h-5 text-[#2D4A36]" />
                </button>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!isSending) sendMessage();
                    }
                  }}
                  rows={1}
                  placeholder="Tanyakan kondisi ayam, telur, pakan, kandang..."
                  className="flex-1 min-h-12 max-h-32 resize-none px-4 py-3 rounded-2xl border border-[#E8E3D9] focus:outline-none focus:ring-2 focus:ring-[#2D4A36] text-sm"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={isSending || (!draft.trim() && !photoFile)}
                  className="w-12 h-12 rounded-2xl bg-[#2D4A36] hover:bg-[#1B3022] text-white flex items-center justify-center shrink-0 disabled:opacity-40"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3">
                <p className="text-[10px] text-stone-400">
                  Panduan awal berbasis AI, bukan pengganti pemeriksaan dokter hewan.
                </p>
                {messages.length > 0 && (
                  <button
                    onClick={escalateToTeam}
                    disabled={isEscalating}
                    className="text-xs font-black text-[#2D4A36] inline-flex items-center gap-1"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    {isEscalating ? 'Menghubungkan...' : 'Hubungkan Tim Eggnest'}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl bg-[#1B3022] text-white p-5">
              <Sparkles className="w-6 h-6 text-[#D4AF37]" />
              <h3 className="font-black text-lg mt-3">Sudah mengenal kandang Anda</h3>
              <div className="space-y-2 mt-4 text-xs text-white/75">
                <div className="flex justify-between gap-3"><span>Farm ID</span><strong className="text-white">{farm.farmCode}</strong></div>
                <div className="flex justify-between gap-3"><span>Ayam aktif</span><strong className="text-white">{farm.activeChickens || 0} ekor</strong></div>
                <div className="flex justify-between gap-3"><span>Jenis</span><strong className="text-white text-right">{farm.chickenBreed || '-'}</strong></div>
                <div className="flex justify-between gap-3"><span>Umur</span><strong className="text-white">{farm.currentAgeWeeks || 0} minggu</strong></div>
              </div>
            </div>

            <div className="rounded-3xl bg-[#EAF2EC] border border-[#CDE3D3] p-5">
              <CheckCircle2 className="w-5 h-5 text-[#2D4A36]" />
              <h3 className="font-black text-[#1B3022] mt-2">Bisa bantu apa?</h3>
              <div className="mt-3 space-y-2 text-xs text-stone-600">
                <p>• Membaca tren produksi dari laporan kandang.</p>
                <p>• Mengecek kewajaran data pakan.</p>
                <p>• Memberi panduan pemeriksaan awal.</p>
                <p>• Membaca foto ayam/kandang sebagai indikasi awal.</p>
                <p>• Menghubungkan Tim Eggnest bila perlu.</p>
              </div>
            </div>

            <div className="rounded-3xl bg-[#FFF8E8] border border-[#FDE68A] p-5">
              <ShieldAlert className="w-5 h-5 text-[#C2841E]" />
              <h3 className="font-black text-[#1B3022] mt-2">Kondisi serius?</h3>
              <p className="text-xs text-stone-600 mt-2">
                Jika banyak ayam sakit sekaligus, kematian mendadak, sesak berat, perdarahan, atau kejang, segera hubungkan ke Tim Eggnest.
              </p>
              <button
                onClick={escalateToTeam}
                disabled={messages.length === 0 || isEscalating}
                className="mt-3 w-full py-2.5 rounded-xl bg-[#1B3022] text-white text-xs font-black disabled:opacity-40"
              >
                Hubungkan Tim Eggnest
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#2D4A36]" />
            <h2 className="text-xl font-bold text-[#1B3022]">Riwayat Konsultasi Tim Eggnest</h2>
          </div>

          {sortedTickets.length === 0 ? (
            <div className="text-center py-12 text-stone-400">Belum ada konsultasi yang diteruskan ke Tim Eggnest.</div>
          ) : (
            <div className="space-y-3">
              {sortedTickets.map((t: any) => {
                const photo = getTicketPhoto(t) || getMessageAttachment(t.messages?.[0]);
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTicket(t)}
                    className="w-full p-4 rounded-2xl border border-[#EFECE6] bg-[#FAF7F2] hover:bg-white text-left flex gap-4 items-center"
                  >
                    {photo ? (
                      <img src={photo} alt="Foto tiket" className="w-20 h-20 rounded-xl object-cover border border-[#EFECE6]" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-white border border-[#EFECE6] flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-stone-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs font-mono font-bold text-[#D4AF37] bg-[#1B3022] px-2 py-0.5 rounded">
                          #{t.ticketCode || t.ticket_code}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getStatusClasses(t.status)}`}>
                          {t.status}
                        </span>
                      </div>
                      <div className="font-bold text-[#1B3022] mt-1">{t.title || t.category}</div>
                      <div className="text-xs text-stone-500 line-clamp-2 mt-1">{t.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col">
            <div className="p-5 border-b border-[#EFECE6] flex justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold text-[#D4AF37] bg-[#1B3022] px-2 py-0.5 rounded">
                  #{(activeTicket as any).ticketCode || (activeTicket as any).ticket_code}
                </span>
                <h3 className="text-xl font-bold text-[#1B3022] mt-1">
                  {(activeTicket as any).title || (activeTicket as any).category}
                </h3>
                <div className="mt-2">
                  <span className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full ${getStatusClasses((activeTicket as any).status)}`}>
                    {(activeTicket as any).status}
                  </span>
                </div>
              </div>
              <button onClick={() => { setActiveTicket(null); setSearchParams({}); }}>
                <X className="w-6 h-6 text-stone-400" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 bg-[#FAF7F2]">
              {((activeTicket as any).messages || []).map((msg: any) => {
                const att = getMessageAttachment(msg);
                const staff = msg.senderRole === 'admin' || msg.sender_role === 'admin';
                return (
                  <div
                    key={msg.id}
                    className={`max-w-[88%] p-4 rounded-2xl ${
                      staff ? 'ml-auto bg-[#1B3022] text-white' : 'mr-auto bg-white border border-[#EFECE6]'
                    }`}
                  >
                    <div className="text-[10px] font-bold opacity-70 mb-1">{msg.senderName || msg.sender_name}</div>
                    <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
                    {att && <img src={att} alt="Lampiran tiket" className="mt-3 max-h-72 rounded-xl object-contain bg-black/5" />}
                  </div>
                );
              })}

              {(!(activeTicket as any).messages || (activeTicket as any).messages.length === 0) && (
                <div className="p-4 bg-white rounded-2xl border border-[#EFECE6]">
                  {(activeTicket as any).description}
                  {getTicketPhoto(activeTicket) && (
                    <img src={getTicketPhoto(activeTicket)} alt="Foto tiket" className="mt-3 max-h-72 rounded-xl object-contain" />
                  )}
                </div>
              )}

              {(activeTicket as any).status === 'Selesai' && (
                <div className="mx-auto max-w-[92%] text-center p-4 rounded-2xl bg-[#EAF2EC] border border-[#CDE3D3] text-[#1B3022]">
                  <div className="text-sm font-black">✓ Konsultasi Selesai</div>
                  <div className="text-xs mt-1 text-[#2D4A36]">
                    Tiket telah ditutup oleh Tim Eggnest. Jika masalah masih berlanjut, gunakan Asisten Kandang atau hubungkan kembali Tim Eggnest.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
