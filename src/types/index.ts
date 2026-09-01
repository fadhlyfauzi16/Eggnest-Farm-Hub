export type UserRole = 'member' | 'admin';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  passwordHash?: string;
  role: UserRole;
  status: UserStatus;
  farmId?: string; // associated Farm ID
  createdAt: string;
  updatedAt?: string;
}

export type FarmStatus = 'unclaimed' | 'active' | 'warning' | 'critical' | 'inactive' | 'completed';

export interface Farm {
  id: string;
  farmCode: string; // e.g. EN-000001, EN-000127
  userId?: string; // null until claimed
  ownerName: string;
  phone: string;
  location: string;
  purchaseDate?: string;
  activationDate: string; // e.g. YYYY-MM-DD or readable
  initialChickens: number;
  activeChickens: number;
  chickenBreed: string;
  initialAgeWeeks: number;
  currentAgeWeeks: number;
  warrantyEnd: string;
  status: 'active' | 'warning' | 'critical' | 'unclaimed';
  photoUrl: string;
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
  date: string; // YYYY-MM-DD
  eggCount: number;
  feedKg: number;
  chickenCondition: ChickenCondition;
  issueTypes?: IssueType[];
  notes?: string;
  photoUrl?: string;
  videoUrl?: string;
  createdAt: string;
  updatedAt?: string;
  productivityRate: number; // in percentage, e.g. 83.3%
  chickenReports?: {
    chickenId: string;
    chickenNumber: number;
    condition: 'HEALTHY' | 'SICK' | 'DEAD';
    problemTypes?: string[];
    customNotes?: string;
  }[];
}

export interface FarmScore {
  id: string;
  farmId: string;
  productionScore: number; // out of 100
  reportScore: number; // out of 100
  maintenanceScore: number; // out of 100
  healthScore: number; // out of 100
  totalScore: number; // out of 100
  statusText: 'SANGAT BAIK' | 'BAIK' | 'CUKUP' | 'PERLU PERBAIKAN';
  streakDays: number;
  badges: {
    id: string;
    icon: string;
    title: string;
    description: string;
    earnedDate: string;
  }[];
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
  senderRole: 'member' | 'admin' | 'veterinarian';
  message: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketCode: string; // e.g. EN-CS-000001
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
  eggPricePerKg: number; // e.g. 32000
  eggsPerKg: number; // e.g. 16
  warningDropThreshold: number; // e.g. 15 (%)
  criticalDropThreshold: number; // e.g. 30 (%)
  warningMissedReportDays: number; // e.g. 3 (hari)
  criticalMissedReportDays: number; // e.g. 4 (hari)
  whatsappSupportNumber: string; // e.g. "0812-8899-7700"
  companyName: string; // e.g. "Eggnest Indonesia"
  companyAddress: string; // e.g. "Jakarta, Indonesia"
  logoUrl?: string;
}

export interface AdminLog {
  id: string;
  adminName: string;
  action: string;
  target: string;
  timestamp: string;
}
