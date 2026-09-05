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
import { DEFAULT_SETTINGS } from '../data/mockData';
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
    farmCode?: string;
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

const EMPTY_FARM: Farm = {
  id: '',
  farmCode: '',
  ownerName: '',
  phone: '',
  location: '',
  activationDate: '',
  initialChickens: 0,
  activeChickens: 0,
  chickenBreed: '',
  initialAgeWeeks: 0,
  currentAgeWeeks: 0,
  warrantyEnd: '',
  status: 'unclaimed',
  photoUrl: '',
};

const normalizeUser = (raw: any): User =>
  ({
    ...raw,
    id: String(raw?.id ?? ''),
    phone: String(raw?.phone ?? ''),
    email: raw?.email ?? undefined,
    fullName: String(raw?.fullName ?? raw?.full_name ?? ''),
    role: raw?.role ?? 'member',
    status: raw?.status ?? 'active',
    farmId: raw?.farmId ?? raw?.farm_id ?? undefined,
    createdAt: raw?.createdAt ?? raw?.created_at ?? undefined,
    updatedAt: raw?.updatedAt ?? raw?.updated_at ?? undefined,
  } as User);

const normalizeFarm = (raw: any): Farm =>
  ({
    ...raw,
    id: String(raw?.id ?? ''),
    farmCode: String(raw?.farmCode ?? raw?.farm_code ?? ''),
    ownerName: String(raw?.ownerName ?? raw?.owner_name ?? ''),
    phone: String(raw?.phone ?? ''),
    location: String(raw?.location ?? ''),
    activationDate: String(raw?.activationDate ?? raw?.activation_date ?? ''),
    initialChickens: Number(raw?.initialChickens ?? raw?.initial_chickens ?? 0),
    activeChickens: Number(raw?.activeChickens ?? raw?.active_chickens ?? 0),
    chickenBreed: String(raw?.chickenBreed ?? raw?.chicken_breed ?? ''),
    initialAgeWeeks: Number(raw?.initialAgeWeeks ?? raw?.initial_age_weeks ?? 0),
    currentAgeWeeks: Number(raw?.currentAgeWeeks ?? raw?.current_age_weeks ?? 0),
    warrantyEnd: String(raw?.warrantyEnd ?? raw?.warranty_end ?? ''),
    status: raw?.status ?? 'unclaimed',
    photoUrl: String(raw?.photoUrl ?? raw?.photo_url ?? ''),
    userId: raw?.userId ?? raw?.ownerUserId ?? raw?.owner_user_id ?? undefined,
    ownerUserId: raw?.ownerUserId ?? raw?.owner_user_id ?? undefined,
    createdAt: raw?.createdAt ?? raw?.created_at ?? undefined,
    updatedAt: raw?.updatedAt ?? raw?.updated_at ?? undefined,
  } as Farm);

const normalizeReport = (raw: any): DailyReport =>
  ({
    ...raw,
    id: String(raw?.id ?? ''),
    farmId: String(raw?.farmId ?? raw?.farm_id ?? ''),
    date: String(raw?.date ?? raw?.reportDate ?? raw?.report_date ?? ''),
    eggCount: Number(raw?.eggCount ?? raw?.egg_count ?? 0),
    feedKg: Number(raw?.feedKg ?? raw?.feed_kg ?? 0),
    chickenCondition: raw?.chickenCondition ?? raw?.chicken_condition ?? 'healthy',
    issueTypes:
      raw?.issueTypes ??
      (typeof raw?.issue_types === 'string'
        ? (() => {
            try {
              return JSON.parse(raw.issue_types);
            } catch {
              return [];
            }
          })()
        : raw?.issue_types ?? []),
    notes: raw?.notes ?? undefined,
    photoUrl: raw?.photoUrl ?? raw?.photo_url ?? undefined,
    videoUrl: raw?.videoUrl ?? raw?.video_url ?? undefined,
    productivityRate: Number(raw?.productivityRate ?? raw?.productivity_rate ?? 0),
    fcr: raw?.fcr == null ? null : Number(raw.fcr),
    createdAt: raw?.createdAt ?? raw?.created_at ?? undefined,
    updatedAt: raw?.updatedAt ?? raw?.updated_at ?? undefined,
  } as DailyReport);

