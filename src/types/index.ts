export type UserRole = 'member' | 'admin' | 'mitra';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  passwordHash?: string;
  role: UserRole;
  status: UserStatus;
  farmId?: string;
  partnerId?: string;
  partnerCode?: string;
  createdAt: string;
  updatedAt?: string;
}

export type FarmStatus = 'unclaimed' | 'active' | 'warning' | 'critical' | 'inactive' | 'completed';

export interface Farm {
  id: string;
  farmCode: string;
  userId?: string;
  ownerUserId?: string;
  ownerName: string;
  phone: string;
  location: string;
  purchaseDate?: string;
  fullAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
  province?: string;
  regency?: string;
  district?: string;
  village?: string;
  partnerId?: string | null;
  partnerCode?: string;
  partnerName?: string;
  partnerPhone?: string;
  activationDate: string;
  initialChickens: number;
  activeChickens: number;
  chickenBreed: string;
  initialAgeWeeks: number;
  currentAgeWeeks: number;
  chickenAgeReferenceDate?: string;
  warrantyEnd: string;
  status: FarmStatus;
  photoUrl: string;
  profileComplete?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MitraProfile {
  id: string;
  partnerCode: string;
  name: string;
  phone: string;
  address?: string;
  province?: string;
  regency?: string;
  district?: string;
  village?: string;
  latitude?: number | null;
  longitude?: number | null;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type ChickenCondition = 'healthy' | 'issue';
export type ChickenHealthStatus = 'HEALTHY' | 'SICK' | 'DEAD' | 'REPLACED';
export type ChickenProblemType =
  | 'Tidak mau makan'
  | 'Lemas / Sayap Turun'
  | 'Feses Cair / Putih / Hijau'
  | 'Mata Berbusa / Bengkak'
  | 'Lumpuh / Sulit Berdiri'
  | 'Nafas Ngorok / Sesak'
  | 'Bulu Rontok Ekstrem'
  | 'Ayam sakit'
  | 'Ayam mati'
  | 'Lainnya';

export interface Chicken {
  id: string;
  farmId: string;
  chickenNumber: number;
  generation: number;
  status: ChickenHealthStatus;
  initialAgeWeeks: number;
  currentAgeWeeks: number;
  joinedDate: string;
  deathDate?: string;
  deathReason?: string;
  replacedByChickenId?: string;
  replacementOfChickenId?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  recentHealthReports?: ChickenHealthReport[];
}

export interface ChickenHealthProblem {
  id: string;
  healthReportId: string;
  problemType: ChickenProblemType | string;
  customNotes?: string;
  createdAt: string;
}

export interface ChickenHealthReport {
  id: string;
  dailyReportId: string;
  chickenId: string;
  chickenNumber: number;
  condition: 'HEALTHY' | 'SICK' | 'DEAD';
  date?: string;
  problems?: ChickenHealthProblem[];
  createdAt: string;
}

export type IssueType =
  | 'Ayam sakit'
  | 'Ayam mati'
  | 'Tidak mau makan'
  | 'Produksi menurun'
  | 'Lainnya'
  | 'Masalah lainnya';

export interface DailyReport {
  id: string;
  farmId: string;
  date: string;
  eggCount: number;
  feedKg: number;
  chickenCondition: ChickenCondition;
  issueTypes?: IssueType[];
  notes?: string;
  photoUrl?: string;
  videoUrl?: string;
  createdAt: string;
  updatedAt?: string;
  productivityRate: number;
  fcr?: number | null;
  layingChickens?: number[];
  reportedById?: string;
  reportedByName?: string;
  reportedByRole?: 'mitra' | 'admin';
  chickenReports?: {
    chickenId?: string;
    chickenNumber: number;
    condition: 'HEALTHY' | 'SICK' | 'DEAD';
    problemTypes?: string[];
    customNotes?: string;
  }[];
}

export interface FarmScore {
  id: string;
  farmId: string;
  productionScore: number;
  reportScore: number;
  maintenanceScore: number;
  healthScore: number;
  totalScore: number;
  statusText: 'SANGAT BAIK' | 'BAIK' | 'CUKUP' | 'PERLU PERBAIKAN';
  streakDays: number;
  badges: { id: string; icon: string; title: string; description: string; earnedDate: string }[];
  updatedAt: string;
}

export type SupportCategory =
  | 'Produksi Menurun'
  | 'Ayam Sakit'
  | 'Masalah Pakan'
  | 'Masalah Telur'
  | 'Telur Bermasalah'
  | 'Klaim Garansi'
  | 'Air Minum'
  | 'Lainnya';

export type SupportStatus = 'Diterima' | 'Diproses' | 'Solusi Diberikan' | 'Selesai';

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: 'member' | 'admin' | 'veterinarian' | 'mitra';
  message: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketCode: string;
  farmId: string;
  farmCode: string;
  userId?: string;
  ownerName: string;
  category: SupportCategory;
  title?: string;
  description: string;
  eggCountToday?: number;
  photoUrl?: string;
  videoUrl?: string;
  status: SupportStatus;
  adminNotes?: string;
  messages?: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

export type AcademyCategory =
  | 'Semua'
  | 'Perawatan Ayam'
  | 'Pakan'
  | 'Air Minum'
  | 'Kebersihan Kandang'
  | 'Produksi Telur'
  | 'Kesehatan Ayam'
  | 'Masalah Umum'
  | 'Permasalahan Umum';

export interface AcademyContent {
  id: string;
  title: string;
  category: AcademyCategory;
  description: string;
  content: string;
  type: 'video' | 'article';
  videoUrl?: string;
  duration?: string;
  thumbnail: string;
  ageMinWeeks?: number;
  ageMaxWeeks?: number;
  minChickenAgeWeek?: number;
  maxChickenAgeWeek?: number;
  readTime?: string;
  published?: boolean;
  isRecommended?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'alert';
  date: string;
  read: boolean;
  actionUrl?: string;
}

export interface AdminAlert {
  id: string;
  farmCode: string;
  farmId: string;
  ownerName: string;
  type: 'critical_drop' | 'warning_drop' | 'missed_reports' | 'sick_chicken' | 'dead_chicken' | 'other';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  dataSummary?: string;
  actionText: string;
  status?: 'active' | 'resolved';
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
}

export interface SystemSettings {
  eggPricePerKg: number;
  eggsPerKg: number;
  warningDropThreshold: number;
  criticalDropThreshold: number;
  warningMissedReportDays: number;
  criticalMissedReportDays: number;
  whatsappSupportNumber: string;
  companyName: string;
  companyAddress: string;
  logoUrl?: string;
}

export interface AdminLog {
  id: string;
  adminName: string;
  action: string;
  target: string;
  timestamp: string;
}
