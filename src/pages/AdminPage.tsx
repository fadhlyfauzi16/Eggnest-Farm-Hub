import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  ShieldAlert,
  Warehouse,
  Activity,
  Egg,
  TrendingUp,
  AlertTriangle,
  Headphones,
  Phone,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  Filter,
  Eye,
  MessageCircle,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Save,
  BookOpen,
  Settings,
  RefreshCw,
  Database,
  UserCheck,
  Send,
} from 'lucide-react';
import { SupportStatus, SupportTicket, AcademyCategory } from '../types';

export const AdminPage: React.FC = () => {
  const {
    farms,
    users,
    allReports,
    adminAlerts,
    resolveAdminAlert,
    tickets,
    updateTicketStatus,
    replyTicketMessage,
    academyContents,
    createAcademyContent,
    updateAcademyContent,
    deleteAcademyContent,
    togglePublishAcademy,
    settings,
    updateSettings,
    resetToCleanDatabase,
    loadDemoDatabase,
    impersonateFarm,
    createFarm,
    showToast,
    setActivePage,
  } = useFarm();

  const [activeTab, setActiveTab] = useState<'kandang' | 'alerts' | 'tickets' | 'academy' | 'pengaturan'>('kandang');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'warning' | 'critical' | 'unclaimed'>('all');
  const [selectedFarmModal, setSelectedFarmModal] = useState<any | null>(null);

  // Ticket chat modal state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [adminNoteInput, setAdminNoteInput] = useState('');

  // Add Farm modal state
  const [isAddFarmOpen, setIsAddFarmOpen] = useState(false);
  const [newFarmOwner, setNewFarmOwner] = useState('');
  const [newFarmPhone, setNewFarmPhone] = useState('');
  const [newFarmLocation, setNewFarmLocation] = useState('');
  const [newFarmChickens, setNewFarmChickens] = useState(12);

  // Academy Form state
  const [isAddAcademyOpen, setIsAddAcademyOpen] = useState(false);
  const [acadTitle, setAcadTitle] = useState('');
  const [acadCategory, setAcadCategory] = useState<AcademyCategory>('Produksi Telur');
  const [acadDesc, setAcadDesc] = useState('');
  const [acadContent, setAcadContent] = useState('');
  const [acadType, setAcadType] = useState<'video' | 'article'>('article');
  const [acadVideoUrl, setAcadVideoUrl] = useState('');
  const [acadDuration, setAcadDuration] = useState('3 menit');
  const [acadThumbnail, setAcadThumbnail] = useState('https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80');

  // Settings local state
  const [localSettings, setLocalSettings] = useState(settings);

  // Filtered Farms
  const filteredFarms = farms.filter((f) => {
    const matchSearch =
      f.farmCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.ownerName && f.ownerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      f.location.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'all') return matchSearch;
    return matchSearch && f.status === statusFilter;
  });

  // Calculate high-level system metrics
  const totalFarms = farms.length;
  const activeFarms = farms.filter((f) => f.status === 'active' || f.status === 'warning' || f.status === 'critical').length;
  const totalChickens = farms.reduce((acc, f) => acc + (f.activeChickens || 0), 0);
  
  // Today's total eggs across all farms
  const todayReports = allReports.filter((r) => r.date === '2026-08-31');
  const totalTodayEggs = todayReports.reduce((acc, r) => acc + r.eggCount, 0);
  const avgProductivity = totalChickens > 0 && todayReports.length > 0
    ? Math.round((totalTodayEggs / (todayReports.length * 12)) * 100)
    : 81;

  const handleContactMember = (name: string, phone: string) => {
    showToast(`📱 Menghubungi ${name} (${phone}) via WhatsApp...`);
  };

  const handleCreateFarm = (e: React.FormEvent) => {
    e.preventDefault();
    createFarm({
      ownerName: newFarmOwner.trim(),
      phone: newFarmPhone.trim(),
      location: newFarmLocation.trim() || 'Jakarta, Indonesia',
      initialChickens: newFarmChickens,
      activeChickens: newFarmChickens,
      chickenBreed: 'Layer Lohmann Brown Petelur Unggul',
      initialAgeWeeks: 18,
      currentAgeWeeks: 18,
      warrantyEnd: '30 Hari setelah aktivasi',
      photoUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1000&q=80',
    });
    setIsAddFarmOpen(false);
    setNewFarmOwner('');
    setNewFarmPhone('');
    setNewFarmLocation('');
  };

  const handleSaveAcademy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acadTitle.trim() || !acadContent.trim()) {
      showToast('Judul dan konten wajib diisi');
      return;
    }
    createAcademyContent({
      title: acadTitle,
      category: acadCategory,
      description: acadDesc,
      content: acadContent,
      type: acadType,
      videoUrl: acadType === 'video' ? acadVideoUrl : undefined,
      duration: acadDuration,
      thumbnail: acadThumbnail,
      published: true,
    });
    setIsAddAcademyOpen(false);
    setAcadTitle('');
    setAcadDesc('');
    setAcadContent('');
  };

  const handleSendTicketReply = () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    replyTicketMessage(selectedTicket.id, replyMessage.trim(), 'veterinarian');
    setReplyMessage('');
    // refresh modal
    const updated = tickets.find((t) => t.id === selectedTicket.id);
    if (updated) setSelectedTicket(updated);
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-16 animate-in fade-in duration-200">
      {/* Admin Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1B3022] text-[#FDFBF7] p-6 md:p-8 rounded-3xl shadow-xl border border-[#2D4A36]">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#D4AF37] text-[#1B3022] text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-['Outfit']">
              ADMINISTRATOR
            </span>
            <span className="text-xs text-[#EAF2EC]/80">Pusat Manajemen Jaringan Peternakan</span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold font-['Outfit'] tracking-tight mt-1 text-[#FDFBF7]">
            EGGNEST CONTROL CENTER
          </h1>
          <p className="text-[#EAF2EC]/90 text-xs md:text-sm font-medium mt-1">
            Monitoring seluruh kandang aktif, sistem peringatan dini, manajemen tiket bantuan, dan edukasi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActivePage('beranda');
            }}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-[#FDFBF7] font-bold text-xs rounded-xl border border-white/20 transition-colors self-start sm:self-auto cursor-pointer"
          >
            ← Buka Dashboard Member
          </button>
        </div>
      </div>

      {/* 6 Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <div className="bg-white p-4 md:p-5 rounded-3xl border border-[#EFECE6] shadow-xs">
          <span className="text-[11px] text-stone-500 font-bold uppercase tracking-wider block">
            Total Kandang
          </span>
          <div className="text-2xl lg:text-3xl font-black text-[#1B3022] font-['Outfit'] mt-1">
            {totalFarms}
          </div>
          <span className="text-[10px] text-[#2D4A36] font-semibold block mt-0.5">
            {activeFarms} Kandang Aktif
          </span>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-3xl border border-[#EFECE6] shadow-xs">
          <span className="text-[11px] text-stone-500 font-bold uppercase tracking-wider block">
            Populasi Ayam
          </span>
          <div className="text-2xl lg:text-3xl font-black text-[#1B3022] font-['Outfit'] mt-1">
            {totalChickens}
          </div>
          <span className="text-[10px] text-stone-500 font-medium block mt-0.5">
            Ekor Terdaftar
          </span>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-3xl border border-[#EFECE6] shadow-xs">
          <span className="text-[11px] text-stone-500 font-bold uppercase tracking-wider block">
            Produksi Hari Ini
          </span>
          <div className="text-2xl lg:text-3xl font-black text-[#2D4A36] font-['Outfit'] mt-1">
            {totalTodayEggs}
          </div>
          <span className="text-[10px] text-[#2D4A36] font-semibold block mt-0.5">
            Butir Telur
          </span>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-3xl border border-[#EFECE6] shadow-xs">
          <span className="text-[11px] text-stone-500 font-bold uppercase tracking-wider block">
            Produktivitas
          </span>
          <div className="text-2xl lg:text-3xl font-black text-[#1B3022] font-['Outfit'] mt-1">
            {avgProductivity}%
          </div>
          <span className="text-[10px] text-[#1B3022] bg-[#EAF2EC] border border-[#CDE3D3] px-1.5 py-0.2 rounded font-bold inline-block mt-0.5">
            Rata-rata Normal
          </span>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-3xl border border-[#EFECE6] shadow-xs">
          <span className="text-[11px] text-stone-500 font-bold uppercase tracking-wider block">
            Smart Alerts
          </span>
          <div className="text-2xl lg:text-3xl font-black text-rose-600 font-['Outfit'] mt-1">
            {adminAlerts.filter((a) => !a.resolved).length}
          </div>
          <span className="text-[10px] text-rose-700 font-bold block mt-0.5">
            Perlu Tindakan
          </span>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-3xl border border-[#EFECE6] shadow-xs">
          <span className="text-[11px] text-stone-500 font-bold uppercase tracking-wider block">
            Tiket Terbuka
          </span>
          <div className="text-2xl lg:text-3xl font-black text-[#78350F] font-['Outfit'] mt-1">
            {tickets.filter((t) => t.status !== 'Selesai').length}
          </div>
          <span className="text-[10px] text-[#78350F] font-bold block mt-0.5">
            Konsultasi Aktif
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar border-b border-[#EFECE6] pb-2 w-full">
        {[
          { id: 'kandang', label: 'Kandang & Member', icon: Warehouse, count: farms.length },
          { id: 'alerts', label: 'Smart Alerts', icon: ShieldAlert, count: adminAlerts.filter((a) => !a.resolved).length },
          { id: 'tickets', label: 'Tiket Bantuan', icon: Headphones, count: tickets.filter((t) => t.status !== 'Selesai').length },
          { id: 'academy', label: 'Academy', icon: BookOpen, count: academyContents.length },
          { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#1B3022] text-[#FDFBF7] shadow-sm'
                  : 'bg-white text-stone-600 hover:bg-[#FAF7F2] border border-[#EFECE6]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-[#D4AF37]' : 'text-stone-500'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-[#D4AF37] text-[#1B3022]' : 'bg-[#FAF7F2] text-stone-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: MANAJEMEN KANDANG & MEMBER */}
      {activeTab === 'kandang' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#EFECE6] shadow-xs p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[#1B3022] font-['Outfit']">
                Daftar Seluruh Kandang Mitra
              </h3>
              <p className="text-xs text-stone-500">
                Menampilkan {filteredFarms.length} kandang terdaftar dalam sistem
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative w-full sm:w-auto">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari Farm ID / Pemilik..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl border border-[#EFECE6] text-xs font-semibold focus:ring-2 focus:ring-[#2D4A36] outline-none w-full sm:w-52 bg-white"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#EFECE6] overflow-x-auto no-scrollbar w-full sm:w-auto">
                {(['all', 'active', 'warning', 'critical', 'unclaimed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      statusFilter === st ? 'bg-[#1B3022] text-[#FDFBF7] shadow-xs' : 'text-stone-600'
                    }`}
                  >
                    {st === 'all' ? 'Semua' : st}
                  </button>
                ))}
              </div>

              {/* Add Farm Button */}
              <button
                onClick={() => setIsAddFarmOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#2D4A36] hover:bg-[#1B3022] text-[#FDFBF7] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <span>+ Buat Farm ID Baru</span>
              </button>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {filteredFarms.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-xl border border-[#EFECE6] bg-[#FAF7F2] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="bg-white px-2.5 py-1 rounded-lg border border-[#EFECE6] font-black text-xs text-[#1B3022] font-['Outfit']">
                    {f.farmCode}
                  </span>
                  {f.status === 'active' ? (
                    <span className="text-[11px] font-bold text-[#1B3022] bg-[#EAF2EC] border border-[#CDE3D3] px-2.5 py-0.5 rounded-full">
                      🟢 Aktif
                    </span>
                  ) : f.status === 'warning' ? (
                    <span className="text-[11px] font-bold text-[#78350F] bg-[#FEF6E9] border border-[#FDE68A] px-2.5 py-0.5 rounded-full">
                      🟡 Warning
                    </span>
                  ) : f.status === 'critical' ? (
                    <span className="text-[11px] font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full">
                      🔴 Kritis
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full">
                      ⚪ Siap Registrasi
                    </span>
                  )}
                </div>

                <div>
                  <div className="font-bold text-sm text-stone-800">
                    {f.ownerName || <span className="text-stone-400 italic">Belum Diaktivasi</span>}
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">{f.location}</div>
                  <div className="text-xs font-semibold text-[#2D4A36] mt-1">
                    {f.activeChickens} ekor ({f.currentAgeWeeks} mgg)
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E1D8]">
                  {f.userId && (
                    <button
                      onClick={() => impersonateFarm(f.id)}
                      className="px-3 py-1.5 bg-[#EAF2EC] hover:bg-[#CDE3D3] text-[#1B3022] font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Buka Dashboard</span>
                    </button>
                  )}
                  {f.phone && (
                    <button
                      onClick={() => handleContactMember(f.ownerName, f.phone)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm min-w-[580px]">
              <thead>
                <tr className="border-b border-[#EFECE6] text-stone-500 text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-3">Farm ID</th>
                  <th className="py-3.5 px-3">Pemilik Kandang</th>
                  <th className="py-3.5 px-3">Lokasi</th>
                  <th className="py-3.5 px-3">Ayam Aktif</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6]">
                {filteredFarms.map((f) => (
                  <tr key={f.id} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="py-4 px-3 font-black text-[#1B3022] font-['Outfit']">
                      <span className="bg-[#FAF7F2] px-2 py-1 rounded-lg border border-[#EFECE6]">
                        {f.farmCode}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <div className="font-bold text-stone-800">
                        {f.ownerName || <span className="text-stone-400 italic">Belum Diaktivasi</span>}
                      </div>
                      <div className="text-xs text-stone-500">{f.phone || '-'}</div>
                    </td>
                    <td className="py-4 px-3 text-stone-600 text-xs">{f.location}</td>
                    <td className="py-4 px-3 font-semibold text-stone-700">
                      {f.activeChickens} ekor ({f.currentAgeWeeks} mgg)
                    </td>
                    <td className="py-4 px-3">
                      {f.status === 'active' ? (
                        <span className="text-xs font-bold text-[#1B3022] bg-[#EAF2EC] border border-[#CDE3D3] px-2.5 py-1 rounded-full">
                          🟢 Aktif
                        </span>
                      ) : f.status === 'warning' ? (
                        <span className="text-xs font-bold text-[#78350F] bg-[#FEF6E9] border border-[#FDE68A] px-2.5 py-1 rounded-full">
                          🟡 Warning
                        </span>
                      ) : f.status === 'critical' ? (
                        <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-full">
                          🔴 Kritis
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
                          ⚪ Siap Registrasi
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {f.userId && (
                          <button
                            onClick={() => impersonateFarm(f.id)}
                            className="px-3 py-1.5 bg-[#EAF2EC] hover:bg-[#CDE3D3] text-[#1B3022] font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                            title="Buka tampilan dashboard member ini"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Buka</span>
                          </button>
                        )}
                        {f.phone && (
                          <button
                            onClick={() => handleContactMember(f.ownerName, f.phone)}
                            className="p-2 text-stone-600 hover:text-[#2D4A36] hover:bg-[#EAF2EC] rounded-xl transition-colors cursor-pointer"
                            title="Hubungi via WhatsApp"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SMART ALERTS */}
      {activeTab === 'alerts' && (
        <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-600" />
              <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit']">
                Peringatan Dini & Rule-Based Smart Alert
              </h3>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
              {adminAlerts.filter((a) => !a.resolved).length} Aktif
            </span>
          </div>

          <div className="space-y-3">
            {adminAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 md:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                  alert.resolved
                    ? 'bg-[#FAF7F2] border-[#EFECE6] opacity-60'
                    : alert.severity === 'critical'
                    ? 'bg-rose-50/80 border-rose-200'
                    : 'bg-[#FEF6E9] border-[#FDE68A]'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <span className="text-2xl shrink-0">
                    {alert.severity === 'critical' ? '🔴' : '🟡'}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-base font-black text-[#1B3022] font-['Outfit']">
                        {alert.farmCode}
                      </strong>
                      <span className="text-xs text-stone-500 font-semibold">
                        ({alert.ownerName})
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[#1B3022] mt-0.5">{alert.title}</h4>
                    <p className="text-xs text-stone-600 mt-0.5 leading-snug">{alert.description}</p>
                    <span className="text-[10px] text-stone-400 mt-1 block">Waktu: {alert.createdAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!alert.resolved ? (
                    <>
                      <button
                        onClick={() => handleContactMember(alert.ownerName, '0812-XXXX-XXXX')}
                        className="px-4 py-2 bg-white hover:bg-[#FAF7F2] border border-[#EFECE6] text-[#1B3022] font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        {alert.actionText}
                      </button>
                      <button
                        onClick={() => resolveAdminAlert(alert.id)}
                        className="px-4 py-2 bg-[#2D4A36] hover:bg-[#1B3022] text-[#FDFBF7] font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Tandai Selesai
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-[#1B3022] bg-[#EAF2EC] border border-[#CDE3D3] px-3 py-1 rounded-xl">
                      ✓ Selesai Ditangani
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TIKET BANTUAN */}
      {activeTab === 'tickets' && (
        <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit']">
                Manajemen Tiket Bantuan & Konsultasi
              </h3>
              <p className="text-xs text-stone-500">
                Kelola keluhan, pertanyaan pakan, dan klaim garansi member
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="p-5 rounded-2xl border border-[#EFECE6] hover:border-[#D9D4C7] bg-[#FAF7F2] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-[#1B3022] bg-white px-2 py-0.5 rounded border border-[#EFECE6]">
                      #{t.ticketCode}
                    </span>
                    <span className="text-xs font-bold text-[#2D4A36]">Farm ID: {t.farmCode}</span>
                    <span className="text-xs text-stone-500">({t.ownerName})</span>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        t.status === 'Selesai'
                          ? 'bg-[#EAF2EC] text-[#1B3022] border border-[#CDE3D3]'
                          : t.status === 'Solusi Diberikan'
                          ? 'bg-[#FEF6E9] text-[#78350F] border border-[#FDE68A]'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-[#1B3022]">{t.category}</h4>
                  <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">{t.description}</p>
                  <span className="text-[10px] text-stone-400 block">Dibuat: {t.createdAt}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedTicket(t)}
                    className="px-4 py-2.5 bg-[#1B3022] text-[#FDFBF7] font-bold text-xs rounded-xl hover:bg-[#2D4A36] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Balas & Update Status</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: EGGNEST ACADEMY MANAGEMENT */}
      {activeTab === 'academy' && (
        <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit']">
                Manajemen Konten Eggnest Academy
              </h3>
              <p className="text-xs text-stone-500">
                Kelola materi artikel dan video edukasi untuk seluruh member kandang
              </p>
            </div>
            <button
              onClick={() => setIsAddAcademyOpen(true)}
              className="px-4 py-2.5 bg-[#2D4A36] hover:bg-[#1B3022] text-[#FDFBF7] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>+ Tambah Materi Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {academyContents.map((a) => (
              <div
                key={a.id}
                className="p-5 rounded-2xl border border-[#EFECE6] bg-[#FAF7F2] flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold bg-[#EAF2EC] text-[#1B3022] px-2 py-0.5 rounded-full border border-[#CDE3D3]">
                      {a.category}
                    </span>
                    <span
                      onClick={() => togglePublishAcademy(a.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${
                        a.published ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {a.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#1B3022] font-['Outfit']">{a.title}</h4>
                  <p className="text-xs text-stone-600 mt-1 line-clamp-2">{a.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#EFECE6] text-xs">
                  <span className="text-stone-400 font-mono text-[10px]">{a.type.toUpperCase()}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => deleteAcademyContent(a.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Hapus materi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PENGATURAN SISTEM & DATABASE */}
      {activeTab === 'pengaturan' && (
        <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-8 space-y-8">
          <div>
            <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit']">
              Pengaturan Bisnis & Sistem
            </h3>
            <p className="text-xs text-stone-500">
              Konfigurasi harga acuan telur, parameter ambang batas alert, dan reset database
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">
                Harga Acuan Telur Segar / Kg (IDR)
              </label>
              <input
                type="number"
                value={localSettings.eggPricePerKg}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, eggPricePerKg: Number(e.target.value) })
                }
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#EFECE6] rounded-2xl text-sm font-bold text-[#1B3022]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">
                Jumlah Butir Telur per Kg
              </label>
              <input
                type="number"
                value={localSettings.eggsPerKg}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, eggsPerKg: Number(e.target.value) })
                }
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#EFECE6] rounded-2xl text-sm font-bold text-[#1B3022]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">
                Threshold Penurunan Produksi Warning (%)
              </label>
              <input
                type="number"
                value={localSettings.warningDropThreshold}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, warningDropThreshold: Number(e.target.value) })
                }
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#EFECE6] rounded-2xl text-sm font-bold text-[#1B3022]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">
                Threshold Penurunan Produksi Kritis (%)
              </label>
              <input
                type="number"
                value={localSettings.criticalDropThreshold}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, criticalDropThreshold: Number(e.target.value) })
                }
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#EFECE6] rounded-2xl text-sm font-bold text-[#1B3022]"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700">
                Nomor Hotline WhatsApp Bantuan Resmi
              </label>
              <input
                type="text"
                value={localSettings.whatsappSupportNumber}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, whatsappSupportNumber: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#EFECE6] rounded-2xl text-sm font-bold text-[#1B3022]"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-start">
            <button
              onClick={() => updateSettings(localSettings)}
              className="px-6 py-3 bg-[#1B3022] hover:bg-[#2D4A36] text-[#FDFBF7] font-black text-sm rounded-2xl shadow-md cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-[#D4AF37]" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>

          {/* Database Demo Utilities */}
          <div className="pt-6 border-t border-[#EFECE6] space-y-4">
            <h4 className="text-base font-bold text-[#1B3022] font-['Outfit']">
              Utilitas Database & Pengujian
            </h4>
            <p className="text-xs text-stone-500">
              Gunakan opsi ini untuk menguji state kosong (empty states) atau memuat dataset demo lengkap.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadDemoDatabase}
                className="px-4 py-2.5 bg-[#EAF2EC] hover:bg-[#CDE3D3] text-[#1B3022] font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer border border-[#CDE3D3]"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#2D4A36]" />
                <span>Muat Ulang Data Demo Lengkap</span>
              </button>
              <button
                onClick={resetToCleanDatabase}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer border border-rose-200"
              >
                <Database className="w-3.5 h-3.5 text-rose-600" />
                <span>Kosongkan Database (Uji Empty State)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD FARM ID */}
      {isAddFarmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#EFECE6] w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
              <h3 className="text-lg font-bold text-[#1B3022] font-['Outfit']">
                Buat Farm ID / Paket Baru
              </h3>
              <button
                onClick={() => setIsAddFarmOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateFarm} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Nama Pemilik (Opsional jika belum diklaim)
                </label>
                <input
                  type="text"
                  value={newFarmOwner}
                  onChange={(e) => setNewFarmOwner(e.target.value)}
                  placeholder="Kosongkan untuk Farm ID unclaimed"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EFECE6] rounded-xl text-sm font-semibold text-[#1B3022]"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">No. WhatsApp</label>
                <input
                  type="tel"
                  value={newFarmPhone}
                  onChange={(e) => setNewFarmPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EFECE6] rounded-xl text-sm font-semibold text-[#1B3022]"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">Lokasi Kandang</label>
                <input
                  type="text"
                  value={newFarmLocation}
                  onChange={(e) => setNewFarmLocation(e.target.value)}
                  placeholder="Contoh: Depok, Jawa Barat"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EFECE6] rounded-xl text-sm font-semibold text-[#1B3022]"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">Kapasitas Ayam</label>
                <input
                  type="number"
                  value={newFarmChickens}
                  onChange={(e) => setNewFarmChickens(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EFECE6] rounded-xl text-sm font-semibold text-[#1B3022]"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddFarmOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1B3022] hover:bg-[#2D4A36] text-white font-bold rounded-xl shadow-xs"
                >
                  Generate Farm ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TICKET CHAT / REPLY */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#EFECE6] w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-[#D4AF37] bg-[#1B3022] px-2 py-0.5 rounded">
                  #{selectedTicket.ticketCode}
                </span>
                <h3 className="text-lg font-bold text-[#1B3022] font-['Outfit'] mt-1">
                  {selectedTicket.title || selectedTicket.category}
                </h3>
                <span className="text-xs text-stone-500 font-medium">
                  {selectedTicket.ownerName} ({selectedTicket.farmCode})
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            {/* Chat Thread */}
            <div className="max-h-72 overflow-y-auto space-y-3 p-3 bg-[#FAF7F2] rounded-2xl border border-[#EFECE6]">
              {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                selectedTicket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3.5 rounded-2xl text-xs max-w-[85%] ${
                      msg.senderRole === 'member'
                        ? 'bg-white border border-[#EFECE6] self-start mr-auto text-stone-800'
                        : 'bg-[#1B3022] text-[#FDFBF7] self-end ml-auto'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 font-bold text-[10px] mb-1 opacity-80">
                      <span>{msg.senderName} ({msg.senderRole})</span>
                      <span>{msg.createdAt}</span>
                    </div>
                    <p className="leading-relaxed">{msg.message}</p>
                    {msg.attachmentUrl && (
                      <img
                        src={msg.attachmentUrl}
                        alt="Attachment"
                        className="mt-2 rounded-xl max-h-36 object-cover"
                      />
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-500 p-3">{selectedTicket.description}</p>
              )}
            </div>

            {/* Status Selector */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-bold text-stone-700">Ubah Status Tiket:</span>
              <div className="flex gap-1.5">
                {(['Diterima', 'Diproses', 'Solusi Diberikan', 'Selesai'] as SupportStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => updateTicketStatus(selectedTicket.id, st)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                        selectedTicket.status === st
                          ? 'bg-[#1B3022] text-[#FDFBF7]'
                          : 'bg-[#FAF7F2] border border-[#EFECE6] text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Reply Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Ketik instruksi / saran dokter hewan..."
                className="flex-1 px-4 py-3 bg-[#FAF7F2] border border-[#EFECE6] rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2D4A36] focus:bg-white"
              />
              <button
                onClick={handleSendTicketReply}
                className="px-5 py-3 bg-[#2D4A36] hover:bg-[#1B3022] text-[#FDFBF7] font-bold text-xs rounded-2xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Solusi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD ACADEMY */}
      {isAddAcademyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#EFECE6] w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
              <h3 className="text-lg font-bold text-[#1B3022] font-['Outfit']">
                Tambah Materi Academy Baru
              </h3>
              <button
                onClick={() => setIsAddAcademyOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveAcademy} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Judul Materi</label>
                <input
                  type="text"
                  required
                  value={acadTitle}
                  onChange={(e) => setAcadTitle(e.target.value)}
                  placeholder="Contoh: Mengatur Ventilasi Saat Cuaca Panas"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EFECE6] rounded-xl text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Kategori</label>
                  <select
                    value={acadCategory}
                    onChange={(e) => setAcadCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#EFECE6] rounded-xl text-xs font-semibold"
                  >
                    <option value="Produksi Telur">Produksi Telur</option>
                    <option value="Pakan">Pakan</option>
                    <option value="Kesehatan Ayam">Kesehatan Ayam</option>
                    <option value="Air Minum">Air Minum</option>
                    <option value="Kebersihan Kandang">Kebersihan Kandang</option>
                    <option value="Permasalahan Umum">Permasalahan Umum</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Tipe Media</label>
                  <select
                    value={acadType}
                    onChange={(e) => setAcadType(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#EFECE6] rounded-xl text-xs font-semibold"
                  >
                    <option value="article">Artikel Bacaan</option>
                    <option value="video">Video Praktis</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  value={acadDesc}
                  onChange={(e) => setAcadDesc(e.target.value)}
                  placeholder="Penjelasan ringkas 1-2 kalimat"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EFECE6] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Isi Panduan Lengkap</label>
                <textarea
                  rows={4}
                  required
                  value={acadContent}
                  onChange={(e) => setAcadContent(e.target.value)}
                  placeholder="Ketik langkah-langkah praktis dan panduan..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EFECE6] rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAcademyOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1B3022] hover:bg-[#2D4A36] text-white font-bold rounded-xl shadow-xs"
                >
                  Publish Materi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
