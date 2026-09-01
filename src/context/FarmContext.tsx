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
  Chicken,
  ChickenHealthReport,
} from '../types';
import {
  DEFAULT_SETTINGS,
  INITIAL_USERS,
  INITIAL_FARMS,
  INITIAL_REPORTS,
  INITIAL_FARM_SCORE,
  INITIAL_NOTIFICATIONS,
  INITIAL_TICKETS,
  ACADEMY_CONTENTS,
  INITIAL_ADMIN_ALERTS,
} from '../data/mockData';
import { api, getStoredToken, getStoredUser, setStoredToken, setStoredUser } from '../services/api';

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
  farm: Farm; // active farm for current user / session
  setFarm: (farm: Farm) => void;
  reports: DailyReport[]; // reports for current farm
  allReports: DailyReport[]; // all reports in database
  farmScore: FarmScore;
  tickets: SupportTicket[];
  academyContents: AcademyContent[];
  notifications: NotificationItem[];
  adminAlerts: AdminAlert[];
  settings: SystemSettings;
  adminLogs: AdminLog[];
  chickens: Chicken[]; // chickens for active farm
  allChickens: Chicken[]; // all chickens
  fetchChickens: (farmId?: string) => Promise<Chicken[]>;
  replaceChicken: (chickenId: string, data: { notes?: string; ageWeeks?: number }) => Promise<Chicken | null>;
  selectedChickenId: string | null;
  setSelectedChickenId: (id: string | null) => void;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  
  isQuickReportOpen: boolean;
  setIsQuickReportOpen: (open: boolean) => void;
  textScale: TextScale;
  setTextScale: (scale: TextScale) => void;
  
  // Dynamic Calculations based on settings & database data
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
  fcrRatio: number; // Feed Conversion Ratio

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
    chickenReports?: {
      chickenId?: string;
      chickenNumber?: number;
      condition: 'HEALTHY' | 'SICK' | 'DEAD';
      problemTypes?: string[];
      customNotes?: string;
    }[];
  }) => Promise<{ success: boolean; productivity: number }>;

  createSupportTicket: (ticket: {
    category: SupportCategory;
    title: string;
    description: string;
    eggCountToday?: number;
    photoUrl?: string;
    videoUrl?: string;
  }) => Promise<SupportTicket | null>;

  replyTicketMessage: (ticketId: string, message: string, attachmentUrl?: string) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status'], adminNotes?: string) => Promise<void>;
  
  // Farm & Member Management
  createFarm: (farmData: Partial<Farm>) => Promise<Farm | null>;
  updateFarm: (farmId: string, farmData: Partial<Farm>) => Promise<void>;
  createMember: (userData: Omit<User, 'id' | 'createdAt'>) => User;
  updateMember: (userId: string, userData: Partial<User>) => void;
  toggleMemberStatus: (userId: string) => void;

  // Academy Management
  createAcademyContent: (content: Partial<AcademyContent>) => Promise<void>;
  updateAcademyContent: (id: string, content: Partial<AcademyContent>) => Promise<void>;
  deleteAcademyContent: (id: string) => Promise<void>;
  togglePublishAcademy: (id: string) => Promise<void>;

  // Settings & Alerts
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  resolveAdminAlert: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  
  // Demo Reset / Seed Helpers
  resetToCleanDatabase: () => Promise<void>;
  loadDemoDatabase: () => Promise<void>;

  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & User session
  const [activePage, setActivePage] = useState<ActivePage>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser() || INITIAL_USERS[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [textScale, setTextScale] = useState<TextScale>('normal');
  const [isQuickReportOpen, setIsQuickReportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Core State
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [farms, setFarms] = useState<Farm[]>(INITIAL_FARMS);
  const [allReports, setAllReports] = useState<DailyReport[]>(INITIAL_REPORTS);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [academyContents, setAcademyContents] = useState<AcademyContent[]>(ACADEMY_CONTENTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [adminAlerts, setAdminAlerts] = useState<AdminAlert[]>(INITIAL_ADMIN_ALERTS);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([
    {
      id: 'log-1',
      adminName: 'Admin Utama',
      action: 'Aktivasi Farm EN-000127',
      target: 'Budi Santoso',
      timestamp: '2026-07-20 08:30',
    },
  ]);
  const [farmScore, setFarmScore] = useState<FarmScore>(INITIAL_FARM_SCORE);
  const [chickens, setChickens] = useState<Chicken[]>([]);
  const [allChickens, setAllChickens] = useState<Chicken[]>([]);
  const [selectedChickenId, setSelectedChickenId] = useState<string | null>(null);

  // Active Farm for current logged in user
  const currentFarm: Farm = useMemo(() => {
    if (currentUser?.farmId) {
      const found = farms.find((f) => f.id === currentUser.farmId);
      if (found) return found;
    }
    return farms[0] || INITIAL_FARMS[0];
  }, [currentUser, farms]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  const fetchChickens = useCallback(async (farmId?: string) => {
    const targetId = farmId || currentFarm?.id;
    if (!targetId) return [];
    try {
      const res = await api.getChickens(targetId);
      if (res?.success && res.chickens) {
        setChickens(res.chickens);
        return res.chickens;
      }
      return [];
    } catch (e) {
      console.warn('Failed to fetch chickens:', e);
      return [];
    }
  }, [currentFarm?.id]);

  // Fetch all live database state from Backend API
  const refreshData = useCallback(async () => {
    try {
      // 1. Settings
      const settingsRes = await api.getSettings().catch(() => null);
      if (settingsRes?.settings) {
        setSettings(settingsRes.settings);
      }

      // 2. Farms
      const farmsRes = await api.getFarms().catch(() => null);
      if (farmsRes?.farms && farmsRes.farms.length > 0) {
        setFarms(farmsRes.farms);
      }

      // 3. Reports
      const reportsRes = await api.getReports().catch(() => null);
      if (reportsRes?.reports) {
        setAllReports(reportsRes.reports);
      }

      // 4. Chickens for active farm
      if (currentFarm?.id) {
        const chkRes = await api.getChickens(currentFarm.id).catch(() => null);
        if (chkRes?.chickens) {
          setChickens(chkRes.chickens);
        }
      }

      // 5. Tickets
      const ticketsRes = await api.getTickets().catch(() => null);
      if (ticketsRes?.tickets) {
        setTickets(ticketsRes.tickets);
      }

      // 6. Academy Contents
      const acadRes = await api.getAcademy().catch(() => null);
      if (acadRes?.contents) {
        setAcademyContents(acadRes.contents);
      }

      // 7. Alerts
      const alertsRes = await api.getAlerts().catch(() => null);
      if (alertsRes?.alerts) {
        setAdminAlerts(alertsRes.alerts);
      }

      // 8. Admin Logs
      const logsRes = await api.getAdminLogs().catch(() => null);
      if (logsRes?.logs) {
        setAdminLogs(logsRes.logs);
      }
    } catch (err) {
      console.warn('Sync with database backend:', err);
    }
  }, [currentFarm?.id]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Reports for current active farm
  const reports = useMemo(() => {
    return allReports
      .filter((r) => r.farmId === currentFarm.id)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allReports, currentFarm.id]);

  // Dynamic Age calculation from activation date & initial weeks
  const chickenCurrentAgeWeeks = useMemo(() => {
    if (!currentFarm.activationDate || currentFarm.activationDate.includes('Belum')) {
      return currentFarm.initialAgeWeeks || 18;
    }
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

  // Dynamic calculations for current farm
  const todayReport = reports.find((r) => r.date === '2026-08-31') || reports[reports.length - 1];
  const todayEggCount = todayReport ? todayReport.eggCount : 0;
  const todayFeedKg = todayReport ? todayReport.feedKg : 0;

  const augustReports = reports.filter((r) => r.date.startsWith('2026-08'));
  const monthEggCount = augustReports.reduce((sum, r) => sum + r.eggCount, 0);
  const monthFeedKg = Number(augustReports.reduce((sum, r) => sum + r.feedKg, 0).toFixed(1));
  const averageEggsPerDay =
    augustReports.length > 0
      ? Number((monthEggCount / augustReports.length).toFixed(1))
      : 0;

  // Productivity = (todayEgg / activeChickens) * 100
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

  // Egg value = (totalTelur / eggsPerKg) * pricePerKg from Admin Settings
  const eggsPerKg = settings.eggsPerKg || 16;
  const eggPricePerKg = settings.eggPricePerKg || 32000;
  const estimatedEggValue = Math.round((monthEggCount / eggsPerKg) * eggPricePerKg);

  // FCR (Feed Conversion Ratio) = Total Feed Consumed (kg) / Total Egg Mass (kg)
  // Egg Mass = Total Eggs / eggsPerKg (in kg)
  const totalEggMassKg = monthEggCount > 0 ? monthEggCount / eggsPerKg : 0;
  const fcrRatio = totalEggMassKg > 0 && monthFeedKg > 0 ? Number((monthFeedKg / totalEggMassKg).toFixed(2)) : 0;

  // 1. Authentication: LOGIN
  const login = async (params: LoginParams) => {
    try {
      setIsLoading(true);
      const res = await api.login(params);
      if (res.success) {
        setCurrentUser(res.user);
        if (params.role === 'admin') {
          setActivePage('admin');
        } else {
          setActivePage('beranda');
        }
        showToast(`✅ ${res.message}`);
        await refreshData();
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Login gagal.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Terjadi kesalahan saat login.' };
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Authentication: REGISTER MEMBER
  const registerMember = async (params: RegisterParams) => {
    try {
      setIsLoading(true);
      const res = await api.register(params);
      if (res.success) {
        setCurrentUser(res.user);
        setActivePage('beranda');
        showToast(`🎉 ${res.message}`);
        await refreshData();
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Registrasi gagal.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal mendaftar. Periksa Farm ID Anda.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setCurrentUser(null);
    setActivePage('landing');
    showToast('Anda telah keluar dari aplikasi.');
  };

  // Admin Impersonation
  const impersonateFarm = async (farmId: string) => {
    try {
      setIsLoading(true);
      const res = await api.impersonate({ farmId });
      if (res.success) {
        setCurrentUser(res.user);
        setActivePage('beranda');
        showToast(res.message);
        await refreshData();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal melakukan impersonasi.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Add / Edit Daily Report
  const addDailyReport = async (data: {
    date: string;
    eggCount: number;
    feedKg: number;
    chickenCondition: ChickenCondition;
    issueTypes?: IssueType[];
    notes?: string;
    photoUrl?: string;
    videoUrl?: string;
    chickenReports?: {
      chickenId?: string;
      chickenNumber?: number;
      condition: 'HEALTHY' | 'SICK' | 'DEAD';
      problemTypes?: string[];
      customNotes?: string;
    }[];
  }) => {
    try {
      const res = await api.saveReport({
        farmId: currentFarm.id,
        date: data.date,
        eggCount: data.eggCount,
        feedKg: data.feedKg,
        chickenCondition: data.chickenCondition,
        issueTypes: data.issueTypes,
        notes: data.notes,
        photoUrl: data.photoUrl,
        videoUrl: data.videoUrl,
        chickenReports: data.chickenReports,
      });

      if (res.success) {
        showToast(res.message);
        await refreshData();
        return { success: true, productivity: res.productivity };
      }
      return { success: false, productivity: 0 };
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan laporan.');
      return { success: false, productivity: 0 };
    }
  };

  // 3B. Replace Chicken
  const replaceChicken = async (chickenId: string, data: { notes?: string; ageWeeks?: number }) => {
    try {
      const res = await api.replaceChicken(chickenId, data);
      if (res.success) {
        showToast(res.message);
        await refreshData();
        return res.chicken;
      }
      return null;
    } catch (err: any) {
      showToast(err.message || 'Gagal memproses penggantian ayam.');
      return null;
    }
  };

  // 4. Support Ticket
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
      if (res.success) {
        showToast(res.message);
        await refreshData();
        return res.ticket;
      }
      return null;
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat tiket konsultasi.');
      return null;
    }
  };

  const replyTicketMessage = async (ticketId: string, message: string, attachmentUrl?: string) => {
    try {
      const res = await api.replyTicket(ticketId, message, attachmentUrl);
      if (res.success) {
        showToast('Pesan balasan tiket terkirim.');
        await refreshData();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim balasan tiket.');
    }
  };

  const updateTicketStatus = async (
    ticketId: string,
    status: SupportTicket['status'],
    adminNotes?: string
  ) => {
    try {
      const res = await api.updateTicketStatus(ticketId, status, adminNotes);
      if (res.success) {
        showToast(`Status tiket diperbarui menjadi: ${status}`);
        await refreshData();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui status tiket.');
    }
  };

  // 5. Farm Management
  const createFarm = async (farmData: Partial<Farm>) => {
    try {
      const res = await api.createFarm(farmData);
      if (res.success) {
        showToast(`✅ Kandang baru ${res.farm.farmCode} berhasil didaftarkan.`);
        await refreshData();
        return res.farm;
      }
      return null;
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat data kandang baru.');
      return null;
    }
  };

  const updateFarm = async (farmId: string, farmData: Partial<Farm>) => {
    try {
      const res = await api.updateFarm(farmId, farmData);
      if (res.success) {
        showToast('Data kandang berhasil diperbarui.');
        await refreshData();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui data kandang.');
    }
  };

  // Member Management
  const createMember = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    showToast(`Member ${newUser.fullName} berhasil ditambahkan.`);
    return newUser;
  };

  const updateMember = (userId: string, userData: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...userData } : u)));
    showToast('Data member berhasil diperbarui.');
  };

  const toggleMemberStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
      )
    );
    showToast('Status keaktifan member diperbarui.');
  };

  // 6. Academy CMS
  const createAcademyContent = async (content: Partial<AcademyContent>) => {
    try {
      const res = await api.createAcademy(content);
      if (res.success) {
        showToast('Materi Academy baru berhasil ditambahkan.');
        await refreshData();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal menambahkan materi academy.');
    }
  };

  const updateAcademyContent = async (id: string, content: Partial<AcademyContent>) => {
    try {
      const res = await api.updateAcademy(id, content);
      if (res.success) {
        showToast('Materi Academy diperbarui.');
        await refreshData();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui materi academy.');
    }
  };

  const deleteAcademyContent = async (id: string) => {
    try {
      const res = await api.deleteAcademy(id);
      if (res.success) {
        showToast(res.message);
        await refreshData();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus materi academy.');
    }
  };

  const togglePublishAcademy = async (id: string) => {
    try {
      const res = await api.togglePublishAcademy(id);
      if (res.success) {
        showToast(res.published ? 'Materi dipublikasikan ke member.' : 'Materi ditarik (unpublish).');
        await refreshData();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status publish.');
    }
  };

  // 7. Settings & Alerts
  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      const res = await api.updateSettings(newSettings);
      if (res.success) {
        setSettings(res.settings);
        showToast('Pengaturan sistem berhasil disimpan.');
        await refreshData();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan pengaturan.');
    }
  };

  const resolveAdminAlert = async (id: string) => {
    try {
      const res = await api.resolveAlert(id);
      if (res.success) {
        showToast('Smart alert ditandai selesai.');
        await refreshData();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal menandai alert.');
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // 8. Reset & Demo Seeding
  const resetToCleanDatabase = async () => {
    try {
      const res = await api.resetCleanDatabase();
      if (res.success) {
        showToast('Database dikosongkan (Empty State mode aktif).');
        await refreshData();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal mengosongkan database.');
    }
  };

  const loadDemoDatabase = async () => {
    try {
      const res = await api.seedDemoDatabase();
      if (res.success) {
        showToast('Data demo berhasil dimuat ke database.');
        await refreshData();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat demo database.');
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
        setFarm: (newFarm) => {
          setFarms((prev) => prev.map((f) => (f.id === newFarm.id ? newFarm : f)));
        },
        reports,
        allReports,
        farmScore,
        tickets,
        academyContents,
        notifications,
        adminAlerts,
        settings,
        adminLogs,
        chickens,
        allChickens,
        fetchChickens,
        replaceChicken,
        selectedChickenId,
        setSelectedChickenId,
        isLoading,
        refreshData,
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
        fcrRatio,
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
        createMember,
        updateMember,
        toggleMemberStatus,
        createAcademyContent,
        updateAcademyContent,
        deleteAcademyContent,
        togglePublishAcademy,
        updateSettings,
        resolveAdminAlert,
        markNotificationRead,
        resetToCleanDatabase,
        loadDemoDatabase,
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
