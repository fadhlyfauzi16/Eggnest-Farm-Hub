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

export const ROUTES = {
  LANDING: '/',
  AUTH: '/auth',
  LOGIN: '/login',
  REGISTER: '/register',
  HOME: '/home',
  REPORTS: '/reports',
  SALES: '/sales',
  DEVELOPMENT: '/development',
  ACADEMY: '/academy',
  SUPPORT: '/support',
  SCORE: '/score',
  PROFILE: '/profile',
  ADMIN: '/admin',
  APIDOCS: '/apidocs',

  MITRA: '/mitra',
  MITRA_MEMBERS: '/mitra/members',
  MITRA_REPORTS: '/mitra/reports',
  MITRA_MONITORING: '/mitra/monitoring',
  MITRA_FOLLOW_UP: '/mitra/follow-up',
  MITRA_ACADEMY: '/mitra/academy',
  MITRA_PROFILE: '/mitra/profile',

  // Alias route lama
  MITRA_ATTENTION: '/mitra/attention',
  MITRA_SUPPORT: '/mitra/support',
} as const;

export const PAGE_TO_PATH: Record<ActivePage, string> = {
  landing: '/',
  auth: '/auth',
  beranda: '/home',
  laporan: '/reports',
  perkembangan: '/development',
  academy: '/academy',
  bantuan: '/support',
  score: '/score',
  profil: '/profile',
  admin: '/admin',
  apidocs: '/apidocs',
};

export const PATH_TO_PAGE: Record<string, ActivePage> = {
  '/': 'landing',
  '/auth': 'auth',
  '/login': 'auth',
  '/register': 'auth',

  '/home': 'beranda',
  '/beranda': 'beranda',
  '/reports': 'laporan',
  '/sales': 'laporan',
  '/laporan': 'laporan',
  '/development': 'perkembangan',
  '/perkembangan': 'perkembangan',
  '/academy': 'academy',
  '/support': 'bantuan',
  '/bantuan': 'bantuan',
  '/score': 'score',
  '/farm': 'score',
  '/profile': 'profil',
  '/profil': 'profil',
  '/admin': 'admin',
  '/apidocs': 'apidocs',

  '/mitra': 'beranda',
  '/mitra/members': 'laporan',
  '/mitra/reports': 'laporan',
  '/mitra/monitoring': 'perkembangan',
  '/mitra/follow-up': 'bantuan',
  '/mitra/academy': 'academy',
  '/mitra/profile': 'profil',

  // Alias lama
  '/mitra/attention': 'perkembangan',
  '/mitra/support': 'bantuan',
};