const localDateKey = (value: Date = new Date()): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<ActivePage>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentFarm, setCurrentFarm] = useState<Farm>(EMPTY_FARM);

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

  // Load all data from the real backend database.
  // Important: this function uses the session returned by /auth/me in the same call,
  // so it does not depend on stale React state after login/register.
  const refreshAllData = useCallback(async () => {
    try {
      setIsLoading(true);

      try {
        const setRes = await api.getSettings();
        if (setRes.success && setRes.settings) {
          setSettings((prev) => ({ ...prev, ...setRes.settings }));
        }
      } catch {}

      const token = getToken();
      if (!token) {
        setCurrentUser(null);
        setCurrentFarm(EMPTY_FARM);
        setFarms([]);
        setAllReports([]);
        setTickets([]);
        setAdminAlerts([]);
        setAdminLogs([]);
        return;
      }

      let sessionUser: User | null = null;
      let sessionFarm: Farm = EMPTY_FARM;

      try {
        const meRes = await api.getMe();
        if (!meRes.success || !meRes.user) {
          throw new Error('Session tidak valid');
        }

        sessionUser = normalizeUser(meRes.user);
        setCurrentUser(sessionUser);

        if (meRes.farm) {
          sessionFarm = normalizeFarm(meRes.farm);
          setCurrentFarm(sessionFarm);
        } else {
          setCurrentFarm(EMPTY_FARM);
        }
      } catch {
        removeToken();
        setCurrentUser(null);
        setCurrentFarm(EMPTY_FARM);
        setFarms([]);
        setAllReports([]);
        return;
      }

      try {
        const farmsRes = await api.getFarms();
        if (farmsRes.success && farmsRes.farms) {
          const normalizedFarms = farmsRes.farms.map(normalizeFarm);
          setFarms(normalizedFarms);

          if (sessionUser.role === 'member') {
            const ownFarm =
              normalizedFarms.find((f) => f.id === sessionUser?.farmId) ||
              normalizedFarms.find((f) => f.id === sessionFarm.id);

            if (ownFarm) {
              sessionFarm = ownFarm;
              setCurrentFarm(ownFarm);
            }
          }
        }
      } catch {}

      // Admin receives all reports. Member receives only their own farm reports.
      try {
        const reportsRes =
          sessionUser.role === 'admin'
            ? await api.getReports()
            : sessionFarm.id
            ? await api.getReports(sessionFarm.id)
            : { success: true, reports: [] as DailyReport[] };

        if (reportsRes.success && reportsRes.reports) {
          setAllReports(reportsRes.reports.map(normalizeReport));
        } else {
          setAllReports([]);
        }
      } catch {
        setAllReports([]);
      }

      try {
        const ticketsRes = await api.getTickets();
        if (ticketsRes.success && ticketsRes.tickets) {
          setTickets(ticketsRes.tickets);
        }
      } catch {}

      try {
        const acadRes = await api.getAcademy(true);
        if (acadRes.success && acadRes.contents) {
          setAcademyContents(acadRes.contents);
        }
      } catch {}

      if (sessionUser.role === 'admin') {
        try {
          const alertRes = await api.getAlerts();
          if (alertRes.success && alertRes.alerts) {
            setAdminAlerts(alertRes.alerts);
          }
        } catch {}

        try {
          const logRes = await api.getAuditLogs();
          if (logRes.success && logRes.logs) {
            setAdminLogs(logRes.logs);
          }
        } catch {}
      } else {
        setAdminAlerts([]);
        setAdminLogs([]);
      }
    } catch (error) {
      console.error('Error refreshing backend data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Reports for the currently logged-in member farm
  const reports = useMemo(() => {
    if (!currentFarm.id) return [];
    return allReports
      .filter((r) => r.farmId === currentFarm.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [allReports, currentFarm.id]);

  // Dynamic Age calculation from activation date & initial weeks
  const chickenCurrentAgeWeeks = useMemo(() => {
    if (!currentFarm.activationDate) return currentFarm.initialAgeWeeks || 18;
    try {
      const actDate = new Date(currentFarm.activationDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - actDate.getTime());
      const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
      return (currentFarm.initialAgeWeeks || 18) + diffWeeks;
    } catch (e) {
      return currentFarm.currentAgeWeeks || 22;
    }
  }, [currentFarm]);

  // Database-driven calculations using the actual local date
  const todayKey = localDateKey();
  const currentMonthKey = todayKey.slice(0, 7);
  const todayReport = reports.find((r) => r.date === todayKey);
  const todayEggCount = todayReport ? todayReport.eggCount : 0;
  const todayFeedKg = todayReport ? todayReport.feedKg : 0;

  const currentMonthReports = reports.filter((r) => r.date.startsWith(currentMonthKey));
  const monthEggCount = currentMonthReports.reduce((sum, r) => sum + (r.eggCount || 0), 0);
  const monthFeedKg = Number(
    currentMonthReports.reduce((sum, r) => sum + (r.feedKg || 0), 0).toFixed(1)
  );
  const averageEggsPerDay =
    currentMonthReports.length > 0
      ? Number((monthEggCount / currentMonthReports.length).toFixed(1))
      : 0;

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

  // Dynamic Farm Score calculation based only on real persisted reports.
  // Minimum 7 reporting days are required before an official score, tier, reward,
  // or achievement is issued. Before that, all score values stay at 0.
  const farmScore: FarmScore = useMemo(() => {
    const farmReports = reports;
    const minimumReportsForScore = 7;
    const hasEnoughData = farmReports.length >= minimumReportsForScore;

    // Streak is still useful while collecting data, so it is calculated from day one.
    const sortedDates = Array.from(new Set<string>(farmReports.map((r) => r.date)))
      .filter(Boolean)
      .sort()
      .reverse();

    let streak = 0;
    if (sortedDates.length > 0) {
      streak = 1;
      for (let i = 0; i < sortedDates.length - 1; i++) {
        const d1 = new Date(`${sortedDates[i]}T00:00:00`).getTime();
        const d2 = new Date(`${sortedDates[i + 1]}T00:00:00`).getTime();
        const diffDays = Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }
    }

    // New farms must not receive fabricated scores or badges.
    if (!hasEnoughData) {
      return {
        id: `score-${currentFarm.id || 'pending'}`,
        farmId: currentFarm.id,
        productionScore: 0,
        reportScore: 0,
        maintenanceScore: 0,
        healthScore: 0,
        totalScore: 0,
        statusText: 'PERLU PERBAIKAN',
        streakDays: streak,
        badges: [],
        updatedAt: new Date().toISOString(),
      };
    }

    // 1. Production Score (0 - 100)
    // Uses the actual average productivity recorded in daily reports.
    const avgProd =
      farmReports.reduce((acc, r) => acc + Number(r.productivityRate || 0), 0) /
      farmReports.length;
    const productionScore = Math.min(100, Math.max(0, Math.round(avgProd)));

    // 2. Reporting Score (0 - 100)
    // Rewards consistency across unique reporting dates, capped at 30 days.
    const uniqueReportDays = new Set(farmReports.map((r) => r.date).filter(Boolean)).size;
    const reportScore = Math.min(
      100,
      Math.max(0, Math.round((Math.min(uniqueReportDays, 30) / 30) * 100))
    );

    // 3. Maintenance Score (0 - 100)
    // A day is counted as maintained when feed was actually recorded above zero.
    const daysWithFeed = farmReports.filter((r) => Number(r.feedKg || 0) > 0).length;
    const maintenanceScore = Math.min(
      100,
      Math.max(0, Math.round((daysWithFeed / farmReports.length) * 100))
    );

    // 4. Health Score (0 - 100)
    // Based on healthy reporting days and actual chicken mortality.
    const healthyDays = farmReports.filter((r) => r.chickenCondition === 'healthy').length;
    const healthRatio = healthyDays / farmReports.length;
    const initialChickens = Math.max(0, currentFarm.initialChickens || 0);
    const activeChickens = Math.max(0, currentFarm.activeChickens || 0);
    const mortality = Math.max(0, initialChickens - activeChickens);
    const mortalityPenalty =
      initialChickens > 0 ? Math.round((mortality / initialChickens) * 100) : 0;
    const healthScore = Math.min(
      100,
      Math.max(0, Math.round(healthRatio * 100) - mortalityPenalty)
    );

    // Weighted total: 35% production + 25% reporting + 20% maintenance + 20% health.
    const totalScore = Math.round(
      productionScore * 0.35 +
        reportScore * 0.25 +
        maintenanceScore * 0.2 +
        healthScore * 0.2
    );

    let statusText: 'SANGAT BAIK' | 'BAIK' | 'CUKUP' | 'PERLU PERBAIKAN' =
      'PERLU PERBAIKAN';
    if (totalScore >= 85) statusText = 'SANGAT BAIK';
    else if (totalScore >= 70) statusText = 'BAIK';
    else if (totalScore >= 55) statusText = 'CUKUP';

    // Achievements are earned from real thresholds only.
    const badges: FarmScore['badges'] = [];
    const latestReportDate = sortedDates[0] || localDateKey();

    if (avgProd >= 80) {
      badges.push({
        id: 'badge-production',
        icon: '🥚',
        title: 'Mitra Telur Unggul',
        description: `Rata-rata produktivitas kandang ${currentFarm.farmCode} mencapai ${Math.round(
          avgProd
        )}% dari data laporan aktual.`,
        earnedDate: latestReportDate,
      });
    }

    if (streak >= 7) {
      badges.push({
        id: 'badge-reporting',
        icon: '⭐',
        title: 'Disiplin Pelaporan',
        description: `${streak} hari laporan kandang tercatat berturut-turut di sistem Eggnest.`,
        earnedDate: latestReportDate,
      });
    }

    if (mortality === 0 && healthRatio >= 0.9) {
      badges.push({
        id: 'badge-health',
        icon: '🛡️',
        title: 'Kesehatan Kandang Terjaga',
        description: `Tidak ada mortalitas dan ${Math.round(
          healthRatio * 100
        )}% laporan menunjukkan kondisi ayam sehat.`,
        earnedDate: latestReportDate,
      });
    }

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
  }, [currentFarm, reports]);

  // Actions
  const login = async (params: LoginParams) => {
    try {
      const res = await api.login(params);
      if (res.success && res.user) {
        const normalizedUser = normalizeUser(res.user);
        setCurrentUser(normalizedUser);
        if (res.farm) {
          setCurrentFarm(normalizeFarm(res.farm));
        }
        if (normalizedUser.role === 'admin') {
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
        setCurrentUser(normalizeUser(res.user));
        if (res.farm) {
          setCurrentFarm(normalizeFarm(res.farm));
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
    setCurrentFarm(EMPTY_FARM);
    setFarms([]);
    setAllReports([]);
    setTickets([]);
    setAdminAlerts([]);
    setAdminLogs([]);
    setActivePage('landing');
    showToast('Anda telah keluar dari aplikasi.');
  };

  const impersonateFarm = async (farmId: string) => {
    try {
      const res = await api.impersonate(farmId);
      if (res.success && res.user) {
        setCurrentUser(normalizeUser(res.user));
        if (res.farm) {
          setCurrentFarm(normalizeFarm(res.farm));
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
      if (!currentFarm.id || !currentFarm.farmCode) {
        throw new Error('Farm ID belum terhubung ke akun ini. Silakan login ulang atau hubungi Admin Eggnest.');
      }

      const res = await api.saveDailyReport({
        ...data,
        farmId: currentFarm.id,
      });

      // Fetch again from database immediately so History updates from persisted data,
      // not from temporary frontend state.
      const reportsRes = await api.getReports(currentFarm.id);
      if (reportsRes.success) {
        setAllReports(reportsRes.reports.map(normalizeReport));
      }

      showToast(
        `✅ Laporan ${data.date} tersimpan ke database! Produksi: ${data.eggCount} butir (${res.productivity}%)`
      );
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
    farmCode?: string;
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
