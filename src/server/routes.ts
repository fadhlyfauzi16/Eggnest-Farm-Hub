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
  DEVELOPMENT: '/development',
  ACADEMY: '/academy',
  SUPPORT: '/support',
  SCORE: '/score',
  PROFILE: '/profile',
  ADMIN: '/admin',
  APIDOCS: '/apidocs',
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
};
