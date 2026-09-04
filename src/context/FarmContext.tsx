import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  User,
  Farm,
  DailyReport,
  FarmScore,
  SupportTicket,
  SupportMessage,
  AcademyContent,
  NotificationItem,
  AdminAlert,
  SystemSettings,
  SupportCategory,
  ChickenCondition,
  IssueType,
  AdminLog,
} from '../types';
import { DEFAULT_SETTINGS, INITIAL_FARM_SCORE } from '../data/mockData';
import { api, getToken, removeToken } from '../services/api';

export type ActivePage =
  | 'landing'
  | 'auth'
  | 'beranda'
  | 'laporan'
  | 'perkembangan'
  | 'academy'
  | 'bantuan'
  | 'score'
  | 'profil'
  | 'admin'
  | 'apidocs';

export type TextScale = 'normal' | 'large' | 'xlarge';

interface LoginParams {
  role: 'member' | 'admin';
  phone?: string;
  identifier?: string;
  password?: string;
}

interface RegisterParams {
  fullName: string;
  phone: string;
  password?: string;
  farmCode: string;
}

interface FarmContextType {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  farms: Farm[];
  farm: Farm;
  setFarm: (farm: Farm) => void;
  reports: DailyReport[];
  allReports: DailyReport[];
  farmScore: FarmScore;
  tickets: SupportTicket[];
  academyContents: AcademyContent[];
  notifications: NotificationItem[];
  adminAlerts: AdminAlert[];
  settings: SystemSettings;
  adminLogs: AdminLog[];
  isLoading: boolean;

  isQuickReportOpen: boolean;
  setIsQuickReportOpen: (open: boolean) => void;
  textScale: TextScale;
  setTextScale: (scale: TextScale) => void;

  // Dynamic Calculations
  todayReport: DailyReport | undefined;
  todayEggCount: number;
  monthEggCount: number;
  todayFeedKg: number;
  monthFeedKg: number;
  productivityRate: number;
  productivityStatus: 'Optimal' | 'Baik' | 'Cukup' | 'Perlu Perhatian';
  estimatedEggValue: number;
  averageEggsPerDay: number;
  chickenCurrentAgeWeeks: number;
  fcr: number | null;

  // Actions
  login: (params: LoginParams) => Promise<{ success: boolean; message: string }>;
  registerMember: (params: RegisterParams) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  impersonateFarm: (farmId: string) => Promise<void>;

  addDailyReport: (report: {
    date: string;
    eggCount: number;
    feedKg: number;
    chickenCondition: ChickenCondition;
    issueTypes?: IssueType[];
    notes?: string;
    photoUrl?: string;
    videoUrl?: string;
  }) => Promise<{ success: boolean; productivity: number; fcr?: number }>;

  createSupportTicket: (ticket: {
    category: SupportCategory;
    title: string;
    description: string;
    eggCountToday?: number;
    photoUrl?: string;
    videoUrl?: string;
  }) => Promise<SupportTicket | null>;

  replyTicketMessage: (ticketId: string, message: string) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status'], adminNotes?: string) => Promise<void>;

  createFarm: (farmData: {
    ownerName?: string;
    phone?: string;
    location?: string;
    initialChickens?: number;
    chickenBreed?: string;
    initialAgeWeeks?: number;
  }) => Promise<Farm | null>;
  updateFarm: (farmId: string, farmData: Partial<Farm>) => Promise<void>;

  createAcademyContent: (content: Partial<AcademyContent>) => Promise<void>;
  updateAcademyContent: (id: string, content: Partial<AcademyContent>) => Promise<void>;
  deleteAcademyContent: (id: string) => Promise<void>;
  togglePublishAcademy: (id: string) => Promise<void>;
  toggleRecommendAcademy: (id: string) => Promise<void>;

