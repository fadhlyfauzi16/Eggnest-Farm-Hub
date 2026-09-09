import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
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
  Upload,
  Download,
  FileSpreadsheet,
  MapPin,
  Users,
  KeyRound,
} from 'lucide-react';
import { SupportStatus, SupportTicket, AcademyCategory } from '../types';


const getTicketStatusClasses = (status?: string): string => {
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
    toggleRecommendAcademy,
    settings,
    updateSettings,
    resetToCleanDatabase,
    loadDemoDatabase,
    showToast,
  } = useFarm();

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const initialAdminTab =
    requestedTab === 'mitra' ||
    requestedTab === 'sales' ||
    requestedTab === 'alerts' ||
    requestedTab === 'tickets' ||
    requestedTab === 'academy' ||
    requestedTab === 'pengaturan'
      ? requestedTab
      : 'kandang';

  const [activeTab, setActiveTab] = useState<'kandang' | 'mitra' | 'sales' | 'alerts' | 'tickets' | 'academy' | 'pengaturan'>(
    initialAdminTab
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'mitra' || tab === 'sales' || tab === 'alerts' || tab === 'tickets' || tab === 'academy' || tab === 'pengaturan') {
      setActiveTab(tab);
    } else {
      setActiveTab('kandang');
    }
  }, [searchParams]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'warning' | 'critical' | 'unclaimed'>('all');
  const [partners, setPartners] = useState<any[]>([]);
  const [provinceFilter, setProvinceFilter] = useState('all');
  const [regencyFilter, setRegencyFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [villageFilter, setVillageFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [partnerForm, setPartnerForm] = useState<any>({ partnerCode:'', name:'', phone:'', password:'' });
  const [savingPartner, setSavingPartner] = useState(false);
  const [selectedFarmModal, setSelectedFarmModal] = useState<any | null>(null);
  const [selectedReportPhoto, setSelectedReportPhoto] = useState<any | null>(null);
  const [eggSales, setEggSales] = useState<any[]>([]);
  const [salesSummary, setSalesSummary] = useState<any>({ transactionCount:0,totalEggs:0,totalWeightKg:0,totalAmount:0,averagePricePerKg:0 });
  const [salesMonth, setSalesMonth] = useState(
    new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Jakarta', year:'numeric', month:'2-digit' }).format(new Date()).slice(0,7)
  );
  const [salesFarmFilter, setSalesFarmFilter] = useState('all');

  const loadEggSales = async (month = salesMonth, farmId = salesFarmFilter) => {
    try {
      const res = await api.getEggSales({ month, farmId: farmId === 'all' ? undefined : farmId });
      setEggSales(res.sales || []);
      setSalesSummary(res.summary || {});
    } catch (e:any) {
      showToast(e?.message || 'Gagal memuat penjualan telur.');
    }
  };

  useEffect(() => {
    if (activeTab === 'sales') loadEggSales();
  }, [activeTab, salesMonth, salesFarmFilter]);


  // Ticket chat modal state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [adminNoteInput, setAdminNoteInput] = useState('');

  // Add Farm modal state
  const [isAddFarmOpen, setIsAddFarmOpen] = useState(false);
  const [newFarmCode, setNewFarmCode] = useState('');
  const [newFarmOwner, setNewFarmOwner] = useState('');
  const [newFarmPhone, setNewFarmPhone] = useState('');
  const [newFarmLocation, setNewFarmLocation] = useState('');
  const [newFarmChickens, setNewFarmChickens] = useState(12);
  const [newFarmPartnerId, setNewFarmPartnerId] = useState('');

  // Excel import / export
  type ImportType = 'members' | 'farms' | 'chickens' | 'reports';
  type ExportType = 'members' | 'farms' | 'chickens' | 'reports' | 'scores' | 'tickets';
  const [importType, setImportType] = useState<ImportType>('farms');
  const [exportType, setExportType] = useState<ExportType>('farms');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
  const [acadVideoFile, setAcadVideoFile] = useState<File | null>(null);
  const [acadThumbnailFile, setAcadThumbnailFile] = useState<File | null>(null);
  const [isUploadingAcademy, setIsUploadingAcademy] = useState(false);
  const [acadPublishNow, setAcadPublishNow] = useState(true);

  // Settings local state
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    api.getPartners().then((r) => setPartners(r.partners || [])).catch(() => setPartners([]));
  }, []);

  const refreshPartners = async () => { const r = await api.getPartners(); setPartners(r.partners || []); };

  // Normalize backend farm rows so admin UI supports snake_case and camelCase safely
  const normalizedFarms = farms.map((farm: any) => ({
    ...farm,
    farmCode: String(farm.farmCode ?? farm.farm_code ?? ''),
    ownerName: String(farm.ownerName ?? farm.owner_name ?? ''),
    phone: String(farm.phone ?? ''),
    location: String(farm.location ?? ''),
    province: String(farm.province ?? ''), regency: String(farm.regency ?? ''), district: String(farm.district ?? ''), village: String(farm.village ?? ''),
    partnerId: farm.partnerId ?? farm.partner_id ?? null, partnerCode: String(farm.partnerCode ?? farm.partner_code ?? ''), partnerName: String(farm.partnerName ?? farm.partner_name ?? ''),
    status: farm.status ?? 'unclaimed',
    activeChickens: Number(farm.activeChickens ?? farm.active_chickens ?? 0),
    currentAgeWeeks: Number(farm.currentAgeWeeks ?? farm.current_age_weeks ?? 0),
    userId: farm.userId ?? farm.ownerUserId ?? farm.owner_user_id ?? null,
  }));

  // Filtered Farms
  const normalizedSearch = String(searchQuery ?? '').trim().toLowerCase();
  const filteredFarms = normalizedFarms.filter((f) => {
    const matchSearch =
      f.farmCode.toLowerCase().includes(normalizedSearch) ||
      f.ownerName.toLowerCase().includes(normalizedSearch) ||
      f.location.toLowerCase().includes(normalizedSearch);

    const matchStatus = statusFilter === 'all' || f.status === statusFilter;
    const matchProvince = provinceFilter === 'all' || f.province === provinceFilter;
    const matchRegency = regencyFilter === 'all' || f.regency === regencyFilter;
    const matchDistrict = districtFilter === 'all' || f.district === districtFilter;
    const matchVillage = villageFilter === 'all' || f.village === villageFilter;
    const matchPartner = partnerFilter === 'all' || (partnerFilter === 'none' ? !f.partnerId : f.partnerId === partnerFilter);
    return matchSearch && matchStatus && matchProvince && matchRegency && matchDistrict && matchVillage && matchPartner;
  });

  // Calculate high-level system metrics
  const totalFarms = normalizedFarms.length;
  const activeFarms = normalizedFarms.filter(
    (f) => f.status === 'active' || f.status === 'warning' || f.status === 'critical'
  ).length;
  const totalChickens = normalizedFarms.reduce((acc, f) => acc + (f.activeChickens || 0), 0);

  // Today's production - no fabricated fallback value
  const todayKey = new Date().toLocaleDateString('en-CA');
  const todayReports = allReports.filter((r: any) => String(r.date ?? r.report_date ?? '') === todayKey);
  const totalTodayEggs = todayReports.reduce((acc: number, r: any) => acc + Number(r.eggCount ?? r.egg_count ?? 0), 0);
  const avgProductivity =
    totalChickens > 0 && todayReports.length > 0
      ? Math.round(
          todayReports.reduce(
            (acc: number, r: any) => acc + Number(r.productivityRate ?? r.productivity_rate ?? 0),
            0
          ) / todayReports.length
        )
      : 0;

  const handleContactMember = (name: string, phone: string) => {
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      showToast(`⚠️ Nomor WhatsApp ${name || 'Member'} belum tersedia.`);
      return;
    }

    const waNumber = cleanPhone.startsWith('0')
      ? `62${cleanPhone.slice(1)}`
      : cleanPhone.startsWith('62')
        ? cleanPhone
        : cleanPhone;

    const message = encodeURIComponent(
      `Halo ${name || 'Member'}, kami dari Admin Eggnest Farm Hub ingin menindaklanjuti kondisi kandang Anda.`
    );
    window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const findFarmForAlert = (alert: any) =>
    normalizedFarms.find(
      (farm: any) =>
        String(farm.id) === String(alert?.farmId ?? alert?.farm_id ?? '') ||
        String(farm.farmCode) === String(alert?.farmCode ?? alert?.farm_code ?? '')
    );

  const handleContactAlertMember = (alert: any) => {
    const farm = findFarmForAlert(alert);
    handleContactMember(
      farm?.ownerName || alert?.ownerName || 'Member',
      farm?.phone || ''
    );
  };

  const handleOpenAlertFarm = (alert: any) => {
    const farm = findFarmForAlert(alert);
    if (!farm) {
      showToast('⚠️ Data Farm ID untuk alert ini tidak ditemukan.');
      return;
    }
    setSelectedFarmModal(farm);
  };

  const uniqueValues = (key: 'province'|'regency'|'district'|'village') => Array.from(new Set(normalizedFarms.map((f:any)=>String(f[key]||'')).filter(Boolean))).sort();



  const makePartnerCode = (name: string) => {
    const words = String(name || '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean);
    const base = (words.length > 1 ? words.map((w) => w[0]).join('') : (words[0] || 'MITRA').slice(0, 6)).slice(0, 6);
    return `MTR-${base || 'MITRA'}`;
  };

  const openFarmMap = (f: any) => {
    const lat = Number(f?.latitude);
    const lng = Number(f?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      showToast('⚠️ Lokasi GPS Member belum tersimpan.');
      return;
    }
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank', 'noopener,noreferrer');
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingPartner(true);
      const payload = {
        ...partnerForm,
        partnerCode: String(partnerForm.partnerCode || makePartnerCode(partnerForm.name)).trim().toUpperCase(),
      };
      const r = await api.createPartner(payload);
      showToast(r.message);
      setPartnerForm({ partnerCode:'', name:'', phone:'', password:'' });
      await refreshPartners();
    } catch(err:any) {
      showToast(err?.message || 'Gagal membuat Mitra Marketing');
    } finally {
      setSavingPartner(false);
    }
  };

  const handleDeletePartner = async (p:any) => {
    if(!window.confirm(`Hapus Mitra Marketing ${p.name}?`)) return;
    try { const r=await api.deletePartner(p.id); showToast(r.message); await refreshPartners(); } catch(err:any){ showToast(err?.message || 'Gagal menghapus Mitra Marketing'); }
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newFarmPartnerId) {
        showToast('⚠️ Pilih Mitra Marketing untuk Member ini terlebih dahulu.');
        return;
      }
      const res = await api.createFarm({
        farmCode: newFarmCode.trim() || undefined,
        ownerName: newFarmOwner.trim(),
        phone: newFarmPhone.trim(),
        location: 'Lokasi menunggu GPS Member',
        initialChickens: newFarmChickens,
        chickenBreed: 'Layer Lohmann Brown Petelur Unggul',
        initialAgeWeeks: 18,
        partnerId: newFarmPartnerId,
      });

      showToast(`${res.message} Kode aktivasi: ${String((res.farm as any)?.farmCode ?? (res.farm as any)?.farm_code ?? '')}`);
      setIsAddFarmOpen(false);
      setNewFarmCode('');
      setNewFarmOwner('');
      setNewFarmPhone('');
      setNewFarmLocation('');
      setNewFarmPartnerId('');
      window.setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      showToast(err?.message || 'Gagal membuat Farm ID');
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await api.downloadExportExcel(exportType, { province: provinceFilter, regency: regencyFilter, district: districtFilter, village: villageFilter, partnerId: partnerFilter });
      showToast(`Export ${exportType} berhasil diunduh`);
    } catch (err: any) {
      showToast(err?.message || 'Gagal export Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (file?: File) => {
    if (!file) return;
    try {
      setIsImporting(true);
      setImportResult(null);
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(firstSheet, { defval: '' });
      if (!rows.length) throw new Error('File Excel kosong atau tidak memiliki baris data.');
      const validation = await api.validateImport(importType, rows);
      setImportResult(validation);
    } catch (err: any) {
      showToast(err?.message || 'Gagal membaca / memvalidasi Excel');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCommitImport = async () => {
    if (!importResult?.preview?.length) return;
    try {
      setIsImporting(true);
      const res = await api.commitImport(importType, importResult.preview);
      showToast(res.message || `${res.importedCount} data berhasil diimport`);
      setIsImportOpen(false);
      setImportResult(null);
      window.setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      showToast(err?.message || 'Gagal menyimpan hasil import');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteFarm = async (farm: any) => {
    const code = String(farm.farmCode || farm.farm_code || '');
    const owner = String(farm.ownerName || farm.owner_name || '');
    const confirmation = window.prompt(
      `HAPUS FARM ${code}

${owner ? `Pemilik: ${owner}
` : ''}Data laporan, tiket, alert, dan akun member yang terhubung juga akan dihapus.

Ketik HAPUS untuk melanjutkan.`
    );
    if (confirmation !== 'HAPUS') return;

    try {
      const res = await api.deleteFarm(farm.id, true);
      showToast(res.message);
      window.setTimeout(() => window.location.reload(), 400);
    } catch (err: any) {
      showToast(err?.message || 'Gagal menghapus Farm ID');
    }
  };

  const handleSaveAcademy = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acadTitle.trim() || !acadContent.trim()) {
      showToast('Judul dan isi panduan wajib diisi');
      return;
    }

    if (acadType === 'video' && !acadVideoFile && !acadVideoUrl.trim()) {
      showToast('Pilih file video atau isi URL video terlebih dahulu');
      return;
    }

    // Begitu user klik Publish/Simpan, modal langsung ditutup.
    // Hasil upload/save akan tetap diproses di background dan ditampilkan lewat toast.
    setIsAddAcademyOpen(false);
    setIsUploadingAcademy(true);

    try {
      let finalVideoUrl = acadVideoUrl.trim();
      let finalThumbnail = acadThumbnail.trim();

      if (acadVideoFile) {
        const uploadedVideo = await api.uploadAcademyMedia(acadVideoFile, 'video');
        finalVideoUrl = uploadedVideo.url;
      }

      if (acadThumbnailFile) {
        const uploadedThumbnail = await api.uploadAcademyMedia(acadThumbnailFile, 'thumbnail');
        finalThumbnail = uploadedThumbnail.url;
      }

      await createAcademyContent({
        title: acadTitle.trim(),
        category: acadCategory,
        description: acadDesc.trim(),
        content: acadContent.trim(),
        type: acadType,
        videoUrl: acadType === 'video' ? finalVideoUrl : undefined,
        duration: acadDuration.trim() || '2 menit',
        thumbnail: finalThumbnail,
        published: acadPublishNow,
      });
    } catch (err: any) {
      showToast(err?.message || 'Gagal menyimpan materi Academy');
    } finally {
      setAcadTitle('');
      setAcadDesc('');
      setAcadContent('');
      setAcadType('article');
      setAcadVideoUrl('');
      setAcadVideoFile(null);
      setAcadThumbnailFile(null);
      setAcadDuration('3 menit');
      setAcadPublishNow(true);
      setIsUploadingAcademy(false);
    }
  };

  const handleSendTicketReply = () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    replyTicketMessage(selectedTicket.id, replyMessage.trim());
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
            <span className="text-xs text-[#EAF2EC]/80">Pusat Operasional & Penanganan Member</span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold font-['Outfit'] tracking-tight mt-1 text-[#FDFBF7]">
            EGGNEST CONTROL CENTER
          </h1>
          <p className="text-[#EAF2EC]/90 text-xs md:text-sm font-medium mt-1">
            Admin menerima laporan Member, menangani masalah kandang, membalas konsultasi, dan memantau seluruh Farm ID.
          </p>
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
          { id: 'kandang', label: 'Kandang & Member', icon: Warehouse, count: normalizedFarms.length },
          { id: 'mitra', label: 'Mitra Marketing', icon: Users, count: partners.length },
          { id: 'sales', label: 'Penjualan Telur', icon: Egg, count: eggSales.length },
          { id: 'alerts', label: 'Masalah Kandang', icon: ShieldAlert, count: adminAlerts.filter((a) => !a.resolved).length },
          { id: 'tickets', label: 'Tiket Bantuan', icon: Headphones, count: tickets.filter((t) => t.status !== 'Selesai').length },
          { id: 'academy', label: 'Academy', icon: BookOpen, count: academyContents.length },
          { id: 'pengaturan', label: 'Operasional', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                const nextTab = tab.id as 'kandang' | 'mitra' | 'sales' | 'alerts' | 'tickets' | 'academy' | 'pengaturan';
                setActiveTab(nextTab);
                if (nextTab === 'kandang') {
                  setSearchParams({});
                } else {
                  setSearchParams({ tab: nextTab });
                }
              }}
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

      {activeTab === 'mitra' && (
        <div className="space-y-5">
          <div className="bg-white rounded-3xl border border-[#EFECE6] p-5 sm:p-7">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5">
              <div>
                <span className="text-[10px] font-black tracking-wider text-[#2D4A36] bg-[#EAF2EC] border border-[#CDE3D3] px-2.5 py-1 rounded-full">AKUN MARKETING</span>
                <h3 className="text-xl font-black text-[#1B3022] mt-2">Buat Mitra Marketing</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-2xl">
                  Cukup buat kode, nama, WhatsApp dan password. Mitra bertugas mendapatkan Member, menyerahkan Farm ID, follow-up dan monitoring. Masalah teknis kandang tetap ditangani Admin.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreatePartner} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-black text-stone-500 uppercase">Kode Mitra</label>
                <input
                  required
                  value={partnerForm.partnerCode}
                  onChange={e=>setPartnerForm({...partnerForm,partnerCode:e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g,'')})}
                  placeholder={makePartnerCode(partnerForm.name || 'IGEM')}
                  className="mt-1 w-full p-3 rounded-xl border text-sm font-black tracking-wide"
                />
                <p className="text-[10px] text-stone-400 mt-1">Contoh: MTR-IGEM, MTR-ANDI</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-stone-500 uppercase">Nama Mitra</label>
                <input
                  required
                  value={partnerForm.name}
                  onChange={e=>setPartnerForm({...partnerForm,name:e.target.value,partnerCode:partnerForm.partnerCode || makePartnerCode(e.target.value)})}
                  placeholder="Nama Mitra Marketing"
                  className="mt-1 w-full p-3 rounded-xl border text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-stone-500 uppercase">WhatsApp / Login</label>
                <input required value={partnerForm.phone} onChange={e=>setPartnerForm({...partnerForm,phone:e.target.value})} placeholder="08xxxxxxxxxx" className="mt-1 w-full p-3 rounded-xl border text-sm"/>
              </div>
              <div>
                <label className="text-[10px] font-black text-stone-500 uppercase">Password Awal</label>
                <div className="relative mt-1"><KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-stone-400"/><input required minLength={6} type="password" value={partnerForm.password} onChange={e=>setPartnerForm({...partnerForm,password:e.target.value})} placeholder="Minimal 6 karakter" className="w-full pl-10 pr-3 py-3 rounded-xl border text-sm"/></div>
              </div>
              <button disabled={savingPartner} className="md:col-span-2 lg:col-span-4 p-3 rounded-xl bg-[#1B3022] hover:bg-[#2D4A36] text-white font-black text-sm">
                {savingPartner?'Menyimpan...':'+ Buat Akun Mitra Marketing'}
              </button>
            </form>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-black text-[#1B3022]">Daftar Mitra Marketing</h4>
                <p className="text-xs text-stone-500">Setiap kartu langsung menunjukkan jumlah Member yang menjadi tanggung jawab follow-up Mitra.</p>
              </div>
              <span className="text-xs font-black bg-[#EAF2EC] text-[#1B3022] px-3 py-1.5 rounded-full">{partners.length} Mitra</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {partners.map(p=><div key={p.id} className="bg-white rounded-3xl border border-[#EFECE6] p-5 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex text-[11px] font-black text-[#1B3022] bg-[#D4AF37]/25 border border-[#D4AF37]/50 px-2.5 py-1 rounded-lg tracking-wide">{p.partner_code}</div>
                    <div className="font-black text-lg text-stone-800 mt-2">{p.name}</div>
                    <div className="text-xs text-stone-500">{p.phone || '-'}</div>
                  </div>
                  <span className="h-fit text-xs font-black bg-[#EAF2EC] text-[#1B3022] px-3 py-1.5 rounded-full">{Number(p.member_count||0)} Member</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-[#FAF7F2] p-3"><span className="text-stone-400 text-[10px]">STATUS AKUN</span><div className="font-black mt-1">{p.account_status === 'active' ? '🟢 Aktif' : '⚪ Nonaktif'}</div></div>
                  <div className="rounded-xl bg-[#FAF7F2] p-3"><span className="text-stone-400 text-[10px]">PERAN</span><div className="font-black mt-1">Marketing & Follow-up</div></div>
                </div>
                <button onClick={()=>handleDeletePartner(p)} className="mt-4 text-xs font-bold text-rose-600">Hapus Mitra</button>
              </div>)}
              {!partners.length && <div className="text-sm text-stone-500">Belum ada Mitra Marketing.</div>}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: MANAJEMEN KANDANG & MEMBER */}
      {activeTab === 'kandang' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#EFECE6] shadow-xs p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[#1B3022] font-['Outfit']">
                Member & Farm ID
              </h3>
              <p className="text-xs text-stone-500">
                Setiap Member terikat ke satu Mitra Marketing. Lokasi kandang mengikuti GPS yang disimpan Member.
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

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value as ExportType)}
                  className="px-2.5 py-2.5 bg-white border border-[#EFECE6] rounded-xl text-xs font-bold text-stone-700"
                  title="Pilih data yang akan diexport"
                >
                  <option value="farms">Farm ID</option>
                  <option value="members">Member</option>
                  <option value="chickens">Ayam</option>
                  <option value="reports">Laporan</option>
                  <option value="scores">Farm Score</option>
                  <option value="tickets">Tiket</option>
                </select>
                <button
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="px-3 py-2.5 bg-white border border-[#CDE3D3] text-[#1B3022] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Export...' : 'Download Excel'}</span>
                </button>
                <button
                  onClick={() => {
                    setImportResult(null);
                    setIsImportOpen(true);
                  }}
                  className="px-3 py-2.5 bg-[#EAF2EC] border border-[#CDE3D3] text-[#1B3022] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Excel</span>
                </button>
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

          <div className="bg-[#FAF7F2] border border-[#EFECE6] rounded-2xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3 text-xs font-black text-[#1B3022]"><Filter className="w-4 h-4"/> FILTER WILAYAH & MITRA MARKETING</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <select value={provinceFilter} onChange={e=>setProvinceFilter(e.target.value)} className="p-2 rounded-xl border text-xs bg-white"><option value="all">Semua Provinsi</option>{uniqueValues('province').map(v=><option key={v} value={v}>{v}</option>)}</select>
              <select value={regencyFilter} onChange={e=>setRegencyFilter(e.target.value)} className="p-2 rounded-xl border text-xs bg-white"><option value="all">Semua Kab/Kota</option>{uniqueValues('regency').map(v=><option key={v} value={v}>{v}</option>)}</select>
              <select value={districtFilter} onChange={e=>setDistrictFilter(e.target.value)} className="p-2 rounded-xl border text-xs bg-white"><option value="all">Semua Kecamatan</option>{uniqueValues('district').map(v=><option key={v} value={v}>{v}</option>)}</select>
              <select value={villageFilter} onChange={e=>setVillageFilter(e.target.value)} className="p-2 rounded-xl border text-xs bg-white"><option value="all">Semua Desa/Kelurahan</option>{uniqueValues('village').map(v=><option key={v} value={v}>{v}</option>)}</select>
              <select value={partnerFilter} onChange={e=>setPartnerFilter(e.target.value)} className="p-2 rounded-xl border text-xs bg-white"><option value="all">Semua Mitra</option><option value="none">Belum Ada Mitra</option>{partners.map(p=><option key={p.id} value={p.id}>{p.partner_code} — {p.name}</option>)}</select>
            </div>
            <div className="mt-2 text-[11px] text-stone-500">Hasil filter: <b>{filteredFarms.length}</b> Farm ID. Filter ini membantu penarikan data per wilayah dan Mitra Marketing.</div>
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

                <div className="text-[11px] text-stone-600">{[f.village,f.district,f.regency,f.province].filter(Boolean).join(', ') || 'Wilayah belum dilengkapi'}</div>
                <div className="w-full p-2 rounded-lg bg-[#EAF2EC] border border-[#CDE3D3] text-xs font-black text-[#1B3022]">
                  {f.partnerCode ? `${f.partnerCode} — ${f.partnerName}` : 'Belum ada Mitra'}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E1D8]">
                  {f.userId && (
                    <button
                      onClick={() => setSelectedFarmModal(f)}
                      className="px-3 py-1.5 bg-[#EAF2EC] hover:bg-[#CDE3D3] text-[#1B3022] font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Buka Detail</span>
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
                  <button onClick={() => openFarmMap(f)} className="px-3 py-1.5 bg-white text-[#1B3022] border border-[#CDE3D3] font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"><MapPin className="w-3.5 h-3.5"/><span>Lokasi Member</span></button>
                  <button
                    onClick={() => handleDeleteFarm(f)}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
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
                  <th className="py-3.5 px-3">Mitra Marketing</th>
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
                    <td className="py-4 px-3">
                      <div className="max-w-[210px] px-3 py-2 rounded-xl bg-[#EAF2EC] border border-[#CDE3D3] text-xs font-black text-[#1B3022]">
                        {f.partnerCode ? `${f.partnerCode} — ${f.partnerName}` : 'Belum ditetapkan'}
                      </div>
                    </td>
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
                            onClick={() => setSelectedFarmModal(f)}
                            className="px-3 py-1.5 bg-[#EAF2EC] hover:bg-[#CDE3D3] text-[#1B3022] font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                            title="Buka detail kandang tanpa masuk ke akun member"
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
                        <button onClick={() => openFarmMap(f)} className="p-2 text-[#2D4A36] hover:bg-[#EAF2EC] rounded-xl" title="Buka lokasi GPS kandang Member"><MapPin className="w-4 h-4"/></button>
                        <button
                          onClick={() => handleDeleteFarm(f)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title={`Hapus ${f.farmCode}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {activeTab === 'sales' && (
        <div className="space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-black tracking-wider text-[#2D4A36] bg-[#EAF2EC] border border-[#CDE3D3] px-2.5 py-1 rounded-full">
                DATA TRANSAKSI MEMBER
              </span>
              <h3 className="text-2xl font-black text-[#1B3022] mt-2">Penjualan Telur</h3>
              <p className="text-xs text-stone-500 mt-1">
                Data berasal dari transaksi yang dicatat Member, bukan estimasi dari jumlah produksi.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="month"
                value={salesMonth}
                onChange={(e)=>setSalesMonth(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-white border border-[#E5E1D8] text-sm font-bold"
              />
              <select
                value={salesFarmFilter}
                onChange={(e)=>setSalesFarmFilter(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-white border border-[#E5E1D8] text-sm font-bold"
              >
                <option value="all">Semua Farm ID</option>
                {normalizedFarms.map((f:any)=>(
                  <option key={f.id} value={f.id}>{f.farmCode} — {f.ownerName || 'Member'}</option>
                ))}
              </select>
              <button onClick={()=>loadEggSales()} className="px-4 py-2.5 rounded-2xl bg-[#1B3022] text-white font-black text-xs flex items-center gap-2">
                <RefreshCw className="w-4 h-4"/> Perbarui
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-3xl border border-[#EFECE6] p-4">
              <div className="text-[10px] font-black text-stone-500 uppercase">Omzet</div>
              <div className="text-2xl font-black mt-1">{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(salesSummary.totalAmount||0))}</div>
            </div>
            <div className="bg-white rounded-3xl border border-[#EFECE6] p-4">
              <div className="text-[10px] font-black text-stone-500 uppercase">Telur Terjual</div>
              <div className="text-2xl font-black mt-1">{Number(salesSummary.totalEggs||0).toLocaleString('id-ID')} <span className="text-xs">butir</span></div>
            </div>
            <div className="bg-white rounded-3xl border border-[#EFECE6] p-4">
              <div className="text-[10px] font-black text-stone-500 uppercase">Transaksi</div>
              <div className="text-2xl font-black mt-1">{Number(salesSummary.transactionCount||0)}</div>
            </div>
            <div className="bg-white rounded-3xl border border-[#EFECE6] p-4">
              <div className="text-[10px] font-black text-stone-500 uppercase">Rata-rata Harga / Kg</div>
              <div className="text-2xl font-black mt-1">
                {Number(salesSummary.averagePricePerKg||0)>0
                  ? new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(salesSummary.averagePricePerKg||0))
                  : '-'}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#EFECE6] overflow-hidden">
            <div className="p-5 border-b border-[#EFECE6]">
              <h4 className="font-black text-lg">Transaksi Member</h4>
            </div>
            {eggSales.length === 0 ? (
              <div className="p-12 text-center text-sm text-stone-500">Belum ada transaksi pada filter ini.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-stone-500">
                    <tr>
                      <th className="p-4">Tanggal</th>
                      <th className="p-4">Farm ID / Member</th>
                      <th className="p-4">Jumlah</th>
                      <th className="p-4">Harga</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">Pembeli</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFECE6]">
                    {eggSales.map((s:any)=>(
                      <tr key={s.id}>
                        <td className="p-4 font-bold">{s.saleDate}</td>
                        <td className="p-4">
                          <div className="font-mono font-black">{s.farmCode || s.farmId}</div>
                          <div className="text-stone-500 mt-0.5">{s.ownerName || '-'}</div>
                        </td>
                        <td className="p-4 font-bold">
                          {s.eggCount} butir
                          {s.weightKg ? <div className="text-stone-500">{s.weightKg} kg</div> : null}
                        </td>
                        <td className="p-4">
                          {new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(s.unitPrice||0))}
                          <span className="text-stone-500">/{s.priceBasis === 'kg' ? 'kg' : 'butir'}</span>
                        </td>
                        <td className="p-4 font-black text-[#2D4A36]">
                          {new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(s.totalAmount||0))}
                        </td>
                        <td className="p-4">{s.buyerName || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                Masalah Kandang & Perlu Ditangani Admin
              </h3>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
              {adminAlerts.filter((a) => !a.resolved).length} Aktif
            </span>
          </div>

          <div className="rounded-2xl bg-[#EAF2EC] border border-[#CDE3D3] p-4 flex items-start gap-3">
            <Headphones className="w-5 h-5 text-[#2D4A36] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-[#1B3022]">Penanganan langsung oleh Admin Eggnest</p>
              <p className="text-xs text-stone-600 mt-1">
                Jika laporan Member menunjukkan ayam sakit, mati, penurunan produksi, atau kondisi lain yang perlu tindakan,
                Admin menindaklanjuti langsung. Mitra Marketing hanya dapat memonitor dan melakukan follow-up hubungan Member.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {adminAlerts.filter((alert) => !alert.resolved).map((alert) => (
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
                        onClick={() => handleOpenAlertFarm(alert)}
                        className="px-4 py-2 bg-white hover:bg-[#FAF7F2] border border-[#EFECE6] text-[#1B3022] font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Lihat Laporan
                      </button>
                      <button
                        onClick={() => handleContactAlertMember(alert)}
                        className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Hubungi Member
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
            {adminAlerts.filter((alert) => !alert.resolved).length === 0 && (
              <div className="py-10 text-center rounded-2xl border border-dashed border-[#CDE3D3] bg-[#FAFCFA]">
                <CheckCircle2 className="w-8 h-8 text-[#2D4A36] mx-auto mb-2" />
                <p className="font-black text-[#1B3022]">Belum ada masalah kandang aktif</p>
                <p className="text-xs text-stone-500 mt-1">Laporan bermasalah dari Member akan otomatis muncul di sini.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TIKET BANTUAN */}
      {activeTab === 'tickets' && (
        <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit']">
                Penanganan Member & Tiket Bantuan
              </h3>
              <p className="text-xs text-stone-500">
                Semua keluhan teknis kandang ditangani Admin. Mitra Marketing hanya melakukan monitoring dan follow-up Member.
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
            {tickets.length === 0 && (
              <div className="py-10 text-center rounded-2xl border border-dashed border-[#E5E1D8] bg-[#FAF7F2]">
                <Headphones className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <p className="font-black text-[#1B3022]">Belum ada tiket bantuan</p>
                <p className="text-xs text-stone-500 mt-1">Tiket dari Member akan masuk langsung ke Admin Eggnest.</p>
              </div>
            )}
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
                  {a.thumbnail && (
                    <div className="aspect-video rounded-xl overflow-hidden bg-stone-100 mb-3 border border-[#EFECE6]">
                      <img src={a.thumbnail} alt={a.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <h4 className="font-bold text-sm text-[#1B3022] font-['Outfit']">{a.title}</h4>
                  <p className="text-xs text-stone-600 mt-1 line-clamp-2">{a.description}</p>
                  {a.type === 'video' && a.videoUrl && (
                    <div className="mt-2 text-[10px] font-bold text-[#2D4A36] bg-[#EAF2EC] px-2 py-1 rounded-lg inline-block">
                      🎬 Video siap diputar
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#EFECE6] text-xs">
                  <span className="text-stone-400 font-mono text-[10px]">{a.type.toUpperCase()}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleRecommendAcademy(a.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                        a.isRecommended
                          ? 'bg-[#D4AF37] text-[#1B3022]'
                          : 'bg-white text-stone-600 border border-[#EFECE6]'
                      }`}
                      title="Jadikan rekomendasi utama"
                    >
                      {a.isRecommended ? '★ Rekomendasi' : '☆ Rekomendasikan'}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Hapus materi "${a.title}"?`)) deleteAcademyContent(a.id);
                      }}
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

      {/* TAB: RINGKASAN OPERASIONAL */}
      {activeTab === 'pengaturan' && (
        <div className="space-y-5">
          <div className="bg-white rounded-3xl border border-[#EFECE6] p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <span className="text-[10px] font-black tracking-wider text-[#2D4A36] bg-[#EAF2EC] px-2.5 py-1 rounded-full">PRIORITAS HARI INI</span>
                <h3 className="text-xl font-black text-[#1B3022] mt-2">Ringkasan Operasional Admin</h3>
                <p className="text-xs text-stone-500 mt-1">Yang perlu dilihat Admin setiap hari tanpa masuk ke pengaturan teknis sistem.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-[#FAF7F2] border border-[#EFECE6] p-4"><div className="text-[10px] font-black text-stone-400">LAPORAN MASUK HARI INI</div><div className="text-3xl font-black text-[#1B3022] mt-1">{todayReports.length}</div><div className="text-xs text-stone-500">dari {normalizedFarms.length} Farm ID</div></div>
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4"><div className="text-[10px] font-black text-amber-700">BELUM LAPOR</div><div className="text-3xl font-black text-amber-800 mt-1">{Math.max(0, normalizedFarms.filter(f=>f.status !== 'unclaimed').length - new Set(todayReports.map((r:any)=>String(r.farmId ?? r.farm_id ?? ''))).size)}</div><div className="text-xs text-amber-700">Member aktif hari ini</div></div>
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4"><div className="text-[10px] font-black text-rose-700">MASALAH AKTIF</div><div className="text-3xl font-black text-rose-700 mt-1">{adminAlerts.filter(a=>!a.resolved).length}</div><button onClick={()=>setActiveTab('alerts')} className="text-xs font-black text-rose-700 mt-1">Buka Masalah →</button></div>
              <div className="rounded-2xl bg-[#EAF2EC] border border-[#CDE3D3] p-4"><div className="text-[10px] font-black text-[#2D4A36]">TIKET TERBUKA</div><div className="text-3xl font-black text-[#1B3022] mt-1">{tickets.filter(t=>t.status !== 'Selesai').length}</div><button onClick={()=>setActiveTab('tickets')} className="text-xs font-black text-[#2D4A36] mt-1">Buka Tiket →</button></div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#EFECE6] p-6">
            <h4 className="font-black text-[#1B3022]">Alur Operasional</h4>
            <div className="grid md:grid-cols-3 gap-3 mt-4">
              <div className="rounded-2xl bg-[#FAF7F2] p-4"><div className="text-xs font-black text-[#1B3022]">1. Member</div><p className="text-xs text-stone-500 mt-1">Mengisi laporan telur, pakan, kondisi ayam dan GPS kandang.</p></div>
              <div className="rounded-2xl bg-[#FAF7F2] p-4"><div className="text-xs font-black text-[#1B3022]">2. Admin</div><p className="text-xs text-stone-500 mt-1">Menerima masalah, menanggapi tiket, memberi solusi dan menandai selesai.</p></div>
              <div className="rounded-2xl bg-[#FAF7F2] p-4"><div className="text-xs font-black text-[#1B3022]">3. Mitra Marketing</div><p className="text-xs text-stone-500 mt-1">Melihat Member binaan, monitoring dan melakukan follow-up hubungan Member.</p></div>
            </div>
          </div>
        </div>
      )}


      {/* MODAL: ADMIN FARM DETAIL
          Admin tetap berada di sesi Administrator. Tidak ada impersonation / pergantian akun. */}
      {selectedFarmModal && (() => {
        const farmReports = allReports
          .filter((r: any) => String(r.farmId ?? r.farm_id ?? '') === String(selectedFarmModal.id))
          .map((r: any) => ({
            ...r,
            id: String(r.id ?? ''),
            date: String(r.date ?? r.report_date ?? ''),
            eggCount: Number(r.eggCount ?? r.egg_count ?? 0),
            feedKg: Number(r.feedKg ?? r.feed_kg ?? 0),
            productivityRate: Number(r.productivityRate ?? r.productivity_rate ?? 0),
            chickenCondition: String(r.chickenCondition ?? r.chicken_condition ?? 'healthy'),
            notes: String(r.notes ?? ''),
          }))
          .sort((a: any, b: any) => b.date.localeCompare(a.date));

        const latestReport = farmReports[0];
        const totalEggs = farmReports.reduce(
          (sum: number, r: any) => sum + Number(r.eggCount || 0),
          0
        );
        const avgEggs =
          farmReports.length > 0
            ? Number((totalEggs / farmReports.length).toFixed(1))
            : 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#FDFBF7] rounded-3xl shadow-2xl border border-[#EFECE6] w-full max-w-5xl max-h-[92vh] overflow-y-auto">
              <div className="sticky top-0 z-10 bg-[#1B3022] text-[#FDFBF7] p-5 sm:p-6 rounded-t-3xl flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black bg-[#D4AF37] text-[#1B3022] px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Detail Kandang
                    </span>
                    <span className="text-xs text-[#EAF2EC]/80">
                      Admin tetap login sebagai Administrator
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black font-['Outfit'] mt-2">
                    {selectedFarmModal.farmCode}
                  </h3>

                  <p className="text-sm text-[#EAF2EC] mt-0.5">
                    {selectedFarmModal.ownerName || 'Belum diklaim member'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFarmModal(null)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center font-black cursor-pointer"
                  aria-label="Tutup detail kandang"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-white rounded-2xl border border-[#EFECE6] p-4">
                    <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">
                      Status
                    </span>
                    <p className="font-black text-[#1B3022] mt-1 capitalize">
                      {selectedFarmModal.status === 'active'
                        ? '🟢 Aktif'
                        : selectedFarmModal.status === 'warning'
                        ? '🟡 Warning'
                        : selectedFarmModal.status === 'critical'
                        ? '🔴 Kritis'
                        : '⚪ Belum Diklaim'}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#EFECE6] p-4">
                    <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">
                      Ayam Aktif
                    </span>
                    <p className="text-2xl font-black text-[#1B3022] mt-1">
                      {selectedFarmModal.activeChickens || 0}
                    </p>
                    <span className="text-[10px] text-stone-500">ekor</span>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#EFECE6] p-4">
                    <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">
                      Total Laporan
                    </span>
                    <p className="text-2xl font-black text-[#1B3022] mt-1">
                      {farmReports.length}
                    </p>
                    <span className="text-[10px] text-stone-500">catatan</span>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#EFECE6] p-4">
                    <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">
                      Rata-rata Telur
                    </span>
                    <p className="text-2xl font-black text-[#2D4A36] mt-1">
                      {avgEggs}
                    </p>
                    <span className="text-[10px] text-stone-500">
                      butir / laporan
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-[#EFECE6] p-5 space-y-3">
                    <h4 className="font-black text-[#1B3022] font-['Outfit']">
                      Identitas Member
                    </h4>

                    <div className="grid grid-cols-[110px_1fr] gap-y-2 text-xs">
                      <span className="text-stone-500">Nama</span>
                      <strong className="text-stone-800">
                        {selectedFarmModal.ownerName || '-'}
                      </strong>

                      <span className="text-stone-500">WhatsApp</span>
                      <strong className="text-stone-800">
                        {selectedFarmModal.phone || '-'}
                      </strong>

                      <span className="text-stone-500">Lokasi</span>
                      <strong className="text-stone-800">
                        {selectedFarmModal.location || '-'}
                      </strong>

                      <span className="text-stone-500">Farm ID</span>
                      <strong className="font-mono text-[#1B3022]">
                        {selectedFarmModal.farmCode || '-'}
                      </strong>
                    </div>

                    {selectedFarmModal.phone && (
                      <button
                        type="button"
                        onClick={() =>
                          handleContactMember(
                            selectedFarmModal.ownerName || 'Member',
                            selectedFarmModal.phone
                          )
                        }
                        className="w-full mt-2 px-4 py-2.5 bg-[#EAF2EC] hover:bg-[#CDE3D3] text-[#1B3022] font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Phone className="w-4 h-4" />
                        Hubungi Member
                      </button>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-[#EFECE6] p-5 space-y-3">
                    <h4 className="font-black text-[#1B3022] font-['Outfit']">
                      Data Kandang
                    </h4>

                    <div className="grid grid-cols-[120px_1fr] gap-y-2 text-xs">
                      <span className="text-stone-500">Ras</span>
                      <strong className="text-stone-800">
                        {selectedFarmModal.chickenBreed ??
                          selectedFarmModal.chicken_breed ??
                          '-'}
                      </strong>

                      <span className="text-stone-500">Umur Ayam</span>
                      <strong className="text-stone-800">
                        {selectedFarmModal.currentAgeWeeks ??
                          selectedFarmModal.current_age_weeks ??
                          0}{' '}
                        minggu
                      </strong>

                      <span className="text-stone-500">Tanggal Aktivasi</span>
                      <strong className="text-stone-800">
                        {selectedFarmModal.activationDate ??
                          selectedFarmModal.activation_date ??
                          '-'}
                      </strong>

                      <span className="text-stone-500">Garansi</span>
                      <strong className="text-stone-800">
                        {selectedFarmModal.warrantyEnd ??
                          selectedFarmModal.warranty_end ??
                          '-'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#EFECE6] overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-[#EFECE6] flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-black text-[#1B3022] font-['Outfit']">
                        Riwayat Laporan Member
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Admin membaca data kandang tanpa masuk ke akun member.
                      </p>
                    </div>

                    {latestReport && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#EAF2EC] text-[#1B3022] border border-[#CDE3D3] whitespace-nowrap">
                        Terakhir: {latestReport.date}
                      </span>
                    )}
                  </div>

                  {farmReports.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="font-bold text-stone-700">
                        Belum ada laporan kandang.
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        Setelah member menyimpan laporan, datanya akan muncul di sini.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px] text-left text-xs">
                        <thead>
                          <tr className="bg-[#FAF7F2] text-stone-500 uppercase tracking-wider">
                            <th className="px-4 py-3">Tanggal</th>
                            <th className="px-4 py-3">Telur</th>
                            <th className="px-4 py-3">Pakan</th>
                            <th className="px-4 py-3">Produktivitas</th>
                            <th className="px-4 py-3">Kondisi</th>
                            <th className="px-4 py-3">Foto</th>
                            <th className="px-4 py-3">Catatan</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-[#EFECE6]">
                          {farmReports.slice(0, 30).map((report: any) => (
                            <tr key={report.id} className="hover:bg-[#FAF7F2]">
                              <td className="px-4 py-3 font-bold text-[#1B3022]">
                                {report.date}
                              </td>
                              <td className="px-4 py-3">
                                {report.eggCount} butir
                              </td>
                              <td className="px-4 py-3">
                                {report.feedKg} kg
                              </td>
                              <td className="px-4 py-3 font-bold">
                                {report.productivityRate || 0}%
                              </td>
                              <td className="px-4 py-3">
                                {report.chickenCondition === 'healthy'
                                  ? '🟢 Sehat'
                                  : '🟡 Perlu Pantauan'}
                              </td>
                              <td className="px-4 py-3">
                                {report.photoUrl || report.photo_url ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedReportPhoto(report)}
                                    className="group relative w-14 h-14 rounded-xl overflow-hidden border-2 border-[#E5E1D8] hover:border-[#2D4A36] shadow-sm cursor-pointer bg-[#F7F4EE]"
                                    title="Lihat foto laporan"
                                  >
                                    <img
                                      src={report.photoUrl || report.photo_url}
                                      alt={`Foto laporan ${report.date}`}
                                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                      <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                                    </span>
                                  </button>
                                ) : (
                                  <span className="text-stone-400">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-stone-500">
                                {report.notes || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedFarmModal(null)}
                    className="px-5 py-2.5 bg-[#1B3022] hover:bg-[#2D4A36] text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Tutup Detail
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {selectedReportPhoto && (selectedReportPhoto.photoUrl || selectedReportPhoto.photo_url) && (
        <div
          className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedReportPhoto(null)}
        >
          <div
            className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-[#1B3022] text-white flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-black">
                  Bukti Foto Laporan Member
                </p>
                <h3 className="font-black font-['Outfit']">
                  {selectedReportPhoto.date || selectedReportPhoto.report_date || '-'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReportPhoto(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 font-black cursor-pointer"
                aria-label="Tutup foto laporan"
              >
                ✕
              </button>
            </div>

            <div className="bg-black">
              <img
                src={selectedReportPhoto.photoUrl || selectedReportPhoto.photo_url}
                alt="Foto laporan member"
                className="w-full max-h-[65vh] object-contain"
              />
            </div>

            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#F7F4EE] rounded-xl p-3">
                <span className="text-stone-500">Farm ID</span>
                <p className="font-black text-[#1B3022] mt-1">
                  {selectedFarmModal?.farmCode || selectedFarmModal?.farm_code || '-'}
                </p>
              </div>
              <div className="bg-[#F7F4EE] rounded-xl p-3">
                <span className="text-stone-500">Telur</span>
                <p className="font-black text-[#1B3022] mt-1">
                  {selectedReportPhoto.eggCount ?? selectedReportPhoto.egg_count ?? 0} butir
                </p>
              </div>
              <div className="bg-[#F7F4EE] rounded-xl p-3">
                <span className="text-stone-500">Pakan</span>
                <p className="font-black text-[#1B3022] mt-1">
                  {selectedReportPhoto.feedKg ?? selectedReportPhoto.feed_kg ?? 0} kg
                </p>
              </div>
              <div className="bg-[#F7F4EE] rounded-xl p-3">
                <span className="text-stone-500">Kondisi</span>
                <p className="font-black text-[#1B3022] mt-1">
                  {(selectedReportPhoto.chickenCondition ?? selectedReportPhoto.chicken_condition) === 'healthy'
                    ? '🟢 Sehat'
                    : '🟡 Perlu Pantauan'}
                </p>
              </div>
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
                  Farm ID / Kode Aktivasi
                </label>
                <input
                  type="text"
                  value={newFarmCode}
                  onChange={(e) => setNewFarmCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: EN-000101 — kosongkan untuk otomatis"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EFECE6] rounded-xl text-sm font-black text-[#1B3022] tracking-wide"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  Kode dibuat dan dikontrol Admin, lalu diserahkan kepada Member melalui Mitra Marketing saat aktivasi. Harus unik.
                </p>
              </div>
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
              <div className="rounded-xl bg-[#EAF2EC] border border-[#CDE3D3] p-3">
                <label className="block font-bold text-[#1B3022] mb-1">Lokasi Kandang</label>
                <p className="text-[11px] text-stone-600">Lokasi tidak diisi Admin. Setelah Member aktivasi, GPS dan alamat kandang diambil dari akun Member.</p>
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">Mitra Marketing *</label>
                <select
                  required
                  value={newFarmPartnerId}
                  onChange={(e) => setNewFarmPartnerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EFECE6] rounded-xl text-sm font-semibold text-[#1B3022]"
                >
                  <option value="">Pilih Mitra Marketing</option>
                  {partners.filter((p:any)=>p.status === 'active').map((p:any)=>(
                    <option key={p.id} value={p.id}>{p.partner_code} — {p.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-stone-500 mt-1">Setelah Farm ID dibuat, relasi Mitra–Member dikunci di tampilan Admin.</p>
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
                  Simpan Farm ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT EXCEL */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#EFECE6] w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#1B3022] font-['Outfit'] flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  Import Data Excel
                </h3>
                <p className="text-[11px] text-stone-500 mt-1">Pilih jenis data, upload Excel, cek validasi, lalu simpan.</p>
              </div>
              <button onClick={() => setIsImportOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-xs text-stone-700 mb-1">Jenis Data</label>
                <select
                  value={importType}
                  onChange={(e) => {
                    setImportType(e.target.value as ImportType);
                    setImportResult(null);
                  }}
                  className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#EFECE6] rounded-xl text-xs font-bold"
                >
                  <option value="farms">Farm ID / Kandang</option>
                  <option value="members">Member</option>
                  <option value="chickens">Populasi Ayam</option>
                  <option value="reports">Laporan Harian</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-xs text-stone-700 mb-1">File Excel</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  disabled={isImporting}
                  onChange={(e) => handleImportFile(e.target.files?.[0])}
                  className="w-full text-xs file:mr-2 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-[#EAF2EC] file:text-[#1B3022] file:font-bold"
                />
              </div>
            </div>

            {isImporting && <div className="text-xs font-bold text-[#2D4A36]">Memproses Excel...</div>}

            {importResult && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EFECE6]">
                    <div className="text-[10px] text-stone-500 font-bold">TOTAL</div>
                    <div className="text-xl font-black text-[#1B3022]">{importResult.totalRows}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] text-emerald-700 font-bold">VALID</div>
                    <div className="text-xl font-black text-emerald-800">{importResult.validCount}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <div className="text-[10px] text-rose-700 font-bold">ERROR</div>
                    <div className="text-xl font-black text-rose-800">{importResult.invalidCount}</div>
                  </div>
                </div>

                {importResult.errors?.length > 0 && (
                  <div className="max-h-36 overflow-y-auto rounded-xl border border-rose-200 bg-rose-50 p-3">
                    {importResult.errors.slice(0, 20).map((err: any, idx: number) => (
                      <div key={idx} className="text-[11px] text-rose-800 mb-1">
                        Baris {err.row}: {err.reason}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsImportOpen(false)} className="px-4 py-2 text-stone-600 font-bold text-xs rounded-xl">
                    Batal
                  </button>
                  <button
                    onClick={handleCommitImport}
                    disabled={isImporting || !importResult.validCount}
                    className="px-5 py-2.5 bg-[#1B3022] text-white font-bold text-xs rounded-xl disabled:opacity-40"
                  >
                    Import {importResult.validCount} Data Valid
                  </button>
                </div>
              </div>
            )}
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
                <div className="mt-2">
                  <span className={`inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full ${getTicketStatusClasses(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            {((selectedTicket as any).photoUrl || (selectedTicket as any).photo_url) && (
              <div className="rounded-2xl border border-[#EFECE6] bg-[#FAF7F2] p-3">
                <div className="text-[10px] font-bold text-stone-500 mb-2">FOTO KONDISI DARI MEMBER</div>
                <img
                  src={(selectedTicket as any).photoUrl || (selectedTicket as any).photo_url}
                  alt="Foto kondisi member"
                  className="w-full max-h-72 object-contain rounded-xl bg-black/5"
                />
              </div>
            )}

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
                      <span>{msg.senderName} ({msg.senderRole === 'member' ? 'Member' : 'Admin'})</span>
                      <span>{msg.createdAt}</span>
                    </div>
                    <p className="leading-relaxed">{msg.message}</p>
                    {(msg.attachmentUrl || (msg as any).attachment_url) && (
                      <img
                        src={msg.attachmentUrl || (msg as any).attachment_url}
                        alt="Attachment"
                        className="mt-2 rounded-xl max-h-36 object-cover"
                      />
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-500 p-3">{selectedTicket.description}</p>
              )}
              {selectedTicket.status === 'Selesai' && (
                <div className="mx-auto max-w-[92%] text-center p-3.5 rounded-2xl bg-[#EAF2EC] border border-[#CDE3D3] text-[#1B3022]">
                  <div className="text-xs font-black">✓ Konsultasi Selesai</div>
                  <div className="text-[11px] mt-1 text-[#2D4A36]">Tiket telah ditutup. Riwayat percakapan tetap tersimpan dan dapat dilihat kembali oleh member.</div>
                </div>
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
                          ? getTicketStatusClasses(st)
                          : 'bg-[#FAF7F2] border border-[#EFECE6] text-stone-500 hover:bg-stone-100'
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
                placeholder="Ketik tanggapan / solusi Admin Eggnest..."
                className="flex-1 px-4 py-3 bg-[#FAF7F2] border border-[#EFECE6] rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2D4A36] focus:bg-white"
              />
              <button
                onClick={handleSendTicketReply}
                className="px-5 py-3 bg-[#2D4A36] hover:bg-[#1B3022] text-[#FDFBF7] font-bold text-xs rounded-2xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Tanggapan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD ACADEMY */}
      {isAddAcademyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#EFECE6] w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#1B3022] font-['Outfit']">
                  Tambah Materi Academy Baru
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Upload video langsung atau gunakan link YouTube/video eksternal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isUploadingAcademy && setIsAddAcademyOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAcademy} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Judul Materi *</label>
                <input
                  type="text"
                  required
                  value={acadTitle}
                  onChange={(e) => setAcadTitle(e.target.value)}
                  placeholder="Contoh: Mengatur Ventilasi Saat Cuaca Panas"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EFECE6] rounded-xl text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Kategori *</label>
                  <select
                    value={acadCategory}
                    onChange={(e) => setAcadCategory(e.target.value as AcademyCategory)}
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
                  <label className="block font-bold text-stone-700 mb-1">Tipe Materi *</label>
                  <select
                    value={acadType}
                    onChange={(e) => setAcadType(e.target.value as 'video' | 'article')}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#EFECE6] rounded-xl text-xs font-semibold"
                  >
                    <option value="video">🎬 Video Praktis</option>
                    <option value="article">📖 Artikel Bacaan</option>
                  </select>
                </div>
              </div>

              {acadType === 'video' && (
                <div className="p-4 rounded-2xl bg-[#EAF2EC] border border-[#CDE3D3] space-y-3">
                  <div>
                    <label className="block font-bold text-[#1B3022] mb-1">Upload Video</label>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={(e) => setAcadVideoFile(e.target.files?.[0] || null)}
                      className="block w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-[#1B3022] file:text-white file:font-bold"
                    />
                    <p className="text-[10px] text-stone-500 mt-1">MP4, WEBM, atau MOV. Maksimal 100 MB.</p>
                    {acadVideoFile && (
                      <p className="text-[11px] font-bold text-[#2D4A36] mt-1">
                        ✓ {acadVideoFile.name} ({(acadVideoFile.size / 1024 / 1024).toFixed(1)} MB)
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-stone-400">
                    <div className="h-px bg-[#CDE3D3] flex-1" />
                    <span className="text-[10px] font-bold">ATAU</span>
                    <div className="h-px bg-[#CDE3D3] flex-1" />
                  </div>

                  <div>
                    <label className="block font-bold text-[#1B3022] mb-1">URL Video / YouTube</label>
                    <input
                      type="url"
                      value={acadVideoUrl}
                      onChange={(e) => setAcadVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... atau URL video"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#CDE3D3] rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#1B3022] mb-1">Durasi</label>
                    <input
                      type="text"
                      value={acadDuration}
                      onChange={(e) => setAcadDuration(e.target.value)}
                      placeholder="Contoh: 2 menit"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#CDE3D3] rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-stone-700 mb-1">Thumbnail / Cover</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setAcadThumbnailFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-[#D4AF37] file:text-[#1B3022] file:font-bold"
                />
                <p className="text-[10px] text-stone-500 mt-1">JPG, PNG, WEBP. Maksimal 5 MB.</p>
                <div className="mt-2">
                  <label className="block font-semibold text-stone-500 mb-1">atau URL thumbnail</label>
                  <input
                    type="url"
                    value={acadThumbnail}
                    onChange={(e) => setAcadThumbnail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EFECE6] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  value={acadDesc}
                  onChange={(e) => setAcadDesc(e.target.value)}
                  placeholder="Penjelasan ringkas 1–2 kalimat"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EFECE6] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Isi Panduan Lengkap *</label>
                <textarea
                  rows={5}
                  required
                  value={acadContent}
                  onChange={(e) => setAcadContent(e.target.value)}
                  placeholder="Tuliskan poin penting, langkah praktis, atau ringkasan video..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EFECE6] rounded-xl text-xs"
                />
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#EFECE6] cursor-pointer">
                <input
                  type="checkbox"
                  checked={acadPublishNow}
                  onChange={(e) => setAcadPublishNow(e.target.checked)}
                  className="w-4 h-4 accent-[#2D4A36]"
                />
                <div>
                  <div className="font-bold text-[#1B3022]">Langsung tampil ke member</div>
                  <div className="text-[10px] text-stone-500">Matikan untuk menyimpan sebagai Draft.</div>
                </div>
              </label>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  disabled={isUploadingAcademy}
                  onClick={() => setIsAddAcademyOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-bold disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploadingAcademy}
                  className="px-5 py-2.5 bg-[#1B3022] hover:bg-[#2D4A36] text-white font-bold rounded-xl shadow-xs disabled:opacity-60"
                >
                  {isUploadingAcademy
                    ? 'Mengupload & Menyimpan...'
                    : acadPublishNow
                      ? 'Publish Materi'
                      : 'Simpan Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