  downloadExportExcel: (type: 'members' | 'farms' | 'chickens' | 'reports' | 'scores' | 'tickets') => Promise<void>;
  validateImport: (type: 'members' | 'farms' | 'chickens' | 'reports', rows: any[]) => Promise<{
    success: boolean;
    totalRows: number;
    validCount: number;
    invalidCount: number;
    preview: any[];
    errors: { row: number; reason: string }[];
  }>;
  commitImport: (type: 'members' | 'farms' | 'chickens' | 'reports', validRows: any[]) => Promise<{
    success: boolean;
    importedCount: number;
    failedCount: number;
    errors: any[];
    message: string;
  }>;

  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  resolveAdminAlert: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  uploadPhoto: (file: File) => Promise<string>;

  resetToCleanDatabase: () => Promise<void>;
  loadDemoDatabase: () => Promise<void>;
  refreshAllData: () => Promise<void>;

  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<ActivePage>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentFarm, setCurrentFarm] = useState<Farm>({
    id: 'farm-001',
    farmCode: 'EN-000127',
    ownerName: 'Budi Santoso',
    phone: '081234567890',
    location: 'Depok, Jawa Barat',
    activationDate: '2026-07-20',
    initialChickens: 12,
    activeChickens: 12,
    chickenBreed: 'Layer Lohmann Brown Petelur Unggul',
    initialAgeWeeks: 18,
    currentAgeWeeks: 24,
    warrantyEnd: '2026-08-19',
    status: 'active',
    photoUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1000&q=80',
  });

  const [farms, setFarms] = useState<Farm[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allReports, setAllReports] = useState<DailyReport[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [academyContents, setAcademyContents] = useState<AcademyContent[]>([]);
  const [adminAlerts, setAdminAlerts] = useState<AdminAlert[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [textScale, setTextScale] = useState<TextScale>('normal');
  const [isQuickReportOpen, setIsQuickReportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load all data from real backend database
  const refreshAllData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load Settings
      try {
        const setRes = await api.getSettings();
        if (setRes.success && setRes.settings) {
          setSettings((prev) => ({ ...prev, ...setRes.settings }));
        }
      } catch (e) {}

      // Check current user session via JWT token
      const token = getToken();
      if (token) {
        try {
          const meRes = await api.getMe();
          if (meRes.success && meRes.user) {
            setCurrentUser(meRes.user);
            if (meRes.farm) {
              setCurrentFarm(meRes.farm);
            }
          }
        } catch (err) {
          // Token invalid or expired
          removeToken();
          setCurrentUser(null);
        }
      }

      // Load Farms
      try {
        const farmsRes = await api.getFarms();
        if (farmsRes.success && farmsRes.farms) {
          setFarms(farmsRes.farms);
          if (!currentUser?.farmId && farmsRes.farms.length > 0) {
            const firstActive = farmsRes.farms.find((f) => f.status === 'active') || farmsRes.farms[0];
            setCurrentFarm(firstActive);
          }
        }
      } catch (e) {}

      // Load Reports for current farm
      const targetFarmId = currentUser?.farmId || currentFarm.id || 'farm-001';
      try {
        const reportsRes = await api.getReports(targetFarmId);
        if (reportsRes.success && reportsRes.reports) {
          setAllReports(reportsRes.reports);
        }
      } catch (e) {}

      // Load Support Tickets
      try {
        const ticketsRes = await api.getTickets();
        if (ticketsRes.success && ticketsRes.tickets) {
          setTickets(ticketsRes.tickets);
        }
      } catch (e) {}

      // Load Academy Content
      try {
        const acadRes = await api.getAcademy(true);
        if (acadRes.success && acadRes.contents) {
          setAcademyContents(acadRes.contents);
        }
      } catch (e) {}

      // Load Alerts & Logs if Admin
      if (currentUser?.role === 'admin') {
        try {
          const alertRes = await api.getAlerts();
          if (alertRes.success && alertRes.alerts) {
            setAdminAlerts(alertRes.alerts);
          }
        } catch (e) {}

        try {
          const logRes = await api.getAuditLogs();
          if (logRes.success && logRes.logs) {
            setAdminLogs(logRes.logs);
          }
        } catch (e) {}
      }
    } catch (error) {
      console.error('Error refreshing backend data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.role, currentUser?.farmId, currentFarm.id]);

  // Initial load on mount
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Reports for current farm
  const reports = useMemo(() => {
    return allReports
      .filter((r) => r.farmId === currentFarm.id)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allReports, currentFarm.id]);

  // Dynamic Age calculation from activation date & initial weeks
  const chickenCurrentAgeWeeks = useMemo(() => {
    if (!currentFarm.activationDate) return currentFarm.initialAgeWeeks || 18;
    try {
      const actDate = new Date(currentFarm.activationDate);
      const now = new Date('2026-08-31');
      const diffTime = Math.abs(now.getTime() - actDate.getTime());
      const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
      return (currentFarm.initialAgeWeeks || 18) + diffWeeks;
    } catch (e) {
      return currentFarm.currentAgeWeeks || 22;
    }
  }, [currentFarm]);

  // Database-driven calculations
  const todayReport = reports.find((r) => r.date === '2026-08-31') || reports[reports.length - 1];
  const todayEggCount = todayReport ? todayReport.eggCount : 0;
  const todayFeedKg = todayReport ? todayReport.feedKg : 0;

  const augustReports = reports.filter((r) => r.date.startsWith('2026-08'));
  const monthEggCount = augustReports.reduce((sum, r) => sum + (r.eggCount || 0), 0);
  const monthFeedKg = Number(augustReports.reduce((sum, r) => sum + (r.feedKg || 0), 0).toFixed(1));
  const averageEggsPerDay =
    augustReports.length > 0 ? Number((monthEggCount / augustReports.length).toFixed(1)) : 0;

  // Productivity = (egg_count / active_chicken_count) * 100
  const activeChickens = currentFarm.activeChickens || 12;
  const productivityRate =
    todayReport && activeChickens > 0
      ? Math.round((todayEggCount / activeChickens) * 100)
      : 0;

  let productivityStatus: 'Optimal' | 'Baik' | 'Cukup' | 'Perlu Perhatian' = 'Baik';
  if (productivityRate >= 90) productivityStatus = 'Optimal';
  else if (productivityRate >= 75) productivityStatus = 'Baik';
  else if (productivityRate >= 60) productivityStatus = 'Cukup';
  else productivityStatus = 'Perlu Perhatian';

  // Egg Value = (total_eggs / eggs_per_kg) * egg_price_per_kg
  const eggsPerKg = settings.eggsPerKg || 16;
  const eggPricePerKg = settings.eggPricePerKg || 32000;
  const estimatedEggValue = Math.round((monthEggCount / eggsPerKg) * eggPricePerKg);

  // FCR Calculation: Total Feed (kg) / Total Egg Mass (kg)
  const fcr = useMemo(() => {
    if (monthEggCount > 0 && monthFeedKg > 0) {
      const totalEggMassKg = monthEggCount / eggsPerKg;
      return Number((monthFeedKg / totalEggMassKg).toFixed(2));
    }
    return null;
  }, [monthEggCount, monthFeedKg, eggsPerKg]);

  // Dynamic Farm Score calculation based on real farm reports & health
  const farmScore: FarmScore = useMemo(() => {
    const farmReports = reports;

    // 1. Production Score (0 - 100)
    const avgProd =
      farmReports.length > 0
        ? farmReports.reduce((acc, r) => acc + (r.productivityRate || 0), 0) / farmReports.length
        : productivityRate || 75;
    const productionScore = Math.min(100, Math.max(20, Math.round((avgProd / 85) * 90)));

    // 2. Report Score (0 - 100)
    const reportScore = Math.min(
      100,
      Math.max(30, Math.round(farmReports.length >= 7 ? 95 : farmReports.length > 0 ? 60 + farmReports.length * 5 : 50))
    );

    // 3. Maintenance Score (0 - 100)
    const daysWithFeed = farmReports.filter((r) => r.feedKg > 0).length;
    const maintenanceScore =
      farmReports.length > 0
        ? Math.min(100, Math.max(40, Math.round((daysWithFeed / farmReports.length) * 95)))
        : 88;

    // 4. Health Score (0 - 100)
    const healthyDays = farmReports.filter((r) => r.chickenCondition === 'healthy').length;
    const healthRatio = farmReports.length > 0 ? healthyDays / farmReports.length : 1;
    const mortality = Math.max(0, (currentFarm.initialChickens || 12) - (currentFarm.activeChickens || 12));
    const healthScore = Math.min(100, Math.max(30, Math.round(healthRatio * 95 - mortality * 5)));

    // Total Score (Weighted average: 35% prod + 25% report + 20% maintenance + 20% health)
    const totalScore = Math.round(
      productionScore * 0.35 +
      reportScore * 0.25 +
      maintenanceScore * 0.20 +
      healthScore * 0.20
    );

    let statusText: 'SANGAT BAIK' | 'BAIK' | 'CUKUP' | 'PERLU PERBAIKAN' = 'BAIK';
    if (totalScore >= 85) statusText = 'SANGAT BAIK';
    else if (totalScore >= 70) statusText = 'BAIK';
    else if (totalScore >= 55) statusText = 'CUKUP';
    else statusText = 'PERLU PERBAIKAN';

    // Streak Days
    const sortedDates = Array.from(new Set<string>(farmReports.map((r) => r.date))).sort().reverse();
    let streak = 0;
    if (sortedDates.length > 0) {
      streak = 1;
      for (let i = 0; i < sortedDates.length - 1; i++) {
        const d1 = new Date(sortedDates[i]).getTime();
        const d2 = new Date(sortedDates[i + 1]).getTime();
        const diffDays = Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }
    }

    const badges = [
      {
        id: 'badge-1',
        icon: '🥚',
        title: 'Mitra Telur Unggul',
        description: `Produktivitas kandang ${currentFarm.farmCode} rata-rata mencapai ${Math.round(avgProd)}%`,
        earnedDate: currentFarm.activationDate || '2026-08-01',
      },
      {
        id: 'badge-2',
        icon: '⭐',
        title: 'Disiplin Pelaporan',
        description: `${farmReports.length} laporan terekam rapi di sistem Eggnest`,
        earnedDate: farmReports[0]?.date || '2026-08-05',
      },
      {
        id: 'badge-3',
        icon: '🛡️',
        title: 'Garansi Bebas Risiko',
        description: `Populasi ${currentFarm.activeChickens} ekor ayam aktif terjaga prima`,
        earnedDate: currentFarm.warrantyEnd || '2026-08-20',
      },
    ];

    return {
      id: `score-${currentFarm.id}`,
      farmId: currentFarm.id,
      productionScore,
      reportScore,
      maintenanceScore,
      healthScore,
      totalScore,
      statusText,
      streakDays: streak,
      badges,
      updatedAt: new Date().toISOString(),
    };
  }, [currentFarm, reports, productivityRate]);

  // Actions
  const login = async (params: LoginParams) => {
    try {
      const res = await api.login(params);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        if (res.farm) {
          setCurrentFarm(res.farm);
        }
        if (res.user.role === 'admin') {
          setActivePage('admin');
        } else {
          setActivePage('beranda');
        }
        showToast(res.message);
        await refreshAllData();
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Login gagal.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal terhubung ke database server.' };
    }
  };

  const registerMember = async (params: RegisterParams) => {
    try {
      const res = await api.register(params);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        if (res.farm) {
          setCurrentFarm(res.farm);
        }
        setActivePage('beranda');
        showToast(res.message);
        await refreshAllData();
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Registrasi gagal.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal mendaftarkan user ke database.' };
    }
  };

  const logout = () => {
    removeToken();
    setCurrentUser(null);
    setActivePage('landing');
    showToast('Anda telah keluar dari aplikasi.');
  };

  const impersonateFarm = async (farmId: string) => {
    try {
      const res = await api.impersonate(farmId);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        if (res.farm) {
          setCurrentFarm(res.farm);
        }
        setActivePage('beranda');
        showToast(res.message);
        await refreshAllData();
      }
    } catch (err: any) {
      showToast(`⚠️ ${err.message || 'Gagal impersonasi kandang.'}`);
    }
  };

  const addDailyReport = async (data: {
    date: string;
    eggCount: number;
    feedKg: number;
    chickenCondition: ChickenCondition;
    issueTypes?: IssueType[];
    notes?: string;
    photoUrl?: string;
    videoUrl?: string;
  }) => {
    try {
      const res = await api.saveDailyReport({
        ...data,
        farmId: currentFarm.id,
      });

      showToast(`✅ Laporan ${data.date} tersimpan ke database! Produksi: ${data.eggCount} butir (${res.productivity}%)`);
      await refreshAllData();
      return { success: true, productivity: res.productivity, fcr: res.fcr };
    } catch (err: any) {
      showToast(`⚠️ Gagal menyimpan laporan: ${err.message}`);
      return { success: false, productivity: 0 };
    }
  };

  const createSupportTicket = async (data: {
    category: SupportCategory;
    title: string;
    description: string;
    eggCountToday?: number;
    photoUrl?: string;
    videoUrl?: string;
  }) => {
    try {
      const res = await api.createTicket(data);
      if (res.success && res.ticket) {
        showToast(res.message);
        await refreshAllData();
        return res.ticket;
      }
      return null;
    } catch (err: any) {
      showToast(`⚠️ Gagal membuat tiket: ${err.message}`);
      return null;
    }
  };

  const replyTicketMessage = async (ticketId: string, message: string) => {
    try {
      const res = await api.replyTicket(ticketId, message);
      showToast(res.message);
      await refreshAllData();
    } catch (err: any) {
      showToast(`⚠️ Gagal membalas tiket: ${err.message}`);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: SupportTicket['status'], adminNotes?: string) => {
    try {
      const res = await api.updateTicketStatus(ticketId, status, adminNotes);
      showToast(res.message);
      await refreshAllData();
    } catch (err: any) {
      showToast(`⚠️ Gagal update tiket: ${err.message}`);
    }
  };

  const createFarm = async (farmData: {
    ownerName?: string;
    phone?: string;
    location?: string;
    initialChickens?: number;
    chickenBreed?: string;
    initialAgeWeeks?: number;
  }) => {
    try {
      const res = await api.createFarm(farmData);
      showToast(res.message);
      await refreshAllData();
      return res.farm;
    } catch (err: any) {
      showToast(`⚠️ Gagal membuat farm: ${err.message}`);
      return null;
    }
  };

  const updateFarm = async (farmId: string, farmData: Partial<Farm>) => {
    try {
      const res = await api.updateFarm(farmId, farmData);
      showToast(res.message);
      await refreshAllData();
    } catch (err: any) {
      showToast(`⚠️ Gagal memperbarui farm: ${err.message}`);
    }
  };

  const createAcademyContent = async (content: Partial<AcademyContent>) => {
    try {
      const res = await api.createAcademy(content);
      showToast(res.message);
      await refreshAllData();
    } catch (err: any) {
      showToast(`⚠️ Gagal membuat materi: ${err.message}`);
    }
  };

  const updateAcademyContent = async (id: string, content: Partial<AcademyContent>) => {
    try {
      const res = await api.updateAcademy(id, content);
      showToast(res.message);
      await refreshAllData();
    } catch (err: any) {
      showToast(`⚠️ Gagal update materi: ${err.message}`);
    }
  };

  const deleteAcademyContent = async (id: string) => {
    try {
      const res = await api.deleteAcademy(id);
      showToast(res.message);
      await refreshAllData();
    } catch (err: any) {
      showToast(`⚠️ Gagal hapus materi: ${err.message}`);
    }
  };

  const togglePublishAcademy = async (id: string) => {
    try {
      const res = await api.togglePublishAcademy(id);
      showToast(res.message);
      await refreshAllData();
    } catch (err: any) {
      showToast(`⚠️ Gagal ubah status materi: ${err.message}`);
    }
  };

  const toggleRecommendAcademy = async (id: string) => {
    try {
      const res = await api.toggleRecommendAcademy(id);
      showToast(res.message);
      await refreshAllData();
    } catch (err: any) {
      showToast(`⚠️ Gagal ubah rekomendasi materi: ${err.message}`);
    }
  };

  const downloadExportExcel = async (type: 'members' | 'farms' | 'chickens' | 'reports' | 'scores' | 'tickets') => {
    try {
      showToast(`Menyiapkan file Excel ${type.toUpperCase()}...`);
      await api.downloadExportExcel(type);
      showToast(`File Excel ${type.toUpperCase()} berhasil diunduh.`);
    } catch (err: any) {
      showToast(`⚠️ Gagal mengunduh Excel: ${err.message}`);
    }
  };

  const validateImport = async (type: 'members' | 'farms' | 'chickens' | 'reports', rows: any[]) => {
    try {
      return await api.validateImport(type, rows);
    } catch (err: any) {
      showToast(`⚠️ Validasi gagal: ${err.message}`);
      throw err;
    }
  };

  const commitImport = async (type: 'members' | 'farms' | 'chickens' | 'reports', validRows: any[]) => {
    try {
      const res = await api.commitImport(type, validRows);
      showToast(res.message);
      await refreshAllData();
      return res;
    } catch (err: any) {
      showToast(`⚠️ Import gagal: ${err.message}`);
      throw err;
    }
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      const res = await api.updateSettings(newSettings);
      showToast(res.message);
      await refreshAllData();
    } catch (err: any) {
      showToast(`⚠️ Gagal menyimpan pengaturan: ${err.message}`);
    }
  };

  const resolveAdminAlert = async (id: string) => {
    try {
      const res = await api.resolveAlert(id);
      showToast(res.message);
      await refreshAllData();
    } catch (err: any) {
      showToast(`⚠️ Gagal menyelesaikan alert: ${err.message}`);
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    const res = await api.uploadFile(file);
    return res.url;
  };

  const resetToCleanDatabase = async () => {
    try {
      const res = await api.resetClean();
      showToast(res.message);
      await refreshAllData();
    } catch (err: any) {
      showToast(`⚠️ Gagal reset database: ${err.message}`);
    }
  };

  const loadDemoDatabase = async () => {
    try {
      const res = await api.seedDemo();
      showToast(res.message);
      await refreshAllData();
    } catch (err: any) {
      showToast(`⚠️ Gagal memuat data demo: ${err.message}`);
    }
  };

  return (
    <FarmContext.Provider
      value={{
        activePage,
        setActivePage,
        currentUser,
        setCurrentUser,
        users,
        farms,
        farm: currentFarm,
        setFarm: (newFarm) => setCurrentFarm(newFarm),
        reports,
        allReports,
        farmScore,
        tickets,
        academyContents,
        notifications,
        adminAlerts,
        settings,
        adminLogs,
        isLoading,
        isQuickReportOpen,
        setIsQuickReportOpen,
        textScale,
        setTextScale,
        todayReport,
        todayEggCount,
        monthEggCount,
        todayFeedKg,
        monthFeedKg,
        productivityRate,
        productivityStatus,
        estimatedEggValue,
        averageEggsPerDay,
        chickenCurrentAgeWeeks,
        fcr,
        login,
        registerMember,
        logout,
        impersonateFarm,
        addDailyReport,
        createSupportTicket,
        replyTicketMessage,
        updateTicketStatus,
        createFarm,
        updateFarm,
        createAcademyContent,
        updateAcademyContent,
        deleteAcademyContent,
        togglePublishAcademy,
        toggleRecommendAcademy,
        downloadExportExcel,
        validateImport,
        commitImport,
        updateSettings,
        resolveAdminAlert,
        markNotificationRead,
        uploadPhoto,
        resetToCleanDatabase,
        loadDemoDatabase,
        refreshAllData,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};
