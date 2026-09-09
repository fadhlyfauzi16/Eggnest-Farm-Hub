import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { getDb, queryAll, queryOne, runSql } from './db';
import { evaluateSmartAlerts } from './alertEngine';
import { seedDemoData, resetCleanDatabase } from './seeder';

const JWT_SECRET = process.env.JWT_SECRET || 'eggnest-super-secret-key-2026-production';
const router = Router();
// ==========================================
// MEMBER NOTIFICATION CENTER
// ==========================================
function ensureNotificationTable(database: any): void {
  database.run(`CREATE TABLE IF NOT EXISTS member_notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    farm_id TEXT,
    type TEXT NOT NULL DEFAULT 'info',
    category TEXT NOT NULL DEFAULT 'system',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    reference_id TEXT,
    dedupe_key TEXT UNIQUE,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`);
}

function createMemberNotification(database: any, input: {
  userId?: string | null; farmId?: string | null; type?: 'info' | 'success' | 'warning';
  category?: string; title: string; message: string; link?: string; referenceId?: string; dedupeKey?: string;
}): void {
  ensureNotificationTable(database);
  const now = new Date().toISOString();
  const id = `notif-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  try {
    runSql(database, `INSERT INTO member_notifications
      (id, user_id, farm_id, type, category, title, message, link, reference_id, dedupe_key, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [id, input.userId || null, input.farmId || null, input.type || 'info', input.category || 'system',
       input.title, input.message, input.link || null, input.referenceId || null, input.dedupeKey || null, now]);
  } catch (err: any) {
    // Duplicate dedupe_key means the same event was already notified.
    if (!String(err?.message || err).toLowerCase().includes('unique')) throw err;
  }
}

function notifyAllActiveMembers(database: any, input: { type?: 'info'|'success'|'warning'; category?: string; title: string; message: string; link?: string; referenceId?: string; dedupePrefix: string }): void {
  const members = queryAll<any>(database, `SELECT id, farm_id FROM users WHERE role = 'member' AND status = 'active'`);
  for (const member of members) {
    createMemberNotification(database, { ...input, userId: member.id, farmId: member.farm_id, dedupeKey: `${input.dedupePrefix}:${member.id}` });
  }
}



// ==========================================
// EGG SALES — REAL MEMBER TRANSACTIONS
// ==========================================
function ensureEggSalesTable(database: any): void {
  database.run(`CREATE TABLE IF NOT EXISTS egg_sales (
    id TEXT PRIMARY KEY,
    farm_id TEXT NOT NULL,
    sale_date TEXT NOT NULL,
    price_basis TEXT NOT NULL DEFAULT 'kg',
    egg_count INTEGER NOT NULL DEFAULT 0,
    weight_kg REAL,
    unit_price REAL NOT NULL DEFAULT 0,
    total_amount REAL NOT NULL DEFAULT 0,
    buyer_name TEXT,
    notes TEXT,
    created_by_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_egg_sales_farm_date ON egg_sales(farm_id, sale_date)`);
}

function mapEggSaleRow(row: any): any {
  return {
    id: String(row.id),
    farmId: String(row.farm_id),
    farmCode: row.farm_code ? String(row.farm_code) : undefined,
    ownerName: row.owner_name ? String(row.owner_name) : undefined,
    saleDate: String(row.sale_date),
    priceBasis: row.price_basis === 'egg' ? 'egg' : 'kg',
    eggCount: Number(row.egg_count || 0),
    weightKg: row.weight_kg == null ? null : Number(row.weight_kg),
    unitPrice: Number(row.unit_price || 0),
    totalAmount: Number(row.total_amount || 0),
    buyerName: row.buyer_name || null,
    notes: row.notes || null,
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function buildSalesSummary(database: any, farmWhereSql: string, params: any[], month?: string): any {
  const monthClause = month ? ` AND substr(es.sale_date,1,7)=?` : '';
  const salesParams = month ? [...params, month] : params;
  const s = queryOne<any>(
    database,
    `SELECT
       COUNT(es.id) AS transaction_count,
       COALESCE(SUM(es.egg_count),0) AS total_eggs,
       COALESCE(SUM(es.weight_kg),0) AS total_weight_kg,
       COALESCE(SUM(es.total_amount),0) AS total_amount,
       CASE WHEN COALESCE(SUM(CASE WHEN es.price_basis='kg' THEN es.weight_kg ELSE 0 END),0) > 0
         THEN COALESCE(SUM(CASE WHEN es.price_basis='kg' THEN es.total_amount ELSE 0 END),0) /
              SUM(CASE WHEN es.price_basis='kg' THEN es.weight_kg ELSE 0 END)
         ELSE 0 END AS average_price_per_kg
     FROM egg_sales es
     JOIN farms f ON f.id=es.farm_id
     WHERE ${farmWhereSql}${monthClause}`,
    salesParams
  ) || {};

  // Stock availability is cumulative so Member can sell eggs produced on prior dates.
  const produced = queryOne<any>(
    database,
    `SELECT COALESCE(SUM(dr.egg_count),0) AS total
     FROM daily_reports dr
     JOIN farms f ON f.id=dr.farm_id
     WHERE ${farmWhereSql.replaceAll('es.', 'dr.')}`,
    params
  );
  const soldAll = queryOne<any>(
    database,
    `SELECT COALESCE(SUM(es.egg_count),0) AS total
     FROM egg_sales es
     JOIN farms f ON f.id=es.farm_id
     WHERE ${farmWhereSql}`,
    params
  );

  const producedEggs = Number(produced?.total || 0);
  const soldEggsAll = Number(soldAll?.total || 0);

  return {
    transactionCount: Number(s.transaction_count || 0),
    totalEggs: Number(s.total_eggs || 0),
    totalWeightKg: Math.round(Number(s.total_weight_kg || 0) * 100) / 100,
    totalAmount: Math.round(Number(s.total_amount || 0)),
    averagePricePerKg: Math.round(Number(s.average_price_per_kg || 0)),
    producedEggs,
    availableEggs: Math.max(0, producedEggs - soldEggsAll),
  };
}

function ensureFarmerProfileColumns(database: any): void {
  const rows = queryAll<any>(database, `PRAGMA table_info(farms)`);
  const existing = new Set(rows.map((r: any) => String(r.name)));

  const additions: Array<[string, string]> = [
    ['purchase_date', 'TEXT'],
    ['full_address', 'TEXT'],
    ['latitude', 'REAL'],
    ['longitude', 'REAL'],
    ['chicken_age_reference_date', 'TEXT'],
    ['province', 'TEXT'],
    ['regency', 'TEXT'],
    ['district', 'TEXT'],
    ['village', 'TEXT'],
    ['partner_id', 'TEXT'],
  ];

  for (const [column, type] of additions) {
    if (!existing.has(column)) {
      database.run(`ALTER TABLE farms ADD COLUMN ${column} ${type}`);
    }
  }
}


function ensureReportOperatorColumns(database: any): void {
  const rows = queryAll<any>(database, `PRAGMA table_info(daily_reports)`);
  const existing = new Set(rows.map((r: any) => String(r.name)));
  const additions: Array<[string, string]> = [
    ['laying_chickens', 'TEXT'],
    ['chicken_reports', 'TEXT'],
    ['reported_by_id', 'TEXT'],
    ['reported_by_name', 'TEXT'],
    ['reported_by_role', 'TEXT'],
  ];
  for (const [column, type] of additions) {
    if (!existing.has(column)) database.run(`ALTER TABLE daily_reports ADD COLUMN ${column} ${type}`);
  }
}

function safeJsonArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}


// Report photo storage.
// Development: Vite serves /public automatically.
// Production: Express serves dist/client, so uploads are written there as well.
// NOTE: Railway filesystem is ephemeral. Before public launch, point this to
// persistent/object storage; this implementation is safe for local testing
// and keeps the URL stable as /uploads/<filename>.
const UPLOADS_DIR =
  process.env.NODE_ENV === 'production'
    ? path.join(process.cwd(), 'dist', 'client', 'uploads')
    : path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const extensionByMime: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    const ext = extensionByMime[file.mimetype] || '.jpg';
    const uniqueName = `report-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Harap upload JPG, PNG, atau WEBP.'));
    }
  },
});

// Academy media upload: video dan thumbnail dipisahkan dari upload laporan.
// NOTE production: Railway filesystem bersifat ephemeral. Sebelum go-live,
// arahkan ACADEMY_UPLOADS_DIR ke persistent volume atau object storage.
const ACADEMY_UPLOADS_DIR =
  process.env.NODE_ENV === 'production'
    ? path.join(process.cwd(), 'dist', 'client', 'uploads', 'academy')
    : path.join(process.cwd(), 'public', 'uploads', 'academy');

if (!fs.existsSync(ACADEMY_UPLOADS_DIR)) {
  fs.mkdirSync(ACADEMY_UPLOADS_DIR, { recursive: true });
}

const academyStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ACADEMY_UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const extensionByMime: Record<string, string> = {
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    const ext = extensionByMime[file.mimetype] || path.extname(file.originalname).toLowerCase();
    cb(null, `academy-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const academyUpload = multer({
  storage: academyStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // video maksimal 100 MB
  fileFilter: (req, file, cb) => {
    const kind = String((req as any).body?.kind || '');
    const videoMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const imageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (kind === 'video' && videoMimes.includes(file.mimetype)) return cb(null, true);
    if (kind === 'thumbnail' && imageMimes.includes(file.mimetype)) return cb(null, true);

    cb(new Error(
      kind === 'video'
        ? 'Format video tidak didukung. Gunakan MP4, WEBM, atau MOV.'
        : 'Format thumbnail tidak didukung. Gunakan JPG, PNG, atau WEBP.'
    ));
  },
});

// Rate limiting map for login
const loginAttempts = new Map<string, { count: number; blockedUntil?: number }>();

function checkRateLimit(key: string): boolean {
  const record = loginAttempts.get(key);
  if (!record) return true;
  if (record.blockedUntil && Date.now() < record.blockedUntil) {
    return false;
  }
  if (record.blockedUntil && Date.now() >= record.blockedUntil) {
    loginAttempts.delete(key);
    return true;
  }
  return record.count < 5;
}

function recordFailedAttempt(key: string) {
  const record = loginAttempts.get(key) || { count: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.blockedUntil = Date.now() + 5 * 60 * 1000; // block for 5 minutes
  }
  loginAttempts.set(key, record);
}

function clearAttempts(key: string) {
  loginAttempts.delete(key);
}

// Auth Middlewares
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'member' | 'admin' | 'veterinarian' | 'mitra';
    phone: string;
    fullName?: string;
    farmId?: string;
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Token autentikasi tidak disertakan.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Session kedaluwarsa atau token tidak valid. Silakan login kembali.' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Akses ditolak. Endpoint ini hanya untuk Administrator.' });
      return;
    }
    next();
  });
}

export function requireMitra(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'mitra') {
      res.status(403).json({ success: false, error: 'Akses ditolak. Endpoint ini hanya untuk Mitra Pendamping.' });
      return;
    }
    next();
  });
}

function isMemberFarmProfileComplete(farm: any): boolean {
  if (!farm) return false;
  const location = String(farm.location || '').trim();
  const locationKey = location.toLowerCase();
  return location.length > 0 &&
    locationKey !== 'indonesia' &&
    !locationKey.includes('belum') &&
    String(farm.full_address || '').trim().length > 0 &&
    farm.latitude !== null && farm.latitude !== undefined && farm.latitude !== '' && Number.isFinite(Number(farm.latitude)) &&
    farm.longitude !== null && farm.longitude !== undefined && farm.longitude !== '' && Number.isFinite(Number(farm.longitude)) &&
    String(farm.chicken_breed || '').trim().length > 0 &&
    Number(farm.active_chickens) > 0 &&
    Number(farm.current_age_weeks) > 0;
}

function sanitizeFarmForMember(farm: any): any {
  if (!farm) return null;
  if (isMemberFarmProfileComplete(farm)) return { ...farm, profile_complete: true };
  return {
    ...farm,
    location: '',
    full_address: '',
    latitude: null,
    longitude: null,
    active_chickens: 0,
    chicken_breed: '',
    current_age_weeks: 0,
    chicken_age_reference_date: null,
    profile_complete: false,
  };
}

// ==========================================
// 1. AUTHENTICATION & REGISTRATION ENDPOINTS
// ==========================================

router.post('/auth/register', (_req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Registrasi mandiri dinonaktifkan. Akun Member dibuat oleh Admin Eggnest.',
  });
});

router.post('/auth/login', async (req, res) => {
  try {
    const { role = 'member', phone, identifier, password } = req.body;
    const loginKey = role === 'admin' ? identifier || 'admin' : phone || '';

    if (!checkRateLimit(loginKey)) {
      return res.status(429).json({
        success: false,
        message: 'Terlalu banyak percobaan login yang salah. Silakan coba lagi dalam 5 menit.',
      });
    }

    const db = await getDb();

    if (role === 'admin') {
      if (!identifier || !password) {
        return res.status(400).json({ success: false, message: 'Email/Username dan password admin wajib diisi.' });
      }

      const adminUser = queryOne<any>(
        db,
        `SELECT * FROM users WHERE role = 'admin' AND (LOWER(email) = LOWER(?) OR phone = ? OR LOWER(full_name) LIKE LOWER(?))`,
        [identifier.trim(), identifier.trim(), `%${identifier.trim()}%`]
      );

      if (!adminUser) {
        recordFailedAttempt(loginKey);
        return res.status(401).json({ success: false, message: 'Akun Administrator tidak ditemukan.' });
      }

      const isMatch = bcrypt.compareSync(password, adminUser.password_hash);
      if (!isMatch) {
        recordFailedAttempt(loginKey);
        return res.status(401).json({ success: false, message: 'Password admin salah.' });
      }

      clearAttempts(loginKey);

      const token = jwt.sign(
        { id: adminUser.id, role: 'admin', phone: adminUser.phone },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      const { password_hash, ...safeUser } = adminUser;
      res.json({
        success: true,
        message: 'Login Admin berhasil.',
        token,
        user: safeUser,
      });
    } else if (role === 'mitra') {
      if (!phone || !password) {
        return res.status(400).json({ success: false, message: 'Nomor WhatsApp dan password Mitra Pendamping wajib diisi.' });
      }

      ensurePartnerTable(db);
      ensurePartnerAccountTable(db);
      const cleanPhone = String(phone).trim();
      const account = queryOne<any>(db, `SELECT pa.*, p.partner_code, p.name, p.phone AS partner_phone, p.status AS partner_status
        FROM partner_accounts pa JOIN partners p ON p.id = pa.partner_id WHERE pa.phone = ?`, [cleanPhone]);

      if (!account) {
        recordFailedAttempt(loginKey);
        return res.status(401).json({ success: false, message: 'Akun Mitra Pendamping tidak ditemukan.' });
      }
      if (account.status !== 'active' || account.partner_status !== 'active') {
        return res.status(403).json({ success: false, message: 'Akun Mitra Pendamping sedang nonaktif. Hubungi Admin Eggnest.' });
      }
      if (!bcrypt.compareSync(password, account.password_hash)) {
        recordFailedAttempt(loginKey);
        return res.status(401).json({ success: false, message: 'Password Mitra Pendamping salah.' });
      }

      clearAttempts(loginKey);
      const now = new Date().toISOString();
      runSql(db, `UPDATE partner_accounts SET last_login_at = ?, updated_at = ? WHERE id = ?`, [now, now, account.id]);
      const token = jwt.sign({ id: account.id, role: 'mitra', phone: account.phone, partnerId: account.partner_id }, JWT_SECRET, { expiresIn: '30d' });
      return res.json({
        success: true,
        message: `Selamat datang, ${account.name}!`,
        token,
        user: {
          id: account.id,
          full_name: account.name,
          phone: account.phone,
          role: 'mitra',
          status: account.status,
          partner_id: account.partner_id,
          partner_code: account.partner_code,
          created_at: account.created_at,
        },
        partner: queryOne<any>(db, `SELECT * FROM partners WHERE id = ?`, [account.partner_id]),
      });
    } else {
      // Member login
      if (!phone || !password) {
        return res.status(400).json({ success: false, message: 'Nomor WhatsApp dan password wajib diisi.' });
      }

      const cleanPhone = phone.trim();
      const memberUser = queryOne<any>(
        db,
        `SELECT * FROM users WHERE phone = ? AND role = 'member'`,
        [cleanPhone]
      );

      if (!memberUser) {
        recordFailedAttempt(loginKey);
        return res.status(401).json({
          success: false,
          message: 'Nomor WhatsApp belum terdaftar. Hubungi Admin Eggnest untuk pembuatan akun Member.',
        });
      }

      if (memberUser.status === 'inactive') {
        return res.status(403).json({
          success: false,
          message: 'Akun Anda sedang dinonaktifkan. Silakan hubungi Customer Support Eggnest.',
        });
      }

      const isMatch = bcrypt.compareSync(password, memberUser.password_hash);
      if (!isMatch) {
        recordFailedAttempt(loginKey);
        return res.status(401).json({ success: false, message: 'Password salah. Silakan coba lagi.' });
      }

      clearAttempts(loginKey);

      const farm = memberUser.farm_id
        ? queryOne<any>(db, `SELECT * FROM farms WHERE id = ?`, [memberUser.farm_id])
        : null;

      const token = jwt.sign(
        { id: memberUser.id, role: 'member', phone: memberUser.phone, farmId: memberUser.farm_id },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      const { password_hash, ...safeUser } = memberUser;
      res.json({
        success: true,
        message: `Selamat datang kembali, ${memberUser.full_name}!`,
        token,
        user: safeUser,
        farm: sanitizeFarmForMember(farm),
      });
    }
  } catch (err: any) {
    console.error('Error during login:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat login.' });
  }
});

router.get('/auth/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();

    if (req.user?.role === 'mitra') {
      ensurePartnerTable(db);
      ensurePartnerAccountTable(db);
      const row = queryOne<any>(db, `SELECT pa.id, pa.phone, pa.status, pa.partner_id, pa.created_at,
        p.partner_code, p.name, p.status AS partner_status
        FROM partner_accounts pa JOIN partners p ON p.id = pa.partner_id WHERE pa.id = ?`, [req.user.id]);
      if (!row) return res.status(404).json({ success: false, message: 'Akun Mitra Pendamping tidak ditemukan.' });
      if (row.status !== 'active' || row.partner_status !== 'active') return res.status(403).json({ success: false, message: 'Akun Mitra Pendamping sedang nonaktif.' });
      return res.json({
        success: true,
        user: { id: row.id, phone: row.phone, full_name: row.name, role: 'mitra', status: row.status, partner_id: row.partner_id, partner_code: row.partner_code, created_at: row.created_at },
        partner: queryOne<any>(db, `SELECT * FROM partners WHERE id = ?`, [row.partner_id]),
      });
    }

    const user = queryOne<any>(
      db,
      `SELECT id, phone, email, full_name, role, status, farm_id, created_at FROM users WHERE id = ?`,
      [req.user!.id]
    );

    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    let farm = null;
    if (user.farm_id) farm = queryOne<any>(db, `SELECT * FROM farms WHERE id = ?`, [user.farm_id]);
    res.json({ success: true, user, farm: user.role === 'member' ? sanitizeFarmForMember(farm) : farm });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memuat profil user.' });
  }
});

// ==========================================
// 2. DASHBOARD & ANALYTICS DATA SOURCE
// ==========================================

router.get('/dashboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();

    if (req.user?.role === 'mitra') {
      return res.status(403).json({
        success: false,
        message: 'Mitra Pendamping menggunakan Dashboard Mitra. Akses dashboard kandang langsung tidak diizinkan.',
      });
    }

    const farmId = (req.query.farmId as string) || req.user?.farmId;

    if (!farmId) {
      return res.status(400).json({ success: false, message: 'Farm ID tidak ditentukan.' });
    }

    const farm = queryOne<any>(db, `SELECT * FROM farms WHERE id = ?`, [farmId]);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Data kandang tidak ditemukan.' });
    }

    // Load system settings
    const settingsRows = queryAll<{ key: string; value: string }>(
      db,
      `SELECT key, value FROM system_settings`
    );
    const settings: Record<string, any> = {};
    settingsRows.forEach((r) => {
      try {
        settings[r.key] = JSON.parse(r.value);
      } catch {
        settings[r.key] = r.value;
      }
    });

    const eggsPerKg = Number(settings.eggsPerKg || 16);
    const eggPricePerKg = Number(settings.eggPricePerKg || 32000);

    // Fetch reports from database
    const reports = queryAll<any>(
      db,
      `SELECT * FROM daily_reports WHERE farm_id = ? ORDER BY report_date ASC`,
      [farmId]
    );

    const activeChickens = Number(farm.active_chickens);

    // Tanggal/bulan berjalan menggunakan zona waktu Indonesia (WIB).
    const jakartaParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const getJakartaPart = (type: 'year' | 'month' | 'day') =>
      jakartaParts.find((part) => part.type === type)?.value || '';

    const currentYear = getJakartaPart('year');
    const currentMonth = getJakartaPart('month');
    const currentDay = getJakartaPart('day');
    const todayStr = `${currentYear}-${currentMonth}-${currentDay}`;
    const currentMonthKey = `${currentYear}-${currentMonth}`;

    // Today's report (or latest)
    const todayReport = reports.find((r) => r.report_date === todayStr) || reports[reports.length - 1];
    const todayEggCount = todayReport ? todayReport.egg_count : 0;
    const todayFeedKg = todayReport ? todayReport.feed_kg : 0;

    // Current month reports mengikuti bulan kalender berjalan.
    const monthReports = reports.filter((r) =>
      String(r.report_date || '').startsWith(currentMonthKey)
    );
    const monthEggCount = monthReports.reduce((acc, r) => acc + (r.egg_count || 0), 0);
    const monthFeedKg = Number(monthReports.reduce((acc, r) => acc + (r.feed_kg || 0), 0).toFixed(1));

    const averageEggsPerDay =
      monthReports.length > 0 ? Number((monthEggCount / monthReports.length).toFixed(1)) : 0;

    // Productivity Calculation = (egg_count / active_chicken_count) * 100
    const productivityRate =
      todayReport && activeChickens > 0
        ? Math.round((todayEggCount / activeChickens) * 100)
        : 0;

    let productivityStatus: 'Optimal' | 'Baik' | 'Cukup' | 'Perlu Perhatian' = 'Baik';
    if (productivityRate >= 90) productivityStatus = 'Optimal';
    else if (productivityRate >= 75) productivityStatus = 'Baik';
    else if (productivityRate >= 60) productivityStatus = 'Cukup';
    else productivityStatus = 'Perlu Perhatian';

    // Egg Value Calculation = (total_eggs / eggs_per_kg) * egg_price_per_kg
    const estimatedEggValue = Math.round((monthEggCount / eggsPerKg) * eggPricePerKg);

    // FCR Calculation: Total Feed (kg) / Total Egg Mass (kg)
    // Egg Mass (kg) = total_eggs / eggs_per_kg
    let currentFcr = null;
    if (monthEggCount > 0 && monthFeedKg > 0) {
      const totalEggMassKg = monthEggCount / eggsPerKg;
      currentFcr = Number((monthFeedKg / totalEggMassKg).toFixed(2));
    }

    // Chart data 30 laporan terakhir dengan label bulan dinamis.
    const chartData = reports.slice(-30).map((r) => {
      const [year, month, day] = String(r.report_date || '').split('-').map(Number);
      const monthLabel =
        year && month && day
          ? new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'UTC' })
              .format(new Date(Date.UTC(year, month - 1, day)))
              .replace('.', '')
          : '';
      return {
        day: `${day || ''} ${monthLabel}`.trim(),
        tanggal: r.report_date,
        telur: r.egg_count,
        pakan: r.feed_kg,
        produktivitas: r.productivity_rate,
      };
    });

    res.json({
      success: true,
      data: {
        farm,
        todayReport,
        todayEggCount,
        todayFeedKg,
        monthEggCount,
        monthFeedKg,
        productivityRate,
        productivityStatus,
        averageEggsPerDay,
        estimatedEggValue,
        fcr: currentFcr,
        chartData,
        reports,
        settings,
      },
    });
  } catch (err: any) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat data dashboard.' });
  }
});

// ==========================================
// 3. DAILY REPORTS ENDPOINTS (PERSISTENCE & UNIQUE CONSTRAINT)
// ==========================================

router.get('/reports', requireAuth, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    ensureReportOperatorColumns(db);

    // Member hanya boleh membaca laporan kandangnya sendiri.
    if (req.user?.role === 'member') {
      const farmId = req.user?.farmId;

      if (!farmId) {
        return res.status(400).json({ success: false, message: 'Farm ID belum terhubung ke akun member.' });
      }

      const reports = queryAll<any>(
        db,
        `SELECT * FROM daily_reports WHERE farm_id = ? ORDER BY report_date ASC`,
        [farmId]
      );

      return res.json({ success: true, reports });
    }

    // Mitra hanya boleh membaca laporan Farm ID yang memang ditugaskan Admin kepadanya.
    if (req.user?.role === 'mitra') {
      ensurePartnerAccountTable(db);
      ensureFarmerProfileColumns(db);

      const account = queryOne<any>(db, `SELECT partner_id FROM partner_accounts WHERE id = ?`, [req.user.id]);
      if (!account?.partner_id) {
        return res.status(403).json({ success: false, message: 'Akun Mitra belum terhubung ke profil Mitra Pendamping.' });
      }

      const requestedFarmId = String(req.query.farmId || '').trim();
      const reports = requestedFarmId
        ? queryAll<any>(
            db,
            `SELECT dr.* FROM daily_reports dr
             JOIN farms f ON f.id = dr.farm_id
             WHERE f.partner_id = ? AND f.id = ?
             ORDER BY dr.report_date ASC`,
            [account.partner_id, requestedFarmId]
          )
        : queryAll<any>(
            db,
            `SELECT dr.* FROM daily_reports dr
             JOIN farms f ON f.id = dr.farm_id
             WHERE f.partner_id = ?
             ORDER BY dr.report_date ASC`,
            [account.partner_id]
          );

      return res.json({ success: true, reports });
    }

    // Admin dapat membaca semua laporan. Jika farmId dikirim, hasil difilter ke kandang tersebut.
    const requestedFarmId = String(req.query.farmId || '').trim();

    const reports = requestedFarmId
      ? queryAll<any>(
          db,
          `SELECT * FROM daily_reports WHERE farm_id = ? ORDER BY report_date ASC`,
          [requestedFarmId]
        )
      : queryAll<any>(
          db,
          `SELECT * FROM daily_reports ORDER BY report_date ASC`
        );

    return res.json({ success: true, reports });
  } catch (err) {
    console.error('Error loading reports:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat laporan harian.' });
  }
});

router.post('/reports', requireAuth, async (req: AuthRequest, res) => {
  try {
    // Laporan harian adalah tanggung jawab Member pemilik kandang.
    // Admin tetap boleh melakukan koreksi bila diperlukan. Mitra hanya memonitor.
    if (req.user?.role !== 'member' && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Laporan harian diisi oleh Member pemilik kandang.' });
    }

    const { farmId: reqFarmId, date, feedKg = 0, layingChickens = [], chickenReports = [], notes, photoUrl, videoUrl } = req.body || {};
    if (!date) return res.status(400).json({ success: false, message: 'Tanggal laporan wajib diisi.' });

    const db = await getDb();
    ensureFarmerProfileColumns(db);
    ensureReportOperatorColumns(db);

    const farmId = req.user?.role === 'member' ? String(req.user?.farmId || '') : String(reqFarmId || '').trim();
    if (!farmId) return res.status(400).json({ success: false, message: 'Farm ID belum terhubung.' });

    const farm = queryOne<any>(db, `SELECT * FROM farms WHERE id = ?`, [farmId]);
    if (!farm) return res.status(404).json({ success: false, message: 'Kandang tidak ditemukan.' });
    if (req.user?.role === 'member' && farm.id !== req.user?.farmId) {
      return res.status(403).json({ success: false, message: 'Anda hanya dapat mengisi laporan kandang sendiri.' });
    }

    let reporterId = req.user!.id;
    let reporterName = 'Member Eggnest';
    let reporterRole: 'member' | 'admin' = req.user!.role as 'member' | 'admin';
    if (req.user?.role === 'member') {
      const member = queryOne<any>(db, `SELECT full_name FROM users WHERE id = ? AND role = 'member'`, [req.user!.id]);
      reporterName = String(member?.full_name || farm.owner_name || 'Member Eggnest');
    } else {
      const admin = queryOne<any>(db, `SELECT full_name FROM users WHERE id = ? AND role = 'admin'`, [req.user!.id]);
      reporterName = String(admin?.full_name || 'Administrator Eggnest');
    }

    const activeChickens = Math.max(1, Number(farm.active_chickens || farm.initial_chickens || 12));
    const cleanLaying = Array.from(new Set(safeJsonArray(layingChickens).map((n: any) => Number(n)).filter((n: number) => Number.isInteger(n) && n >= 1 && n <= activeChickens))).sort((a: number, b: number) => a - b);

    const byNumber = new Map<number, any>();
    safeJsonArray(chickenReports).forEach((item: any) => {
      const chickenNumber = Number(item?.chickenNumber ?? item?.chicken_number);
      if (!Number.isInteger(chickenNumber) || chickenNumber < 1 || chickenNumber > activeChickens) return;
      const rawCondition = String(item?.condition || 'HEALTHY').toUpperCase();
      const condition = rawCondition === 'DEAD' ? 'DEAD' : rawCondition === 'SICK' ? 'SICK' : 'HEALTHY';
      byNumber.set(chickenNumber, {
        chickenNumber,
        condition,
        problemTypes: safeJsonArray(item?.problemTypes ?? item?.problem_types).map((x) => String(x)).filter(Boolean),
        customNotes: String(item?.customNotes ?? item?.custom_notes ?? '').trim(),
      });
    });
    const normalizedChickenReports = Array.from({ length: activeChickens }, (_, i) => byNumber.get(i + 1) || { chickenNumber: i + 1, condition: 'HEALTHY', problemTypes: [], customNotes: '' });
    const hasIssue = normalizedChickenReports.some((item: any) => item.condition !== 'HEALTHY');
    const aggregatedIssues = Array.from(new Set(normalizedChickenReports.flatMap((item: any) => item.condition === 'DEAD' ? ['Ayam mati', ...(item.problemTypes || [])] : item.condition === 'SICK' ? ['Ayam sakit', ...(item.problemTypes || [])] : [])));

    const eggCount = cleanLaying.length;
    const cleanFeedKg = Number(feedKg);
    if (!Number.isFinite(cleanFeedKg) || cleanFeedKg <= 0 || cleanFeedKg > 1000) return res.status(400).json({ success: false, message: 'Jumlah pakan tidak valid.' });

    const eggsPerKgSetting = queryOne<any>(db, `SELECT value FROM system_settings WHERE key = 'eggsPerKg'`);
    const eggsPerKg = eggsPerKgSetting ? Number(JSON.parse(eggsPerKgSetting.value)) || 16 : 16;
    const productivityRate = Number(((eggCount / activeChickens) * 100).toFixed(1));
    const eggMassKg = eggCount > 0 ? eggCount / eggsPerKg : 0;
    const fcr = eggMassKg > 0 ? Number((cleanFeedKg / eggMassKg).toFixed(2)) : null;
    const now = new Date().toISOString();
    const reportId = `rep-${farmId}-${date}`;

    runSql(db, `INSERT INTO daily_reports (
      id, farm_id, report_date, egg_count, feed_kg, chicken_condition, issue_types, notes, photo_url, video_url,
      productivity_rate, fcr, laying_chickens, chicken_reports, reported_by_id, reported_by_name, reported_by_role, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(farm_id, report_date) DO UPDATE SET
      egg_count=excluded.egg_count, feed_kg=excluded.feed_kg, chicken_condition=excluded.chicken_condition,
      issue_types=excluded.issue_types, notes=excluded.notes, photo_url=excluded.photo_url, video_url=excluded.video_url,
      productivity_rate=excluded.productivity_rate, fcr=excluded.fcr, laying_chickens=excluded.laying_chickens,
      chicken_reports=excluded.chicken_reports, reported_by_id=excluded.reported_by_id, reported_by_name=excluded.reported_by_name,
      reported_by_role=excluded.reported_by_role, updated_at=excluded.updated_at`, [
      reportId, farmId, date, eggCount, cleanFeedKg, hasIssue ? 'issue' : 'healthy', aggregatedIssues.length ? JSON.stringify(aggregatedIssues) : null,
      String(notes || '').trim() || null, photoUrl || null, videoUrl || null, productivityRate, fcr,
      JSON.stringify(cleanLaying), JSON.stringify(normalizedChickenReports), reporterId, reporterName, reporterRole, now, now,
    ]);

    evaluateSmartAlerts(db, farmId);
    const reportCount = Number(queryOne<any>(db, `SELECT COUNT(*) AS total FROM daily_reports WHERE farm_id = ?`, [farmId])?.total || 0);
    if (req.user?.role === 'member' && reportCount >= 7) {
      createMemberNotification(db, { userId: req.user!.id, farmId, type: 'success', category: 'score', title: 'Farm Score Sudah Tersedia', message: 'Data laporan harian sudah cukup untuk menampilkan Farm Score kandang Anda.', link: '/score', dedupeKey: `farm-score-ready:${farmId}` });
    }

    return res.json({ success: true, message: `Laporan ${date} berhasil disimpan.`, productivity: Math.round(productivityRate), fcr, eggCount, layingChickens: cleanLaying });
  } catch (err: any) {
    console.error('Error saving member daily report:', err);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan laporan kandang.' });
  }
});

// ==========================================
// MITRA PENDAMPING & TERRITORY MANAGEMENT
// ==========================================
function ensurePartnerTable(database: any): void {
  database.run(`CREATE TABLE IF NOT EXISTS partners (
    id TEXT PRIMARY KEY, partner_code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, phone TEXT, address TEXT,
    province TEXT, regency TEXT, district TEXT, village TEXT, latitude REAL, longitude REAL,
    service_radius_km REAL NOT NULL DEFAULT 10, status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`);
}

function ensurePartnerAccountTable(database: any): void {
  database.run(`CREATE TABLE IF NOT EXISTS partner_accounts (
    id TEXT PRIMARY KEY,
    partner_id TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    last_login_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
  )`);
}


router.get('/admin/partners', requireAdmin, async (_req, res) => {
  try {
    const db = await getDb(); ensurePartnerTable(db); ensureFarmerProfileColumns(db);
    ensurePartnerAccountTable(db);
    const partners = queryAll<any>(db, `SELECT p.*, pa.phone AS login_phone, pa.status AS account_status, pa.last_login_at, COUNT(f.id) AS member_count
      FROM partners p LEFT JOIN partner_accounts pa ON pa.partner_id = p.id LEFT JOIN farms f ON f.partner_id = p.id
      GROUP BY p.id ORDER BY p.name ASC`);
    res.json({ success: true, partners });
  } catch { res.status(500).json({ success: false, message: 'Gagal memuat Mitra Pendamping.' }); }
});

router.post('/admin/partners', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const db = await getDb(); ensurePartnerTable(db); ensurePartnerAccountTable(db);
    const { partnerCode, name, phone='', password='', address='', province='', regency='', district='', village='', status='active' } = req.body || {};
    if (!String(name || '').trim()) return res.status(400).json({success:false,message:'Nama Mitra Pendamping wajib diisi.'});
    if (!String(phone || '').trim()) return res.status(400).json({success:false,message:'Nomor WhatsApp Mitra wajib diisi untuk akun login.'});
    if (String(password || '').length < 6) return res.status(400).json({success:false,message:'Password awal Mitra minimal 6 karakter.'});
    if (queryOne<any>(db, `SELECT id FROM partner_accounts WHERE phone = ?`, [String(phone).trim()])) return res.status(400).json({success:false,message:'Nomor WhatsApp tersebut sudah digunakan akun Mitra lain.'});

    const existingCodes = queryAll<any>(db, `SELECT partner_code FROM partners`);
    const nums = existingCodes.map(x => parseInt(String(x.partner_code || '').replace(/\D/g,''),10)).filter(Number.isFinite);
    const code = String(partnerCode || '').trim().toUpperCase() || `MITRA-${String((nums.length ? Math.max(...nums) : 0)+1).padStart(4,'0')}`;
    if (queryOne<any>(db, `SELECT id FROM partners WHERE partner_code = ?`, [code])) return res.status(400).json({success:false,message:`Kode ${code} sudah digunakan.`});
    const lat = null; const lng = null; const radius = 10;
    const now = new Date().toISOString(); const id = `partner-${Date.now()}`; const accountId = `partner-account-${Date.now()}`;
    const normalizedStatus = status === 'inactive' ? 'inactive':'active';
    runSql(db, `INSERT INTO partners (id,partner_code,name,phone,address,province,regency,district,village,latitude,longitude,service_radius_km,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id,code,String(name).trim(),String(phone).trim(),address,province,regency,district,village,lat,lng,radius,normalizedStatus,now,now]);
    try {
      runSql(db, `INSERT INTO partner_accounts (id,partner_id,phone,password_hash,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?)`,
        [accountId,id,String(phone).trim(),bcrypt.hashSync(String(password),10),normalizedStatus,now,now]);
    } catch (accountErr) {
      runSql(db, `DELETE FROM partners WHERE id = ?`, [id]);
      throw accountErr;
    }
    res.status(201).json({success:true,message:`Mitra Pendamping ${code} dan akun login berhasil dibuat.`,partner:queryOne<any>(db,`SELECT * FROM partners WHERE id=?`,[id])});
  } catch (err) { console.error(err); res.status(500).json({success:false,message:'Gagal membuat akun Mitra Pendamping.'}); }
});

router.put('/admin/partners/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const db=await getDb(); ensurePartnerTable(db); ensurePartnerAccountTable(db); const id=req.params.id; const old=queryOne<any>(db,`SELECT * FROM partners WHERE id=?`,[id]);
    if(!old) return res.status(404).json({success:false,message:'Mitra Pendamping tidak ditemukan.'});
    const b=req.body||{}; const lat=b.latitude === '' ? null : b.latitude === undefined ? old.latitude : Number(b.latitude); const lng=b.longitude === '' ? null : b.longitude === undefined ? old.longitude : Number(b.longitude);
    const radius=b.serviceRadiusKm === undefined ? old.service_radius_km : Number(b.serviceRadiusKm); const now=new Date().toISOString();
    const nextPhone=String(b.phone ?? old.phone ?? '').trim(); const nextStatus=b.status ?? old.status;
    if (!nextPhone) return res.status(400).json({success:false,message:'Nomor WhatsApp Mitra tidak boleh kosong.'});
    const duplicate=queryOne<any>(db,`SELECT id FROM partner_accounts WHERE phone=? AND partner_id<>?`,[nextPhone,id]);
    if(duplicate) return res.status(400).json({success:false,message:'Nomor WhatsApp sudah digunakan akun Mitra lain.'});
    runSql(db,`UPDATE partners SET name=?,phone=?,address=?,province=?,regency=?,district=?,village=?,latitude=?,longitude=?,service_radius_km=?,status=?,updated_at=? WHERE id=?`,
      [b.name ?? old.name,nextPhone,b.address ?? old.address,b.province ?? old.province,b.regency ?? old.regency,b.district ?? old.district,b.village ?? old.village,lat,lng,radius,nextStatus,now,id]);
    const account=queryOne<any>(db,`SELECT * FROM partner_accounts WHERE partner_id=?`,[id]);
    if(account){
      runSql(db,`UPDATE partner_accounts SET phone=?,status=?,updated_at=? WHERE partner_id=?`,[nextPhone,nextStatus,now,id]);
      if(String(b.password||'').length>0){ if(String(b.password).length<6) return res.status(400).json({success:false,message:'Password baru minimal 6 karakter.'}); runSql(db,`UPDATE partner_accounts SET password_hash=?,updated_at=? WHERE partner_id=?`,[bcrypt.hashSync(String(b.password),10),now,id]); }
    }
    res.json({success:true,message:'Mitra Pendamping dan akun login berhasil diperbarui.',partner:queryOne<any>(db,`SELECT * FROM partners WHERE id=?`,[id])});
  } catch (err) { console.error(err); res.status(500).json({success:false,message:'Gagal memperbarui Mitra Pendamping.'}); }
});

router.delete('/admin/partners/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const db=await getDb(); ensurePartnerTable(db); ensurePartnerAccountTable(db); ensureFarmerProfileColumns(db); const id=req.params.id;
    const used=queryOne<any>(db,`SELECT COUNT(*) AS cnt FROM farms WHERE partner_id=?`,[id]);
    if(Number(used?.cnt||0)>0) return res.status(400).json({success:false,message:`Mitra masih mendampingi ${used.cnt} member. Pindahkan member terlebih dahulu.`});
    runSql(db,`DELETE FROM partner_accounts WHERE partner_id=?`,[id]); runSql(db,`DELETE FROM partners WHERE id=?`,[id]); res.json({success:true,message:'Mitra Pendamping dan akun login berhasil dihapus.'});
  } catch { res.status(500).json({success:false,message:'Gagal menghapus Mitra Pendamping.'}); }
});


router.patch('/admin/farms/:id/partner', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const db=await getDb(); ensurePartnerTable(db); ensureFarmerProfileColumns(db); const partnerId=req.body?.partnerId || null;
    if(partnerId && !queryOne<any>(db,`SELECT id FROM partners WHERE id=? AND status='active'`,[partnerId])) return res.status(400).json({success:false,message:'Mitra Pendamping tidak valid/tidak aktif.'});
    runSql(db,`UPDATE farms SET partner_id=?, updated_at=? WHERE id=?`,[partnerId,new Date().toISOString(),req.params.id]);
    res.json({success:true,message:partnerId?'Mitra Pendamping berhasil ditetapkan.':'Penugasan Mitra Pendamping dilepas.'});
  } catch { res.status(500).json({success:false,message:'Gagal menetapkan Mitra Pendamping.'}); }
});

// ==========================================
// MITRA PENDAMPING PORTAL
// ==========================================
router.get('/mitra/profile', requireMitra, async (req: AuthRequest, res) => {
  try {
    const db=await getDb(); ensurePartnerTable(db); ensurePartnerAccountTable(db);
    const account=queryOne<any>(db,`SELECT * FROM partner_accounts WHERE id=?`,[req.user!.id]);
    if(!account) return res.status(404).json({success:false,message:'Akun Mitra tidak ditemukan.'});
    const partner=queryOne<any>(db,`SELECT * FROM partners WHERE id=?`,[account.partner_id]);
    return res.json({success:true,partner});
  } catch { return res.status(500).json({success:false,message:'Gagal memuat profil Mitra.'}); }
});

router.put('/mitra/profile', requireMitra, async (req: AuthRequest, res) => {
  try {
    const db=await getDb(); ensurePartnerTable(db); ensurePartnerAccountTable(db);
    const account=queryOne<any>(db,`SELECT * FROM partner_accounts WHERE id=?`,[req.user!.id]);
    if(!account) return res.status(404).json({success:false,message:'Akun Mitra tidak ditemukan.'});
    const old=queryOne<any>(db,`SELECT * FROM partners WHERE id=?`,[account.partner_id]);
    if(!old) return res.status(404).json({success:false,message:'Profil Mitra tidak ditemukan.'});

    const b=req.body||{};
    const lat=b.latitude === '' || b.latitude == null ? null : Number(b.latitude);
    const lng=b.longitude === '' || b.longitude == null ? null : Number(b.longitude);
    if(lat===null||lng===null||!Number.isFinite(lat)||!Number.isFinite(lng)) {
      return res.status(400).json({success:false,message:'Lokasi GPS basecamp wajib diambil terlebih dahulu.'});
    }

    const address=String(b.address??old.address??'').trim();
    const province=String(b.province??old.province??'').trim();
    const regency=String(b.regency??old.regency??'').trim();
    const district=String(b.district??old.district??'').trim();
    const village=String(b.village??old.village??'').trim();

    if(!address || !province || !regency || !district || !village) {
      return res.status(400).json({success:false,message:'Alamat dan wilayah basecamp wajib dilengkapi.'});
    }

    const now=new Date().toISOString();
    runSql(db,`UPDATE partners SET address=?,province=?,regency=?,district=?,village=?,latitude=?,longitude=?,updated_at=? WHERE id=?`,
      [address,province,regency,district,village,lat,lng,now,old.id]);

    return res.json({
      success:true,
      message:'Profil dan lokasi basecamp berhasil disimpan.',
      partner:queryOne<any>(db,`SELECT * FROM partners WHERE id=?`,[old.id])
    });
  } catch(err){
    console.error(err);
    return res.status(500).json({success:false,message:'Gagal menyimpan profil Mitra.'});
  }
});


router.put('/mitra/farms/:id/profile', requireMitra, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    ensureFarmerProfileColumns(db);
    ensurePartnerAccountTable(db);

    const account = queryOne<any>(db, `SELECT partner_id FROM partner_accounts WHERE id = ?`, [req.user!.id]);
    const farm = queryOne<any>(db, `SELECT * FROM farms WHERE id = ?`, [req.params.id]);
    if (!farm) return res.status(404).json({ success: false, message: 'Farm ID tidak ditemukan.' });
    if (!account?.partner_id || farm.partner_id !== account.partner_id) {
      return res.status(403).json({ success: false, message: 'Farm ID ini bukan Member binaan Anda.' });
    }

    const b = req.body || {};
    const location = String(b.location ?? farm.location ?? '').trim();
    const fullAddress = String(b.fullAddress ?? b.full_address ?? farm.full_address ?? '').trim();
    const chickenBreed = String(b.chickenBreed ?? b.chicken_breed ?? farm.chicken_breed ?? '').trim();
    const activeChickens = Number(b.activeChickens ?? b.active_chickens ?? farm.active_chickens ?? 12);
    const currentAgeWeeks = Number(b.currentAgeWeeks ?? b.current_age_weeks ?? farm.current_age_weeks ?? 18);
    const lat = b.latitude === '' || b.latitude == null ? farm.latitude : Number(b.latitude);
    const lng = b.longitude === '' || b.longitude == null ? farm.longitude : Number(b.longitude);

    if (!location) return res.status(400).json({ success: false, message: 'Kabupaten/Kota kandang wajib diisi.' });
    if (!fullAddress) return res.status(400).json({ success: false, message: 'Alamat kandang wajib diisi.' });
    if (lat == null || !Number.isFinite(Number(lat))) return res.status(400).json({ success: false, message: 'GPS kandang wajib diambil.' });
    if (lng == null || !Number.isFinite(Number(lng))) return res.status(400).json({ success: false, message: 'GPS kandang wajib diambil.' });
    if (!chickenBreed) return res.status(400).json({ success: false, message: 'Jenis ayam wajib diisi.' });
    if (!Number.isInteger(activeChickens) || activeChickens < 1 || activeChickens > 1000) return res.status(400).json({ success: false, message: 'Jumlah ayam aktif tidak valid.' });
    if (!Number.isFinite(currentAgeWeeks) || currentAgeWeeks < 1 || currentAgeWeeks > 200) return res.status(400).json({ success: false, message: 'Usia ayam tidak valid.' });

    const now = new Date().toISOString();
    const today = now.split('T')[0];
    runSql(db, `UPDATE farms SET
      location=?, full_address=?, latitude=?, longitude=?,
      province=?, regency=?, district=?, village=?,
      chicken_breed=?, active_chickens=?, current_age_weeks=?, chicken_age_reference_date=?, updated_at=?
      WHERE id=?`,
      [
        location, fullAddress, Number(lat), Number(lng),
        String(b.province ?? farm.province ?? ''),
        String(b.regency ?? location),
        String(b.district ?? farm.district ?? ''),
        String(b.village ?? farm.village ?? ''),
        chickenBreed, activeChickens, currentAgeWeeks, today, now, farm.id
      ]
    );

    return res.json({
      success: true,
      message: 'Data kandang Member berhasil diperbarui.',
      farm: queryOne<any>(db, `SELECT * FROM farms WHERE id = ?`, [farm.id]),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui data kandang Member.' });
  }
});

router.get('/mitra/dashboard', requireMitra, async (req: AuthRequest, res) => {
  try {
    const db=await getDb(); ensurePartnerTable(db); ensurePartnerAccountTable(db); ensureFarmerProfileColumns(db);
    const account=queryOne<any>(db,`SELECT * FROM partner_accounts WHERE id=?`,[req.user!.id]);
    if(!account) return res.status(404).json({success:false,message:'Akun Mitra tidak ditemukan.'});
    const partner=queryOne<any>(db,`SELECT * FROM partners WHERE id=?`,[account.partner_id]);
    if(!partner) return res.status(404).json({success:false,message:'Profil Mitra tidak ditemukan.'});
    ensureEggSalesTable(db);
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const month=today.slice(0,7);
    const farms=queryAll<any>(db,`SELECT f.*, u.email AS owner_email,
      (SELECT MAX(dr.report_date) FROM daily_reports dr WHERE dr.farm_id=f.id) AS last_report_date,
      (SELECT dr.egg_count FROM daily_reports dr WHERE dr.farm_id=f.id ORDER BY dr.report_date DESC LIMIT 1) AS last_egg_count,
      (SELECT dr.productivity_rate FROM daily_reports dr WHERE dr.farm_id=f.id ORDER BY dr.report_date DESC LIMIT 1) AS last_productivity_rate,
      (SELECT dr.chicken_condition FROM daily_reports dr WHERE dr.farm_id=f.id ORDER BY dr.report_date DESC LIMIT 1) AS last_chicken_condition,
      (SELECT COALESCE(SUM(es.total_amount),0) FROM egg_sales es WHERE es.farm_id=f.id AND substr(es.sale_date,1,7)=?) AS month_sales_amount,
      (SELECT COALESCE(SUM(es.egg_count),0) FROM egg_sales es WHERE es.farm_id=f.id AND substr(es.sale_date,1,7)=?) AS month_sold_eggs
      FROM farms f LEFT JOIN users u ON u.id=f.owner_user_id WHERE f.partner_id=? ORDER BY f.owner_name ASC`,[month,month,partner.id]);
    const summary=queryOne<any>(db,`SELECT COUNT(DISTINCT f.id) AS total_farms, COALESCE(SUM(f.active_chickens),0) AS active_chickens,
      COALESCE(SUM(CASE WHEN dr.report_date=? THEN dr.egg_count ELSE 0 END),0) AS eggs_today,
      COALESCE(SUM(CASE WHEN substr(dr.report_date,1,7)=? THEN dr.egg_count ELSE 0 END),0) AS eggs_month
      FROM farms f LEFT JOIN daily_reports dr ON dr.farm_id=f.id WHERE f.partner_id=?`,[today,month,partner.id]) || {};
    const reportedToday=Number(queryOne<any>(db,`SELECT COUNT(DISTINCT dr.farm_id) AS total FROM daily_reports dr JOIN farms f ON f.id=dr.farm_id WHERE f.partner_id=? AND dr.report_date=?`,[partner.id,today])?.total||0);
    const issues=farms.filter((f:any)=>f.last_chicken_condition==='issue' || Number(f.last_productivity_rate||0)<75);
    return res.json({success:true,partner,summary:{totalFarms:Number(summary.total_farms||0),activeChickens:Number(summary.active_chickens||0),eggsToday:Number(summary.eggs_today||0),eggsMonth:Number(summary.eggs_month||0),reportedToday,missingToday:Math.max(0,Number(summary.total_farms||0)-reportedToday),needsAttention:issues.length},farms});
  } catch(err){ console.error(err); return res.status(500).json({success:false,message:'Gagal memuat dashboard Mitra.'}); }
});

// GPS -> alamat otomatis. Koordinat tetap menjadi sumber utama lokasi kandang.
router.get('/location/reverse', requireAuth, async (req: AuthRequest, res) => {
  try {
    const lat = Number(req.query.lat); const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ success: false, message: 'Koordinat tidak valid.' });
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1&accept-language=id`;
    const response = await fetch(url, { headers: { 'User-Agent': 'EggnestFarmHub/1.0', 'Accept-Language': 'id-ID,id;q=0.9' } });
    if (!response.ok) throw new Error(`Reverse geocoding gagal: ${response.status}`);
    const data: any = await response.json(); const a = data?.address || {};
    const province = String(a.state || a.region || '');
    const regency = String(a.county || a.city || a.town || a.municipality || '');
    const city = String(a.city || a.town || a.municipality || '');
    const district = String(a.city_district || a.district || a.suburb || '');
    const village = String(a.village || a.hamlet || a.neighbourhood || a.quarter || '');
    return res.json({ success: true, location: { fullAddress: String(data?.display_name || ''), province, regency, city, district, village, latitude: lat, longitude: lng } });
  } catch (err) {
    console.error('Reverse geocode error:', err);
    return res.status(502).json({ success: false, message: 'Alamat otomatis belum dapat diambil. Titik GPS tetap dapat digunakan.' });
  }
});

// ==========================================
// 4. FARMS MANAGEMENT ENDPOINTS
// ==========================================

router.get('/farms', requireAuth, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    ensureFarmerProfileColumns(db);
    if (req.user?.role === 'admin') {
      ensurePartnerTable(db);
      const farms = queryAll<any>(db, `SELECT f.*, p.partner_code, p.name AS partner_name, p.phone AS partner_phone FROM farms f LEFT JOIN partners p ON f.partner_id = p.id ORDER BY f.created_at DESC`);
      res.json({ success: true, farms });
    } else {
      const farms = queryAll<any>(db, `SELECT * FROM farms WHERE id = ?`, [req.user?.farmId]);
      res.json({ success: true, farms });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memuat data kandang.' });
  }
});

// Member-owned farm profile update. Only member-editable fields are accepted.
// Member mengelola profil kandang miliknya sendiri.
router.put('/farms/me/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'member') return res.status(403).json({ success: false, message: 'Endpoint ini khusus akun Member.' });
    const db = await getDb();
    ensureFarmerProfileColumns(db);
    const farm = queryOne<any>(db, `SELECT * FROM farms WHERE id = ?`, [req.user?.farmId]);
    if (!farm) return res.status(404).json({ success: false, message: 'Kandang Member tidak ditemukan.' });
    const b = req.body || {};
    const location = String(b.location ?? farm.location ?? '').trim();
    const fullAddress = String(b.fullAddress ?? b.full_address ?? farm.full_address ?? '').trim();
    const chickenBreed = String(b.chickenBreed ?? b.chicken_breed ?? farm.chicken_breed ?? '').trim();
    const activeChickens = Number(b.activeChickens ?? b.active_chickens ?? farm.active_chickens ?? 12);
    const currentAgeWeeks = Number(b.currentAgeWeeks ?? b.current_age_weeks ?? farm.current_age_weeks ?? 18);
    const lat = Number(b.latitude); const lng = Number(b.longitude);
    if (!location || !fullAddress) return res.status(400).json({ success: false, message: 'Lokasi/alamat kandang belum lengkap.' });
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ success: false, message: 'Titik GPS kandang wajib diambil.' });
    if (!chickenBreed) return res.status(400).json({ success: false, message: 'Jenis ayam wajib diisi.' });
    if (!Number.isInteger(activeChickens) || activeChickens < 1 || activeChickens > 1000) return res.status(400).json({ success: false, message: 'Jumlah ayam aktif tidak valid.' });
    if (!Number.isFinite(currentAgeWeeks) || currentAgeWeeks < 1 || currentAgeWeeks > 200) return res.status(400).json({ success: false, message: 'Usia ayam tidak valid.' });
    const now = new Date().toISOString(); const today = now.split('T')[0];
    runSql(db, `UPDATE farms SET location=?, full_address=?, latitude=?, longitude=?, province=?, regency=?, district=?, village=?, chicken_breed=?, active_chickens=?, current_age_weeks=?, chicken_age_reference_date=?, updated_at=? WHERE id=?`, [
      location, fullAddress, lat, lng, String(b.province ?? farm.province ?? ''), String(b.regency ?? location), String(b.district ?? farm.district ?? ''), String(b.village ?? farm.village ?? ''), chickenBreed, activeChickens, currentAgeWeeks, today, now, farm.id
    ]);
    return res.json({ success: true, message: 'Data kandang berhasil diperbarui.', farm: queryOne<any>(db, `SELECT * FROM farms WHERE id = ?`, [farm.id]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui data kandang.' });
  }
});

router.post('/admin/farms', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      farmCode,
      ownerName = '',
      phone = '',
      password = '',
      purchaseDate = '',
      initialChickens = 12,
      chickenBreed = 'Layer Lohmann Brown Petelur Unggul',
      initialAgeWeeks = 18,
      partnerId = null,
    } = req.body || {};

    const cleanOwner = String(ownerName || '').trim();
    const cleanPhone = String(phone || '').trim();
    const cleanPassword = String(password || '');

    if (!cleanOwner) {
      return res.status(400).json({ success: false, message: 'Nama Member wajib diisi.' });
    }
    if (!cleanPhone) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp Member wajib diisi untuk login.' });
    }
    if (cleanPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password awal Member minimal 6 karakter.' });
    }
    if (!partnerId) {
      return res.status(400).json({ success: false, message: 'Afiliasi Mitra Pendamping wajib dipilih.' });
    }

    const db = await getDb();
    ensureFarmerProfileColumns(db);
    ensurePartnerTable(db);

    const partner = queryOne<any>(db, `SELECT id, partner_code, name FROM partners WHERE id = ? AND status = 'active'`, [partnerId]);
    if (!partner) {
      return res.status(400).json({ success: false, message: 'Mitra Pendamping tidak valid atau sedang nonaktif.' });
    }

    const duplicatePhone = queryOne<any>(db, `SELECT id FROM users WHERE phone = ?`, [cleanPhone]);
    if (duplicatePhone) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp tersebut sudah digunakan akun lain.' });
    }

    const allCodes = queryAll<{ farm_code: string }>(db, `SELECT farm_code FROM farms`);
    const numCodes = allCodes
      .map((c) => parseInt(String(c.farm_code || '').replace('EN-', ''), 10))
      .filter((n) => !isNaN(n));

    const maxNum = numCodes.length > 0 ? Math.max(...numCodes) : 100;
    const generatedCode = `EN-${String(maxNum + 1).padStart(6, '0')}`;
    const cleanCode = String(farmCode || '').trim().toUpperCase() || generatedCode;

    const duplicateFarm = queryOne<any>(db, `SELECT id FROM farms WHERE farm_code = ?`, [cleanCode]);
    if (duplicateFarm) {
      return res.status(400).json({ success: false, message: `Farm ID ${cleanCode} sudah digunakan.` });
    }

    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const newFarmId = `farm-${Date.now()}`;
    const newUserId = `user-${Date.now()}`;

    runSql(
      db,
      `INSERT INTO farms (
        id, farm_code, owner_user_id, owner_name, phone, location,
        purchase_date, full_address, latitude, longitude, province, regency, district, village, partner_id,
        activation_date, initial_chickens, active_chickens, chicken_breed,
        initial_age_weeks, current_age_weeks, warranty_end, status,
        photo_url, created_at, updated_at
      ) VALUES (
        ?, ?, NULL, ?, ?, '',
        ?, NULL, NULL, NULL, '', '', '', '', ?,
        ?, ?, ?, ?,
        ?, ?, '30 Hari setelah aktivasi', 'active',
        'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1000&q=80', ?, ?
      )`,
      [
        newFarmId,
        cleanCode,
        cleanOwner,
        cleanPhone,
        purchaseDate || null,
        partner.id,
        today,
        Number(initialChickens),
        Number(initialChickens),
        chickenBreed,
        Number(initialAgeWeeks),
        Number(initialAgeWeeks),
        now,
        now,
      ]
    );

    try {
      runSql(
        db,
        `INSERT INTO users (id, phone, full_name, password_hash, role, status, farm_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'member', 'active', ?, ?, ?)`,
        [newUserId, cleanPhone, cleanOwner, bcrypt.hashSync(cleanPassword, 10), newFarmId, now, now]
      );

      runSql(
        db,
        `UPDATE farms SET owner_user_id = ?, updated_at = ? WHERE id = ?`,
        [newUserId, now, newFarmId]
      );
    } catch (accountErr) {
      runSql(db, `DELETE FROM farms WHERE id = ?`, [newFarmId]);
      throw accountErr;
    }

    runSql(
      db,
      `INSERT INTO admin_logs (id, admin_user_id, admin_name, target_user_id, action, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        `log-${Date.now()}`,
        req.user!.id,
        req.user!.fullName || 'Administrator Eggnest',
        newUserId,
        'CREATE_MEMBER_ACCOUNT',
        `Membuat akun Member ${cleanOwner} • Farm ${cleanCode} • Afiliasi ${partner.partner_code} ${partner.name}`,
        now,
      ]
    );

    const createdFarm = queryOne<any>(db, `SELECT f.*, p.partner_code, p.name AS partner_name, p.phone AS partner_phone
      FROM farms f LEFT JOIN partners p ON p.id=f.partner_id WHERE f.id = ?`, [newFarmId]);

    return res.status(201).json({
      success: true,
      message: `Akun Member dan Farm ID ${cleanCode} berhasil dibuat di bawah ${partner.partner_code} — ${partner.name}.`,
      farm: createdFarm,
    });
  } catch (err: any) {
    console.error('Error creating member/farm:', err);
    return res.status(500).json({ success: false, message: 'Gagal membuat akun Member dan Farm ID.' });
  }
});

router.put('/admin/farms/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const farmId = req.params.id;
    const {
      ownerName,
      phone,
      location,
      purchaseDate,
      fullAddress,
      latitude,
      longitude,
      activeChickens,
      chickenBreed,
      currentAgeWeeks,
      status,
      province, regency, district, village, partnerId,
    } = req.body;

    const db = await getDb();
    ensureFarmerProfileColumns(db);
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    const lat = latitude === '' || latitude === undefined ? null : latitude === null ? null : Number(latitude);
    const lng = longitude === '' || longitude === undefined ? null : longitude === null ? null : Number(longitude);
    if (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) return res.status(400).json({ success: false, message: 'Latitude tidak valid.' });
    if (lng !== null && (!Number.isFinite(lng) || lng < -180 || lng > 180)) return res.status(400).json({ success: false, message: 'Longitude tidak valid.' });

    runSql(
      db,
      `UPDATE farms SET
        owner_name = COALESCE(?, owner_name),
        phone = COALESCE(?, phone),
        location = COALESCE(?, location),
        purchase_date = COALESCE(?, purchase_date),
        full_address = COALESCE(?, full_address),
        latitude = CASE WHEN ? = 1 THEN ? ELSE latitude END,
        longitude = CASE WHEN ? = 1 THEN ? ELSE longitude END,
        active_chickens = COALESCE(?, active_chickens),
        chicken_breed = COALESCE(?, chicken_breed),
        current_age_weeks = COALESCE(?, current_age_weeks),
        chicken_age_reference_date = CASE WHEN ? = 1 THEN ? ELSE chicken_age_reference_date END,
        province = COALESCE(?, province), regency = COALESCE(?, regency), district = COALESCE(?, district), village = COALESCE(?, village),
        partner_id = CASE WHEN ? = 1 THEN ? ELSE partner_id END,
        status = COALESCE(?, status),
        updated_at = ?
       WHERE id = ?`,
      [
        ownerName ?? null,
        phone ?? null,
        location ?? null,
        purchaseDate ?? null,
        fullAddress ?? null,
        Object.prototype.hasOwnProperty.call(req.body, 'latitude') ? 1 : 0,
        lat,
        Object.prototype.hasOwnProperty.call(req.body, 'longitude') ? 1 : 0,
        lng,
        activeChickens === undefined ? null : Number(activeChickens),
        chickenBreed ?? null,
        currentAgeWeeks === undefined ? null : Number(currentAgeWeeks),
        currentAgeWeeks === undefined ? 0 : 1,
        today,
        province ?? null, regency ?? null, district ?? null, village ?? null,
        Object.prototype.hasOwnProperty.call(req.body, 'partnerId') ? 1 : 0, partnerId || null,
        status ?? null,
        now,
        farmId,
      ]
    );

    const updated = queryOne<any>(db, `SELECT * FROM farms WHERE id = ?`, [farmId]);
    if (!updated) return res.status(404).json({ success: false, message: 'Kandang tidak ditemukan.' });
    return res.json({ success: true, message: 'Data peternak dan kandang berhasil diperbarui.', farm: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memperbarui data kandang.' });
  }
});

router.delete('/admin/farms/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const farmId = req.params.id;
    const deleteMember =
      String(req.query.deleteMember ?? 'false').toLowerCase() === 'true';

    const db = await getDb();

    const farm = queryOne<any>(
      db,
      `
      SELECT
        id,
        farm_code,
        owner_user_id,
        owner_name
      FROM farms
      WHERE id = ?
      `,
      [farmId]
    );

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm ID tidak ditemukan.',
      });
    }

    const ownerUserId = farm.owner_user_id || null;

    /*
      Relasi database:
      farms
        -> daily_reports      ON DELETE CASCADE
        -> support_tickets    ON DELETE CASCADE
              -> support_messages ON DELETE CASCADE
        -> alerts             ON DELETE CASCADE

      Jadi cukup hapus farm, data turunannya ikut terhapus.
    */
    runSql(db, `DELETE FROM farms WHERE id = ?`, [farmId]);

    /*
      Jika diminta menghapus member, hanya role MEMBER yang boleh dihapus.
      Ini mencegah akun admin / veterinarian ikut terhapus secara tidak sengaja.
    */
    let memberDeleted = false;

    if (deleteMember && ownerUserId) {
      const ownerUser = queryOne<any>(
        db,
        `
        SELECT id, role
        FROM users
        WHERE id = ?
        `,
        [ownerUserId]
      );

      if (ownerUser?.role === 'member') {
        runSql(
          db,
          `
          DELETE FROM users
          WHERE id = ?
            AND role = 'member'
          `,
          [ownerUserId]
        );

        memberDeleted = true;
      }
    }

    return res.json({
      success: true,
      message: memberDeleted
        ? `Farm ${farm.farm_code} dan akun member berhasil dihapus.`
        : `Farm ${farm.farm_code} berhasil dihapus.`,
    });
  } catch (err) {
    console.error('DELETE FARM ERROR:', err);

    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus Farm ID.',
    });
  }
});

// ==========================================
// 4B. MEMBER NOTIFICATION CENTER
// ==========================================
router.get('/notifications', requireAuth, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    ensureNotificationTable(db);
    if (req.user?.role !== 'member') return res.json({ success: true, notifications: [] });

    const user = queryOne<any>(db, `SELECT id, farm_id FROM users WHERE id = ?`, [req.user!.id]);
    const farm = user?.farm_id ? queryOne<any>(db, `SELECT * FROM farms WHERE id = ?`, [user.farm_id]) : null;
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

    // Useful reminders are generated idempotently, not on every refresh.
    if (farm) {
      const loc = String(farm.location || '').trim().toLowerCase();
      const complete = Boolean(String(farm.location || '').trim()) && loc !== 'indonesia' && !loc.includes('belum') &&
        Boolean(String(farm.full_address || '').trim()) && farm.latitude != null && farm.longitude != null &&
        Boolean(String(farm.chicken_breed || '').trim()) && Number(farm.active_chickens) > 0 && Number(farm.current_age_weeks) > 0;
      if (!complete) createMemberNotification(db, { userId: user.id, farmId: farm.id, type: 'warning', category: 'farm', title: 'Data Kandang Belum Lengkap', message: 'Lengkapi profil kandang Anda. Tekan Ambil Lokasi Kandang agar GPS dan alamat terisi otomatis.', link: '/profile', dedupeKey: `farm-profile:${farm.id}` });

      const todayReport = queryOne<any>(db, `SELECT id FROM daily_reports WHERE farm_id = ? AND report_date = ?`, [farm.id, today]);
      if (!todayReport && complete) createMemberNotification(db, { userId: user.id, farmId: farm.id, type: 'warning', category: 'report', title: 'Laporan Hari Ini Belum Diisi', message: 'Isi telur, pakan, dan kondisi Ayam #1 sampai #12 hari ini.', link: '/reports', dedupeKey: `report-reminder:${farm.id}:${today}` });

      if (farm.warranty_end) {
        const days = Math.ceil((new Date(`${farm.warranty_end}T23:59:59`).getTime() - Date.now()) / 86400000);
        if (days >= 0 && days <= 30) createMemberNotification(db, { userId: user.id, farmId: farm.id, type: 'warning', category: 'warranty', title: 'Masa Garansi Mendekati Berakhir', message: days === 0 ? 'Masa garansi kandang berakhir hari ini.' : `Masa garansi tersisa ${days} hari.`, link: '/profile', dedupeKey: `warranty:${farm.id}:${farm.warranty_end}` });
      }
    }

    const notifications = queryAll<any>(db, `SELECT * FROM member_notifications WHERE user_id = ? OR (user_id IS NULL AND farm_id = ?) ORDER BY created_at DESC LIMIT 100`, [req.user!.id, req.user?.farmId || '']);
    return res.json({ success: true, notifications });
  } catch (err) {
    console.error('GET NOTIFICATIONS ERROR:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat notifikasi.' });
  }
});

router.patch('/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const db = await getDb(); ensureNotificationTable(db);
    runSql(db, `UPDATE member_notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [req.params.id, req.user!.id]);
    return res.json({ success: true });
  } catch { return res.status(500).json({ success: false, message: 'Gagal menandai notifikasi.' }); }
});

router.patch('/notifications/read-all', requireAuth, async (req: AuthRequest, res) => {
  try {
    const db = await getDb(); ensureNotificationTable(db);
    runSql(db, `UPDATE member_notifications SET is_read = 1 WHERE user_id = ?`, [req.user!.id]);
    return res.json({ success: true });
  } catch { return res.status(500).json({ success: false, message: 'Gagal menandai semua notifikasi.' }); }
});

// ==========================================
// 5. SUPPORT TICKETING SYSTEM (THREADED & PERSISTED)
// ==========================================


// ==========================================
// DOKTER HEWAN SIAGA — ASISTEN KANDANG 24 JAM
// Gemini runs ONLY on the server. Never expose GEMINI_API_KEY to the browser.
// ==========================================
function ensureVetAiTables(database: any): void {
  database.run(`CREATE TABLE IF NOT EXISTS vet_ai_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    farm_id TEXT,
    role TEXT NOT NULL CHECK(role IN ('user','assistant')),
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TEXT NOT NULL
  )`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_vet_ai_user_created
    ON vet_ai_messages(user_id, created_at)`);
}

function safeJson(value: any): string {
  try { return JSON.stringify(value); } catch { return String(value ?? ''); }
}

function buildFarmContext(farm: any, reports: any[]): string {
  const profileComplete = isMemberFarmProfileComplete(farm);
  const recent = reports.slice(-7).map((r: any) => ({
    tanggal: r.report_date,
    telur: Number(r.egg_count || 0),
    pakanKg: Number(r.feed_kg || 0),
    kondisi: r.chicken_condition,
    masalah: (() => {
      try { return r.issue_types ? JSON.parse(r.issue_types) : []; } catch { return r.issue_types || []; }
    })(),
    catatan: r.notes || '',
  }));

  if (!profileComplete) {
    return [
      `Farm ID: ${farm?.farm_code || '-'}`,
      'Status profil kandang: BELUM LENGKAP / BELUM DIAKTIFKAN MEMBER',
      'Jenis ayam: belum diisi member',
      'Ayam aktif: belum diisi member',
      'Umur ayam: belum diisi member',
      'Lokasi: belum diisi member',
      `Laporan kandang tersimpan: ${reports.length}`,
      `Laporan 7 terakhir: ${safeJson(recent)}`,
      'PENTING: Jangan menganggap nilai paket/default admin sebagai kondisi kandang aktual member.',
    ].join('\n');
  }

  return [
    `Farm ID: ${farm?.farm_code || '-'}`,
    'Status profil kandang: LENGKAP',
    `Jenis ayam: ${farm.chicken_breed}`,
    `Ayam aktif: ${Number(farm.active_chickens)}`,
    `Umur ayam: ${Number(farm.current_age_weeks)} minggu`,
    `Lokasi: ${farm.location}`,
    `Laporan 7 terakhir: ${safeJson(recent)}`,
  ].join('\n');
}

function localUploadToInlinePart(photoUrl?: string): any | null {
  if (!photoUrl || !photoUrl.startsWith('/uploads/')) return null;
  try {
    const relative = photoUrl.replace(/^\/uploads\//, '');
    const filePath =
      process.env.NODE_ENV === 'production'
        ? path.join(process.cwd(), 'dist', 'client', 'uploads', relative)
        : path.join(process.cwd(), 'public', 'uploads', relative);

    if (!fs.existsSync(filePath)) return null;
    const ext = path.extname(filePath).toLowerCase();
    const mime =
      ext === '.png' ? 'image/png' :
      ext === '.webp' ? 'image/webp' :
      'image/jpeg';

    return {
      inline_data: {
        mime_type: mime,
        data: fs.readFileSync(filePath).toString('base64'),
      },
    };
  } catch {
    return null;
  }
}

router.get('/vet-ai/history', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'member' && req.user?.role !== 'mitra') {
      return res.status(403).json({ success: false, message: 'Fitur ini hanya untuk Member dan Mitra Pendamping.' });
    }
    const db = await getDb();
    ensureVetAiTables(db);

    let farmId = '';
    if (req.user?.role === 'member') {
      farmId = String(req.user?.farmId || '');
    } else {
      ensurePartnerAccountTable(db);
      ensureFarmerProfileColumns(db);
      farmId = String(req.query.farmId || '').trim();
      if (!farmId) return res.status(400).json({ success: false, message: 'Pilih Farm ID yang akan dikonsultasikan.' });
      const account = queryOne<any>(db, `SELECT partner_id FROM partner_accounts WHERE id = ?`, [req.user!.id]);
      const allowed = account?.partner_id ? queryOne<any>(db, `SELECT id FROM farms WHERE id = ? AND partner_id = ?`, [farmId, account.partner_id]) : null;
      if (!allowed) return res.status(403).json({ success: false, message: 'Farm ID ini bukan Member binaan Anda.' });
    }

    const messages = queryAll<any>(db,
      `SELECT id, role, message, attachment_url, created_at
       FROM vet_ai_messages WHERE user_id = ? AND farm_id = ? ORDER BY created_at ASC LIMIT 100`,
      [req.user!.id, farmId]
    );
    res.json({ success: true, messages });
  } catch (err) {
    console.error('Vet AI history error:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat riwayat Asisten Kandang.' });
  }
});

router.delete('/vet-ai/history', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'member' && req.user?.role !== 'mitra') {
      return res.status(403).json({ success: false, message: 'Fitur ini hanya untuk Member dan Mitra Pendamping.' });
    }
    const db = await getDb();
    ensureVetAiTables(db);
    let farmId = String(req.user?.farmId || '');
    if (req.user?.role === 'mitra') {
      ensurePartnerAccountTable(db); ensureFarmerProfileColumns(db);
      farmId = String(req.query.farmId || '').trim();
      const account = queryOne<any>(db, `SELECT partner_id FROM partner_accounts WHERE id = ?`, [req.user!.id]);
      const allowed = farmId && account?.partner_id ? queryOne<any>(db, `SELECT id FROM farms WHERE id = ? AND partner_id = ?`, [farmId, account.partner_id]) : null;
      if (!allowed) return res.status(403).json({ success: false, message: 'Farm ID tidak valid untuk Mitra ini.' });
    }
    runSql(db, `DELETE FROM vet_ai_messages WHERE user_id = ? AND farm_id = ?`, [req.user!.id, farmId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghapus riwayat chat.' });
  }
});

router.post('/vet-ai/chat', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'member' && req.user?.role !== 'mitra') {
      return res.status(403).json({ success: false, message: 'Fitur ini hanya untuk Member dan Mitra Pendamping.' });
    }

    const message = String(req.body?.message || '').trim();
    const photoUrl = String(req.body?.photoUrl || '').trim();
    if (!message && !photoUrl) return res.status(400).json({ success: false, message: 'Tulis pertanyaan atau kirim foto terlebih dahulu.' });

    const apiKey = String(process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) return res.status(503).json({ success: false, message: 'Dokter Hewan Siaga belum diaktifkan. Tambahkan GEMINI_API_KEY pada environment server.' });

    const db = await getDb();
    ensureVetAiTables(db); ensureFarmerProfileColumns(db);

    let farmId = '';
    let actorName = 'Member Eggnest';
    if (req.user?.role === 'member') {
      const user = queryOne<any>(db, `SELECT * FROM users WHERE id = ?`, [req.user!.id]);
      farmId = String(req.user?.farmId || user?.farm_id || '');
      actorName = String(user?.full_name || 'Member Eggnest');
    } else {
      ensurePartnerAccountTable(db);
      farmId = String(req.body?.farmId || '').trim();
      if (!farmId) return res.status(400).json({ success: false, message: 'Pilih Farm ID yang akan dikonsultasikan.' });
      const account = queryOne<any>(db, `SELECT pa.partner_id, p.name FROM partner_accounts pa JOIN partners p ON p.id = pa.partner_id WHERE pa.id = ?`, [req.user!.id]);
      const allowed = account?.partner_id ? queryOne<any>(db, `SELECT id FROM farms WHERE id = ? AND partner_id = ?`, [farmId, account.partner_id]) : null;
      if (!allowed) return res.status(403).json({ success: false, message: 'Farm ID ini bukan Member binaan Anda.' });
      actorName = String(account?.name || 'Mitra Pendamping');
    }

    const farm = farmId ? queryOne<any>(db, `SELECT * FROM farms WHERE id = ?`, [farmId]) : null;
    if (!farm) return res.status(404).json({ success: false, message: 'Farm ID tidak ditemukan.' });
    const reports = queryAll<any>(db, `SELECT * FROM daily_reports WHERE farm_id = ? ORDER BY report_date ASC`, [farmId]);
    const history = queryAll<any>(db, `SELECT role, message FROM vet_ai_messages WHERE user_id = ? AND farm_id = ? ORDER BY created_at DESC LIMIT 12`, [req.user!.id, farmId]).reverse();

    const now = new Date().toISOString();
    const userMsgId = `vet-user-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    runSql(db, `INSERT INTO vet_ai_messages (id, user_id, farm_id, role, message, attachment_url, created_at) VALUES (?, ?, ?, 'user', ?, ?, ?)`,
      [userMsgId, req.user!.id, farmId, message || 'Mohon analisis foto kondisi kandang ini.', photoUrl || null, now]);

    const contents:any[] = history.map((item:any)=>({ role:item.role==='assistant'?'model':'user', parts:[{text:String(item.message||'')}] }));
    const latestParts:any[]=[{text:message || 'Mohon analisis foto ini dalam konteks pemeliharaan ayam petelur.'}];
    const imagePart=localUploadToInlinePart(photoUrl); if(imagePart) latestParts.push(imagePart);
    contents.push({role:'user',parts:latestParts});

    const roleInstruction = req.user?.role === 'mitra'
      ? `Anda sedang membantu MITRA PENDAMPING bernama ${actorName}. Mitra adalah operator teknis yang menangani Farm ID ini dan boleh menerima arahan pemeriksaan yang lebih operasional.`
      : `Anda sedang membantu MEMBER bernama ${actorName}. Gunakan bahasa sederhana dan jangan membebani member dengan diagnosis teknis.`;

    const systemInstruction = `Anda adalah "Dokter Hewan Siaga — Asisten Kandang 24 Jam" milik Eggnest Farm.\n${roleInstruction}\n\nKONTEKS FARM ID:\n${buildFarmContext(farm, reports)}\n\nATURAN WAJIB:\n- Gunakan hanya data Farm ID ini. Jangan mengarang data.\n- Anda adalah asisten AI pendamping, bukan pengganti pemeriksaan dokter hewan.\n- Jangan menyatakan diagnosis pasti hanya dari chat/foto. Gunakan istilah kemungkinan/indikasi/perlu diperiksa.\n- Bila ada kematian mendadak, sesak berat, perdarahan, kejang, banyak ayam sakit sekaligus, penurunan drastis, atau dugaan penyakit menular: sarankan segera eskalasi ke Tim Eggnest/dokter hewan.\n- Jangan memberikan dosis obat resep, antibiotik, hormon, atau obat keras tanpa arahan dokter hewan.\n- Jawaban ideal: ringkasan kondisi, 2-5 langkah aman yang bisa dilakukan sekarang, tanda bahaya, dan kapan perlu eskalasi.\n- Jangan menyebut diri Anda Gemini.`;

    const model = String(process.env.GEMINI_MODEL || 'gemini-3.7-flash').trim();
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method:'POST', headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},
      body:JSON.stringify({system_instruction:{parts:[{text:systemInstruction}]},contents,generationConfig:{temperature:0.35,maxOutputTokens:900}})
    });
    const geminiData:any=await geminiResponse.json().catch(()=>({}));
    if(!geminiResponse.ok) return res.status(502).json({success:false,message:geminiData?.error?.message||'Asisten Kandang sedang tidak dapat menjawab. Silakan coba lagi.'});
    const reply=String(geminiData?.candidates?.[0]?.content?.parts?.map((part:any)=>part?.text||'').join('\n').trim()||'');
    if(!reply) return res.status(502).json({success:false,message:'Asisten Kandang belum menghasilkan jawaban. Silakan coba lagi.'});

    const assistantMsgId=`vet-ai-${Date.now()}-${Math.round(Math.random()*1e6)}`;
    runSql(db, `INSERT INTO vet_ai_messages (id, user_id, farm_id, role, message, attachment_url, created_at) VALUES (?, ?, ?, 'assistant', ?, NULL, ?)`,
      [assistantMsgId,req.user!.id,farmId,reply,new Date().toISOString()]);
    const urgent=/segera|dokter hewan|kematian|sesak|perdarahan|kejang|menular|darurat/i.test(reply);
    res.json({success:true,reply,urgent,message:{id:assistantMsgId,role:'assistant',message:reply,attachment_url:null,created_at:new Date().toISOString()}});
  } catch (err:any) {
    console.error('Vet AI chat error:',err);
    res.status(500).json({success:false,message:'Terjadi kesalahan saat menghubungi Asisten Kandang.'});
  }
});


router.get('/tickets', requireAuth, async (req: AuthRequest, res) => {
  try {
    const db = await getDb(); ensureFarmerProfileColumns(db);
    let tickets:any[]=[];
    if(req.user?.role==='admin') {
      tickets=queryAll<any>(db,`SELECT * FROM support_tickets ORDER BY created_at DESC`);
    } else if(req.user?.role==='mitra') {
      ensurePartnerAccountTable(db);
      const account=queryOne<any>(db,`SELECT partner_id FROM partner_accounts WHERE id = ?`,[req.user!.id]);
      if(!account?.partner_id) return res.status(403).json({success:false,message:'Akun Mitra belum terhubung.'});
      const farmId=String(req.query.farmId||'').trim();
      tickets=farmId
        ? queryAll<any>(db,`SELECT t.* FROM support_tickets t JOIN farms f ON f.id=t.farm_id WHERE f.partner_id=? AND f.id=? ORDER BY t.created_at DESC`,[account.partner_id,farmId])
        : queryAll<any>(db,`SELECT t.* FROM support_tickets t JOIN farms f ON f.id=t.farm_id WHERE f.partner_id=? ORDER BY t.created_at DESC`,[account.partner_id]);
    } else {
      tickets=queryAll<any>(db,`SELECT * FROM support_tickets WHERE farm_id = ? ORDER BY created_at DESC`,[req.user?.farmId]);
    }
    const populatedTickets=tickets.map(t=>({...t,messages:queryAll<any>(db,`SELECT * FROM support_messages WHERE ticket_id = ? ORDER BY created_at ASC`,[t.id])}));
    res.json({success:true,tickets:populatedTickets});
  } catch(err) { res.status(500).json({success:false,message:'Gagal memuat tiket bantuan.'}); }
});

router.post('/tickets', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { farmId: requestedFarmId, category, title, description, eggCountToday, photoUrl, videoUrl } = req.body || {};
    if(!description || !String(description).trim()) return res.status(400).json({success:false,message:'Deskripsi keluhan wajib diisi.'});
    const db=await getDb(); ensureFarmerProfileColumns(db);

    let farm:any=null; let senderId=req.user!.id; let senderName='Peternak Eggnest'; let senderRoleForDb='member';
    if(req.user?.role==='mitra') {
      ensurePartnerAccountTable(db);
      const account=queryOne<any>(db,`SELECT pa.partner_id,p.name FROM partner_accounts pa JOIN partners p ON p.id=pa.partner_id WHERE pa.id=?`,[req.user!.id]);
      const farmId=String(requestedFarmId||'').trim();
      farm=farmId&&account?.partner_id?queryOne<any>(db,`SELECT * FROM farms WHERE id=? AND partner_id=?`,[farmId,account.partner_id]):null;
      if(!farm) return res.status(403).json({success:false,message:'Pilih Farm ID binaan yang valid.'});
      senderName=String(account?.name||'Mitra Pendamping');
    } else if(req.user?.role==='member') {
      const user=queryOne<any>(db,`SELECT * FROM users WHERE id=?`,[req.user!.id]);
      farm=user?.farm_id?queryOne<any>(db,`SELECT * FROM farms WHERE id=?`,[user.farm_id]):null;
      senderName=String(user?.full_name||'Member Eggnest');
    } else {
      return res.status(403).json({success:false,message:'Gunakan panel Admin untuk menindaklanjuti tiket.'});
    }
    if(!farm) return res.status(404).json({success:false,message:'Farm ID tidak ditemukan.'});

    const ticketId=`ticket-${Date.now()}`; const randomCode=`EN-CS-${Math.floor(10000+Math.random()*90000)}`; const now=new Date().toISOString();
    runSql(db,`INSERT INTO support_tickets (id,ticket_code,farm_id,farm_code,user_id,owner_name,category,title,description,egg_count_today,photo_url,video_url,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'Diterima',?,?)`,
      [ticketId,randomCode,farm.id,farm.farm_code,senderId,farm.owner_name,category||'Lainnya',title||category,description,eggCountToday?Number(eggCountToday):null,photoUrl||null,videoUrl||null,now,now]);
    const msgId=`msg-${Date.now()}`;
    runSql(db,`INSERT INTO support_messages (id,ticket_id,sender_id,sender_name,sender_role,message,attachment_url,created_at) VALUES (?,?,?,?,?,?,?,?)`,
      [msgId,ticketId,senderId,senderName,senderRoleForDb,description,photoUrl||null,now]);
    const createdTicket=queryOne<any>(db,`SELECT * FROM support_tickets WHERE id=?`,[ticketId]);
    createdTicket.messages=queryAll<any>(db,`SELECT * FROM support_messages WHERE ticket_id=?`,[ticketId]);
    if(farm.owner_user_id) createMemberNotification(db,{userId:farm.owner_user_id,farmId:farm.id,type:'info',category:'ticket',title:'Kandang Sedang Dikonsultasikan',message:`Mitra/Tim Eggnest membuka konsultasi #${randomCode} untuk Farm ID Anda.`,link:`/support?ticket=${ticketId}`,referenceId:ticketId,dedupeKey:`ticket-created:${ticketId}`});
    res.status(201).json({success:true,message:`Tiket #${randomCode} berhasil dikirim ke Tim Eggnest.`,ticket:createdTicket});
  } catch(err:any) { console.error('Error creating support ticket:',err); res.status(500).json({success:false,message:'Gagal membuat tiket bantuan.'}); }
});

router.post('/tickets/:id/messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const ticketId = req.params.id;
    const { message, attachmentUrl } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Pesan balasan tidak boleh kosong.' });
    }

    const db = await getDb();
    const user = queryOne<any>(db, `SELECT * FROM users WHERE id = ?`, [req.user!.id]);
    const ticket = queryOne<any>(db, `SELECT * FROM support_tickets WHERE id = ?`, [ticketId]);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan.' });
    }

    const senderRole = req.user?.role === 'admin' ? 'admin' : 'member';
    const senderName = req.user?.role === 'admin' ? 'Drh. Eggnest Technical Team' : (user?.full_name || 'Peternak');
    const msgId = `msg-${Date.now()}`;
    const now = new Date().toISOString();

    runSql(
      db,
      `INSERT INTO support_messages (id, ticket_id, sender_id, sender_name, sender_role, message, attachment_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [msgId, ticketId, user?.id, senderName, senderRole, message, attachmentUrl || null, now]
    );

    // If admin replies, update status to 'Solusi Diberikan' if it was 'Diterima' or 'Diproses'
    if (senderRole === 'admin' && (ticket.status === 'Diterima' || ticket.status === 'Diproses')) {
      runSql(
        db,
        `UPDATE support_tickets SET status = 'Solusi Diberikan', admin_notes = ?, updated_at = ? WHERE id = ?`,
        [message, now, ticketId]
      );
    } else {
      runSql(db, `UPDATE support_tickets SET updated_at = ? WHERE id = ?`, [now, ticketId]);
    }

    if (senderRole === 'admin') {
      createMemberNotification(db, { userId: ticket.user_id, farmId: ticket.farm_id, type: 'success', category: 'ticket', title: 'Balasan Baru dari Tim Eggnest', message: `Tiket #${ticket.ticket_code} mendapat balasan/solusi baru.`, link: `/support?ticket=${ticketId}`, referenceId: ticketId, dedupeKey: `ticket-reply:${msgId}` });
    }
    const messages = queryAll<any>(db, `SELECT * FROM support_messages WHERE ticket_id = ? ORDER BY created_at ASC`, [ticketId]);
    res.json({ success: true, message: 'Balasan terkirim.', messages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengirim balasan.' });
  }
});

router.patch('/admin/tickets/:id/status', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const ticketId = req.params.id;
    const { status, adminNotes } = req.body;

    const validStatuses = ['Diterima', 'Diproses', 'Solusi Diberikan', 'Selesai'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tiket tidak valid.' });
    }

    const db = await getDb();
    const now = new Date().toISOString();
    const ticket = queryOne<any>(db, `SELECT * FROM support_tickets WHERE id = ?`, [ticketId]);
    if (!ticket) return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan.' });

    runSql(
      db,
      `UPDATE support_tickets SET
        status = ?,
        admin_notes = COALESCE(?, admin_notes),
        updated_at = ?
       WHERE id = ?`,
      [status, adminNotes || null, now, ticketId]
    );

    const statusText: Record<string, string> = { 'Diterima': 'Konsultasi Anda sudah diterima Tim Eggnest.', 'Diproses': 'Konsultasi Anda sedang diproses oleh Tim Eggnest.', 'Solusi Diberikan': 'Solusi untuk konsultasi Anda sudah tersedia.', 'Selesai': 'Konsultasi telah selesai. Jika masalah berlanjut, silakan buat konsultasi baru.' };
    createMemberNotification(db, { userId: ticket.user_id, farmId: ticket.farm_id, type: status === 'Selesai' ? 'success' : 'info', category: 'ticket', title: `Tiket ${status}`, message: `#${ticket.ticket_code} — ${statusText[status]}`, link: `/support?ticket=${ticketId}`, referenceId: ticketId, dedupeKey: `ticket-status:${ticketId}:${status}` });
    res.json({ success: true, message: `Status tiket diperbarui menjadi "${status}".` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui status tiket.' });
  }
});

// ==========================================
// 6. ACADEMY CMS ENDPOINTS
// ==========================================

router.get('/academy', async (req, res) => {
  try {
    const db = await getDb();
    const isMemberOnly = req.query.all !== 'true';

    const sql = isMemberOnly
      ? `SELECT * FROM academy_contents WHERE published = 1 ORDER BY is_recommended DESC, created_at DESC`
      : `SELECT * FROM academy_contents ORDER BY created_at DESC`;

    const contents = queryAll<any>(db, sql);
    res.json({ success: true, contents });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memuat materi Academy.' });
  }
});

router.post('/admin/academy', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      title,
      category,
      description,
      content,
      type = 'article',
      videoUrl,
      duration,
      thumbnail,
      readTime,
      published = true,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Judul dan konten materi wajib diisi.' });
    }

    const db = await getDb();
    const id = `acad-${Date.now()}`;
    const now = new Date().toISOString();

    runSql(
      db,
      `INSERT INTO academy_contents (
        id, title, category, description, content, type, video_url, duration, thumbnail, read_time, published, is_recommended, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        id,
        title,
        category || 'Produksi Telur',
        description || '',
        content,
        type,
        videoUrl || null,
        duration || '2 menit',
        thumbnail || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
        readTime || '2 mnt baca',
        published ? 1 : 0,
        now,
        now,
      ]
    );

    const created = queryOne<any>(db, `SELECT * FROM academy_contents WHERE id = ?`, [id]);
    if (published) notifyAllActiveMembers(db, { type: 'info', category: 'academy', title: 'Materi Academy Baru', message: title, link: `/academy?content=${id}`, referenceId: id, dedupePrefix: `academy-published:${id}` });
    res.status(201).json({ success: true, message: 'Materi Academy baru berhasil dipublikasikan.', content: created });
  } catch (err: any) {
    console.error('Error adding academy content:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat materi Academy.' });
  }
});

router.put('/admin/academy/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id;
    const { title, category, description, content, type, videoUrl, duration, thumbnail, readTime } = req.body;
    const db = await getDb();
    const now = new Date().toISOString();

    runSql(
      db,
      `UPDATE academy_contents SET
        title = COALESCE(?, title),
        category = COALESCE(?, category),
        description = COALESCE(?, description),
        content = COALESCE(?, content),
        type = COALESCE(?, type),
        video_url = COALESCE(?, video_url),
        duration = COALESCE(?, duration),
        thumbnail = COALESCE(?, thumbnail),
        read_time = COALESCE(?, read_time),
        updated_at = ?
       WHERE id = ?`,
      [title, category, description, content, type, videoUrl, duration, thumbnail, readTime, now, id]
    );

    const updated = queryOne<any>(db, `SELECT * FROM academy_contents WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Materi Academy berhasil diperbarui.', content: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui materi.' });
  }
});

router.patch('/admin/academy/:id/publish', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id;
    const db = await getDb();
    const current = queryOne<any>(db, `SELECT published FROM academy_contents WHERE id = ?`, [id]);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Materi tidak ditemukan.' });
    }

    const newStatus = current.published === 1 ? 0 : 1;
    const now = new Date().toISOString();
    runSql(db, `UPDATE academy_contents SET published = ?, updated_at = ? WHERE id = ?`, [newStatus, now, id]);
    if (newStatus === 1) { const material = queryOne<any>(db, `SELECT title FROM academy_contents WHERE id = ?`, [id]); notifyAllActiveMembers(db, { type: 'info', category: 'academy', title: 'Materi Academy Baru', message: material?.title || 'Materi baru telah dipublikasikan.', link: `/academy?content=${id}`, referenceId: id, dedupePrefix: `academy-published:${id}` }); }

    res.json({
      success: true,
      message: `Status materi diubah menjadi: ${newStatus === 1 ? 'Dipublikasikan (Terlihat oleh Member)' : 'Draft (Disembunyikan)'}`,
      published: newStatus === 1,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengubah status publikasi materi.' });
  }
});

router.patch('/admin/academy/:id/recommend', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id;
    const db = await getDb();
    const current = queryOne<any>(db, `SELECT is_recommended FROM academy_contents WHERE id = ?`, [id]);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Materi tidak ditemukan.' });
    }

    const newStatus = current.is_recommended === 1 ? 0 : 1;
    const now = new Date().toISOString();
    runSql(db, `UPDATE academy_contents SET is_recommended = ?, updated_at = ? WHERE id = ?`, [newStatus, now, id]);
    if (newStatus === 1) { const material = queryOne<any>(db, `SELECT title, published FROM academy_contents WHERE id = ?`, [id]); if (material?.published === 1) notifyAllActiveMembers(db, { type: 'success', category: 'academy', title: 'Rekomendasi Academy untuk Anda', message: material?.title || 'Ada materi rekomendasi baru.', link: `/academy?content=${id}`, referenceId: id, dedupePrefix: `academy-recommended:${id}` }); }

    res.json({
      success: true,
      message: `Materi ${newStatus === 1 ? 'dijadikan Rekomendasi Utama' : 'dihapus dari Rekomendasi Utama'}.`,
      isRecommended: newStatus === 1,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengubah rekomendasi materi.' });
  }
});

router.delete('/admin/academy/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id;
    const db = await getDb();
    runSql(db, `DELETE FROM academy_contents WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Materi berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghapus materi.' });
  }
});

// ==========================================
// EXPORT EXCEL ENDPOINT
// ==========================================
router.get('/admin/export/:type', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const type = req.params.type.toLowerCase();
    const db = await getDb();
    ensureFarmerProfileColumns(db);
    let rows: any[] = [];
    let sheetName = 'DATA';
    ensurePartnerTable(db);
    const province = String(req.query.province || ''); const regency = String(req.query.regency || '');
    const district = String(req.query.district || ''); const village = String(req.query.village || ''); const partnerId = String(req.query.partnerId || '');
    const farmWhere: string[] = []; const farmParams: any[] = [];
    if (province && province !== 'all') { farmWhere.push('f.province = ?'); farmParams.push(province); }
    if (regency && regency !== 'all') { farmWhere.push('f.regency = ?'); farmParams.push(regency); }
    if (district && district !== 'all') { farmWhere.push('f.district = ?'); farmParams.push(district); }
    if (village && village !== 'all') { farmWhere.push('f.village = ?'); farmParams.push(village); }
    if (partnerId === 'none') farmWhere.push("(f.partner_id IS NULL OR f.partner_id = '')");
    else if (partnerId && partnerId !== 'all') { farmWhere.push('f.partner_id = ?'); farmParams.push(partnerId); }
    const farmWhereSql = farmWhere.length ? ` WHERE ${farmWhere.join(' AND ')}` : '';

    if (type === 'members') {
      sheetName = 'MEMBERS';
      const users = queryAll<any>(
        db,
        `SELECT u.id, u.phone, u.email, u.full_name, u.role, u.status, f.farm_code, f.province, f.regency, f.district, f.village, p.partner_code, p.name AS partner_name, u.created_at
         FROM users u
         LEFT JOIN farms f ON u.id = f.owner_user_id
         LEFT JOIN partners p ON f.partner_id = p.id
         ${farmWhereSql}
         ORDER BY u.created_at DESC`, farmParams
      );
      rows = users.map((u) => ({
        'User ID': u.id,
        'Nomor WhatsApp': u.phone,
        'Email': u.email || '-',
        'Nama Lengkap': u.full_name,
        'Peran (Role)': u.role,
        'Status Akun': u.status,
        'Kode Kandang': u.farm_code || '-',
        'Provinsi': u.province || '-', 'Kabupaten/Kota': u.regency || '-', 'Kecamatan': u.district || '-', 'Desa/Kelurahan': u.village || '-',
        'Kode Mitra Pendamping': u.partner_code || '-', 'Mitra Pendamping': u.partner_name || '-',
        'Tanggal Registrasi': u.created_at,
      }));
    } else if (type === 'farms') {
      sheetName = 'FARMS';
      const farms = queryAll<any>(
        db,
        `SELECT f.*, u.email as owner_email, p.partner_code, p.name AS partner_name, p.phone AS partner_phone
         FROM farms f
         LEFT JOIN users u ON f.owner_user_id = u.id
         LEFT JOIN partners p ON f.partner_id = p.id
         ${farmWhereSql}
         ORDER BY f.created_at DESC`, farmParams
      );
      rows = farms.map((f) => ({
        'Farm ID': f.farm_code,
        'Nama Pemilik': f.owner_name,
        'Nomor WhatsApp': f.phone,
        'Email Pemilik': f.owner_email || '-',
        'Provinsi': f.province || '-',
        'Kabupaten/Kota': f.regency || f.location || '-',
        'Kecamatan': f.district || '-',
        'Desa/Kelurahan': f.village || '-',
        'Lokasi Ringkas': f.location,
        'Kode Mitra Pendamping': f.partner_code || '-',
        'Mitra Pendamping': f.partner_name || '-',
        'WA Mitra Pendamping': f.partner_phone || '-', 
        'Tanggal Beli': f.purchase_date || '-',
        'Alamat Lengkap': f.full_address || '-',
        'Latitude': f.latitude ?? '',
        'Longitude': f.longitude ?? '',
        'Google Maps': f.latitude != null && f.longitude != null
          ? `https://www.google.com/maps?q=${f.latitude},${f.longitude}`
          : '-',
        'Ayam Aktif (Ekor)': f.active_chickens,
        'Populasi Awal': f.initial_chickens,
        'Ras Ayam': f.chicken_breed,
        'Umur Sekarang (Minggu)': f.current_age_weeks,
        'Batas Garansi': f.warranty_end,
        'Status Kandang': f.status,
        'Tanggal Aktivasi': f.activation_date,
      }));
    } else if (type === 'chickens') {
      sheetName = 'CHICKENS';
      const farms = queryAll<any>(db, `SELECT * FROM farms ORDER BY farm_code ASC`);
      rows = farms.map((f) => ({
        'Farm ID': f.farm_code,
        'Nama Pemilik': f.owner_name,
        'Ras Ayam': f.chicken_breed,
        'Jumlah Ayam Hidup': f.active_chickens,
        'Jumlah Populasi Awal': f.initial_chickens,
        'Mortalitas (Ekor)': f.initial_chickens - f.active_chickens,
        'Umur Awal': `${f.initial_age_weeks} Minggu`,
        'Umur Sekarang': `${f.current_age_weeks} Minggu`,
        'Batas Garansi Kemitraan': f.warranty_end,
        'Status Kesehatan': f.status === 'critical' ? 'Kritis' : f.status === 'warning' ? 'Perhatian' : 'Optimal',
      }));
    } else if (type === 'reports') {
      sheetName = 'REPORTS';
      const reports = queryAll<any>(
        db,
        `SELECT r.*, f.farm_code, f.owner_name
         FROM daily_reports r
         JOIN farms f ON r.farm_id = f.id
         ORDER BY r.report_date DESC`
      );
      rows = reports.map((r) => ({
        'Tanggal Laporan': r.report_date,
        'Farm ID': r.farm_code,
        'Nama Peternak': r.owner_name,
        'Jumlah Telur (Butir)': r.egg_count,
        'Pakan Harian (Kg)': r.feed_kg,
        'Tingkat Produktivitas (%)': `${r.productivity_rate}%`,
        'Kondisi Ternak': r.chicken_condition === 'healthy' ? 'Sehat' : 'Ada Kendala',
        'Jenis Kendala': r.issue_types ? JSON.parse(r.issue_types || '[]').join(', ') : '-',
        'Catatan Peternak': r.notes || '-',
        'Waktu Rekam Sistem': r.created_at,
      }));
    } else if (type === 'scores') {
      sheetName = 'SCORES';
      const farms = queryAll<any>(db, `SELECT * FROM farms ORDER BY farm_code ASC`);
      rows = farms.map((f) => {
        const farmReports = queryAll<any>(db, `SELECT egg_count, productivity_rate FROM daily_reports WHERE farm_id = ?`, [f.id]);
        const totalEggs = farmReports.reduce((acc, r) => acc + r.egg_count, 0);
        const avgProd = farmReports.length > 0
          ? Math.round(farmReports.reduce((acc, r) => acc + r.productivity_rate, 0) / farmReports.length)
          : 0;
        const grade = avgProd >= 85 ? 'A (Unggul)' : avgProd >= 70 ? 'B (Baik)' : 'C (Perlu Pendampingan)';
        return {
          'Farm ID': f.farm_code,
          'Nama Peternak': f.owner_name,
          'Total Laporan Terisi': farmReports.length,
          'Total Panen Telur (Butir)': totalEggs,
          'Rata-rata Produktivitas (%)': `${avgProd}%`,
          'Grade Performa': grade,
          'Garansi Berlaku': f.warranty_end,
          'Status Operasional': f.status,
        };
      });
    } else if (type === 'tickets') {
      sheetName = 'TICKETS';
      const tickets = queryAll<any>(
        db,
        `SELECT t.*, f.farm_code
         FROM support_tickets t
         JOIN farms f ON t.farm_id = f.id
         ORDER BY t.created_at DESC`
      );
      rows = tickets.map((t) => ({
        'Kode Tiket': t.ticket_code,
        'Farm ID': t.farm_code,
        'Nama Peternak': t.owner_name,
        'Kategori Konsultasi': t.category,
        'Judul Kendala': t.title || '-',
        'Deskripsi': t.description,
        'Status Tiket': t.status,
        'Catatan Respon Ahli': t.admin_notes || '-',
        'Waktu Diajukan': t.created_at,
      }));
    } else {
      return res.status(400).json({ success: false, message: `Tipe export '${type}' tidak didukung.` });
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Keterangan': 'Tidak ada data tercatat.' }]);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Log export audit
    const now = new Date().toISOString();
    runSql(
      db,
      `INSERT INTO admin_logs (id, admin_user_id, admin_name, action, details, timestamp)
       VALUES (?, ?, ?, 'EXPORT_DATA', ?, ?)`,
      [`log-${Date.now()}`, req.user!.id, req.user!.fullName || 'Administrator Eggnest', `Mengunduh file Excel kategori: ${type.toUpperCase()}`, now]
    );

    res.setHeader('Content-Disposition', `attachment; filename="Eggnest-Export-${type.toUpperCase()}-${Date.now()}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err: any) {
    console.error('Export Excel error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengexport file Excel.' });
  }
});

// ==========================================
// IMPORT EXCEL / CSV ENDPOINTS
// ==========================================
router.post('/admin/import/validate', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { type, rows } = req.body;
    if (!type || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Data baris Excel kosong atau format tidak valid.' });
    }

    const db = await getDb();
    const validRows: any[] = [];
    const errors: { row: number; reason: string }[] = [];

    const existingUsers = queryAll<any>(db, `SELECT phone, email FROM users`);
    const existingFarms = queryAll<any>(db, `SELECT id, farm_code FROM farms`);
    const phoneSet = new Set(existingUsers.map((u) => u.phone));
    const emailSet = new Set(existingUsers.filter((u) => u.email).map((u) => u.email.toLowerCase()));
    const farmCodeMap = new Map(existingFarms.map((f) => [f.farm_code.toUpperCase(), f.id]));

    rows.forEach((row: any, idx: number) => {
      const rowNum = idx + 2; // considering header as row 1
      if (type === 'members') {
        const phone = (row['phone'] || row['Nomor WhatsApp'] || row['Nomor HP'] || '').toString().trim();
        const fullName = (row['fullName'] || row['full_name'] || row['Nama Lengkap'] || row['Nama'] || '').toString().trim();
        const email = (row['email'] || row['Email'] || '').toString().trim();
        const farmCode = (row['farmCode'] || row['farm_code'] || row['Kode Kandang'] || '').toString().trim().toUpperCase();

        if (!phone) {
          errors.push({ row: rowNum, reason: 'Nomor telepon/WhatsApp wajib diisi.' });
          return;
        }
        if (!fullName) {
          errors.push({ row: rowNum, reason: 'Nama lengkap wajib diisi.' });
          return;
        }
        if (phoneSet.has(phone)) {
          errors.push({ row: rowNum, reason: `Nomor telepon ${phone} sudah terdaftar di database.` });
          return;
        }
        if (email && emailSet.has(email.toLowerCase())) {
          errors.push({ row: rowNum, reason: `Email ${email} sudah digunakan akun lain.` });
          return;
        }
        validRows.push({
          phone,
          fullName,
          email: email || null,
          role: row['role'] || row['Peran'] || 'member',
          farmCode: farmCode || null,
        });
      } else if (type === 'farms') {
        const farmCode = (row['farmCode'] || row['farm_code'] || row['Farm ID'] || row['Kode Kandang'] || '').toString().trim().toUpperCase();
        const ownerName = (row['ownerName'] || row['owner_name'] || row['Nama Pemilik'] || '').toString().trim();
        const phone = (row['phone'] || row['Nomor WhatsApp'] || '').toString().trim();
        const location = (row['location'] || row['Lokasi'] || '').toString().trim();
        const chickens = parseInt(row['activeChickens'] || row['active_chickens'] || row['Jumlah Ayam'] || '12', 10);

        if (!farmCode) {
          errors.push({ row: rowNum, reason: 'Kode kandang (Farm ID) wajib diisi.' });
          return;
        }
        if (farmCodeMap.has(farmCode)) {
          errors.push({ row: rowNum, reason: `Kode kandang ${farmCode} sudah ada di database.` });
          return;
        }
        if (!ownerName) {
          errors.push({ row: rowNum, reason: 'Nama pemilik kandang wajib diisi.' });
          return;
        }
        if (!phone) {
          errors.push({ row: rowNum, reason: 'Nomor telepon pemilik wajib diisi.' });
          return;
        }
        validRows.push({
          farmCode,
          ownerName,
          phone,
          location: location || 'Jawa Barat',
          activeChickens: isNaN(chickens) ? 12 : chickens,
          breed: row['chickenBreed'] || row['Ras Ayam'] || 'Isa Brown Layer Super',
        });
      } else if (type === 'chickens') {
        const farmCode = (row['farmCode'] || row['farm_code'] || row['Farm ID'] || '').toString().trim().toUpperCase();
        const chickens = parseInt(row['activeChickens'] || row['Jumlah Ayam'] || row['Ayam Aktif'] || '0', 10);

        if (!farmCodeMap.has(farmCode)) {
          errors.push({ row: rowNum, reason: `Kode kandang ${farmCode} tidak ditemukan di sistem.` });
          return;
        }
        if (isNaN(chickens) || chickens < 0) {
          errors.push({ row: rowNum, reason: 'Jumlah ayam harus berupa angka valid (>= 0).' });
          return;
        }
        validRows.push({
          farmId: farmCodeMap.get(farmCode),
          farmCode,
          activeChickens: chickens,
        });
      } else if (type === 'reports') {
        const farmCode = (row['farmCode'] || row['farm_code'] || row['Farm ID'] || '').toString().trim().toUpperCase();
        const reportDate = (row['reportDate'] || row['report_date'] || row['Tanggal'] || '').toString().trim();
        const eggCount = parseInt(row['eggCount'] || row['egg_count'] || row['Jumlah Telur'] || '0', 10);
        const feedKg = parseFloat(row['feedKg'] || row['feed_kg'] || row['Pakan (Kg)'] || '0.0');

        if (!farmCodeMap.has(farmCode)) {
          errors.push({ row: rowNum, reason: `Kode kandang ${farmCode} tidak ditemukan di sistem.` });
          return;
        }
        if (!reportDate || !/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
          errors.push({ row: rowNum, reason: 'Tanggal laporan harus berformat YYYY-MM-DD.' });
          return;
        }
        if (isNaN(eggCount) || eggCount < 0) {
          errors.push({ row: rowNum, reason: 'Jumlah butir telur harus angka valid (>= 0).' });
          return;
        }
        validRows.push({
          farmId: farmCodeMap.get(farmCode),
          farmCode,
          reportDate,
          eggCount,
          feedKg: isNaN(feedKg) ? 0 : feedKg,
          chickenCondition: row['condition'] || row['Kondisi'] || 'healthy',
          notes: row['notes'] || row['Catatan'] || null,
        });
      }
    });

    res.json({
      success: true,
      totalRows: rows.length,
      validCount: validRows.length,
      invalidCount: errors.length,
      preview: validRows.slice(0, 8),
      errors,
    });
  } catch (err: any) {
    console.error('Import validation error:', err);
    res.status(500).json({ success: false, message: 'Gagal memvalidasi data Excel.' });
  }
});

router.post('/admin/import/commit', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { type, validRows } = req.body;
    if (!type || !Array.isArray(validRows) || validRows.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada baris valid untuk diimpor.' });
    }

    const db = await getDb();
    const now = new Date().toISOString();
    let inserted = 0;
    const failed: any[] = [];

    const defaultMemberPasswordHash = bcrypt.hashSync('MitraEggnest2026!', 10);

    for (const item of validRows) {
      try {
        if (type === 'members') {
          const userId = `usr-${Date.now()}-${Math.round(Math.random() * 10000)}`;
          runSql(
            db,
            `INSERT INTO users (id, phone, email, full_name, password_hash, role, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
            [userId, item.phone, item.email, item.fullName, defaultMemberPasswordHash, item.role || 'member', now, now]
          );
          // If farmCode specified and exists, link farm
          if (item.farmCode) {
            runSql(db, `UPDATE farms SET owner_user_id = ?, updated_at = ? WHERE UPPER(farm_code) = ?`, [userId, now, item.farmCode]);
          }
          inserted++;
        } else if (type === 'farms') {
          const farmId = `farm-${Date.now()}-${Math.round(Math.random() * 10000)}`;
          const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          runSql(
            db,
            `INSERT INTO farms (id, farm_code, owner_name, phone, location, activation_date, initial_chickens, active_chickens, chicken_breed, warranty_end, status, photo_url, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
            [
              farmId,
              item.farmCode,
              item.ownerName,
              item.phone,
              item.location,
              now.split('T')[0],
              item.activeChickens || 12,
              item.activeChickens || 12,
              item.breed || 'Isa Brown Layer Super',
              oneYearLater,
              'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80',
              now,
              now,
            ]
          );
          inserted++;
        } else if (type === 'chickens') {
          runSql(db, `UPDATE farms SET active_chickens = ?, updated_at = ? WHERE id = ?`, [item.activeChickens, now, item.farmId]);
          inserted++;
        } else if (type === 'reports') {
          const reportId = `rep-${Date.now()}-${Math.round(Math.random() * 10000)}`;
          const prodRate = Math.round((item.eggCount / 12) * 100);
          runSql(
            db,
            `INSERT INTO daily_reports (id, farm_id, report_date, egg_count, feed_kg, chicken_condition, productivity_rate, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(farm_id, report_date) DO UPDATE SET
               egg_count = excluded.egg_count,
               feed_kg = excluded.feed_kg,
               chicken_condition = excluded.chicken_condition,
               productivity_rate = excluded.productivity_rate,
               notes = excluded.notes,
               updated_at = excluded.updated_at`,
            [reportId, item.farmId, item.reportDate, item.eggCount, item.feedKg, item.chickenCondition || 'healthy', prodRate, item.notes, now, now]
          );
          inserted++;
        }
      } catch (err: any) {
        failed.push({ item, reason: err.message });
      }
    }

    // Audit log
    runSql(
      db,
      `INSERT INTO admin_logs (id, admin_user_id, admin_name, action, details, timestamp)
       VALUES (?, ?, ?, 'IMPORT_DATA', ?, ?)`,
      [
        `log-${Date.now()}`,
        req.user!.id,
        req.user!.fullName || 'Administrator Eggnest',
        `Import ${type.toUpperCase()}: Berhasil ${inserted} data, Gagal ${failed.length} data`,
        now,
      ]
    );

    res.json({
      success: true,
      importedCount: inserted,
      failedCount: failed.length,
      errors: failed,
      message: `Berhasil mengimpor ${inserted} baris data ke database.`,
    });
  } catch (err: any) {
    console.error('Import commit error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengeksekusi import data ke database.' });
  }
});

// ==========================================
// 7. SETTINGS & SMART ALERTS
// ==========================================

router.get('/settings', async (_req, res) => {
  try {
    const db = await getDb();
    const rows = queryAll<{ key: string; value: string }>(db, `SELECT key, value FROM system_settings`);
    const settings: Record<string, any> = {};
    rows.forEach((r) => {
      try {
        settings[r.key] = JSON.parse(r.value);
      } catch {
        settings[r.key] = r.value;
      }
    });
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memuat pengaturan.' });
  }
});

router.put('/admin/settings', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const newSettings = req.body;
    const db = await getDb();
    const now = new Date().toISOString();

    for (const [k, v] of Object.entries(newSettings)) {
      runSql(
        db,
        `INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        [k, JSON.stringify(v), now]
      );
    }

    // Re-evaluate alert engine with new thresholds
    evaluateSmartAlerts(db);

    // Audit log
    runSql(
      db,
      `INSERT INTO admin_logs (id, admin_user_id, admin_name, action, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`log-${Date.now()}`, req.user!.id, 'Administrator Eggnest', 'UPDATE_SETTINGS', `Memperbarui konfigurasi sistem`, now]
    );

    res.json({ success: true, message: 'Pengaturan sistem berhasil disimpan ke database.' });
  } catch (err: any) {
    console.error('Error updating settings:', err);
    res.status(500).json({ success: false, message: 'Gagal menyimpan pengaturan.' });
  }
});

router.get('/admin/alerts', requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const db = await getDb();
    evaluateSmartAlerts(db);
    const alerts = queryAll<any>(db, `SELECT * FROM alerts ORDER BY resolved ASC, created_at DESC`);
    res.json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memuat alerts.' });
  }
});

router.patch('/admin/alerts/:id/resolve', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const alertId = req.params.id;
    const db = await getDb();
    const now = new Date().toISOString();
    runSql(db, `UPDATE alerts SET resolved = 1, status = 'resolved', resolved_at = ? WHERE id = ?`, [now, alertId]);
    res.json({ success: true, message: 'Alert ditandai selesai.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menyelesaikan alert.' });
  }
});

// ==========================================
// 8. ADMIN IMPERSONATION & AUDIT LOGS
// ==========================================

router.post('/admin/impersonate', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { farmId } = req.body;
    const db = await getDb();

    const targetFarm = queryOne<any>(db, `SELECT * FROM farms WHERE id = ?`, [farmId]);
    if (!targetFarm) {
      return res.status(404).json({ success: false, message: 'Kandang tidak ditemukan.' });
    }

    if (!targetFarm.owner_user_id) {
      return res.status(400).json({ success: false, message: `Kandang ${targetFarm.farm_code} belum diklaim oleh peternak.` });
    }

    const targetUser = queryOne<any>(db, `SELECT id, phone, email, full_name, role, status, farm_id FROM users WHERE id = ?`, [targetFarm.owner_user_id]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User peternak tidak ditemukan.' });
    }

    const now = new Date().toISOString();

    // Log impersonation to audit table
    runSql(
      db,
      `INSERT INTO admin_logs (id, admin_user_id, admin_name, target_user_id, action, details, timestamp)
       VALUES (?, ?, ?, ?, 'IMPERSONATE_START', ?, ?)`,
      [
        `log-${Date.now()}`,
        req.user!.id,
        'Administrator Eggnest',
        targetUser.id,
        `Admin masuk sebagai member ${targetUser.full_name} (${targetFarm.farm_code})`,
        now,
      ]
    );

    // Issue temporary member session token
    const impersonateToken = jwt.sign(
      { id: targetUser.id, role: 'member', phone: targetUser.phone, farmId: targetFarm.id, impersonatedBy: req.user!.id },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      success: true,
      message: `Beralih ke mode tampilan ${targetFarm.farm_code} (${targetUser.full_name}).`,
      token: impersonateToken,
      user: targetUser,
      farm: targetFarm,
    });
  } catch (err: any) {
    console.error('Error during impersonation:', err);
    res.status(500).json({ success: false, message: 'Gagal melakukan impersonasi kandang.' });
  }
});

router.get('/admin/logs', requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const logs = queryAll<any>(db, `SELECT * FROM admin_logs ORDER BY timestamp DESC LIMIT 100`);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memuat log audit.' });
  }
});

// ==========================================
// ACADEMY MEDIA UPLOAD
// ==========================================
router.post(
  '/admin/academy/upload',
  requireAdmin,
  academyUpload.single('file'),
  (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'File Academy tidak ditemukan.' });
      }

      const kind = String(req.body?.kind || '');
      const isVideo = ['video/mp4', 'video/webm', 'video/quicktime'].includes(req.file.mimetype);
      const isImage = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(req.file.mimetype);

      if ((kind === 'video' && !isVideo) || (kind === 'thumbnail' && !isImage)) {
        try { fs.unlinkSync(req.file.path); } catch {}
        return res.status(400).json({ success: false, message: 'Jenis file tidak sesuai dengan tipe upload.' });
      }

      const publicUrl = `/uploads/academy/${req.file.filename}`;
      return res.json({
        success: true,
        url: publicUrl,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (err: any) {
      console.error('Academy upload error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Gagal mengupload media Academy.',
      });
    }
  }
);


// ==========================================
// 4C. PENJUALAN TELUR MEMBER
// ==========================================
router.get('/sales', requireAuth, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    ensureEggSalesTable(db);
    ensureFarmerProfileColumns(db);

    const month = String(req.query.month || '').trim();
    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'Format bulan harus YYYY-MM.' });
    }

    let whereSql = '1=1';
    let params: any[] = [];

    if (req.user?.role === 'member') {
      if (!req.user.farmId) {
        return res.status(400).json({ success: false, message: 'Farm ID belum terhubung ke akun Member.' });
      }
      whereSql = 'es.farm_id=?';
      params = [req.user.farmId];
    } else if (req.user?.role === 'mitra') {
      ensurePartnerAccountTable(db);
      const account = queryOne<any>(db, `SELECT partner_id FROM partner_accounts WHERE id=?`, [req.user.id]);
      if (!account?.partner_id) {
        return res.status(403).json({ success: false, message: 'Akun Mitra belum terhubung.' });
      }
      const requestedFarmId = String(req.query.farmId || '').trim();
      whereSql = requestedFarmId ? 'f.partner_id=? AND es.farm_id=?' : 'f.partner_id=?';
      params = requestedFarmId ? [account.partner_id, requestedFarmId] : [account.partner_id];
    } else if (req.user?.role === 'admin') {
      const requestedFarmId = String(req.query.farmId || '').trim();
      if (requestedFarmId) {
        whereSql = 'es.farm_id=?';
        params = [requestedFarmId];
      }
    } else {
      return res.status(403).json({ success: false, message: 'Akses tidak diizinkan.' });
    }

    const monthClause = month ? ` AND substr(es.sale_date,1,7)=?` : '';
    const rows = queryAll<any>(
      db,
      `SELECT es.*, f.farm_code, f.owner_name
       FROM egg_sales es
       JOIN farms f ON f.id=es.farm_id
       WHERE ${whereSql}${monthClause}
       ORDER BY es.sale_date DESC, es.created_at DESC`,
      month ? [...params, month] : params
    );

    const summary = buildSalesSummary(db, whereSql, params, month || undefined);
    return res.json({ success: true, sales: rows.map(mapEggSaleRow), summary });
  } catch (err) {
    console.error('GET SALES ERROR:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat data penjualan telur.' });
  }
});

router.post('/sales', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'member' && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Penjualan telur dicatat oleh Member atau dikoreksi Admin.' });
    }

    const db = await getDb();
    ensureEggSalesTable(db);

    const b = req.body || {};
    const farmId = req.user.role === 'member' ? String(req.user.farmId || '') : String(b.farmId || '');
    if (!farmId) return res.status(400).json({ success: false, message: 'Farm ID wajib tersedia.' });

    const farm = queryOne<any>(db, `SELECT id, farm_code, owner_name FROM farms WHERE id=?`, [farmId]);
    if (!farm) return res.status(404).json({ success: false, message: 'Farm ID tidak ditemukan.' });

    const saleDate = String(b.saleDate || '').trim();
    const priceBasis = b.priceBasis === 'egg' ? 'egg' : 'kg';
    const eggCount = Math.floor(Number(b.eggCount || 0));
    const weightKg = b.weightKg === '' || b.weightKg == null ? null : Number(b.weightKg);
    const unitPrice = Number(b.unitPrice || 0);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(saleDate)) {
      return res.status(400).json({ success: false, message: 'Tanggal penjualan tidak valid.' });
    }
    if (!Number.isInteger(eggCount) || eggCount <= 0) {
      return res.status(400).json({ success: false, message: 'Jumlah telur terjual minimal 1 butir.' });
    }
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Harga jual harus lebih dari 0.' });
    }
    if (priceBasis === 'kg' && (!Number.isFinite(weightKg) || Number(weightKg) <= 0)) {
      return res.status(400).json({ success: false, message: 'Berat penjualan wajib diisi untuk penjualan per kg.' });
    }

    const produced = Number(queryOne<any>(db, `SELECT COALESCE(SUM(egg_count),0) AS total FROM daily_reports WHERE farm_id=?`, [farmId])?.total || 0);
    const sold = Number(queryOne<any>(db, `SELECT COALESCE(SUM(egg_count),0) AS total FROM egg_sales WHERE farm_id=?`, [farmId])?.total || 0);
    const available = Math.max(0, produced - sold);
    if (eggCount > available) {
      return res.status(400).json({
        success: false,
        message: `Jumlah telur melebihi stok tercatat. Stok tersedia ${available} butir dari laporan produksi.`,
      });
    }

    const totalAmount = priceBasis === 'kg'
      ? Math.round(Number(weightKg) * unitPrice)
      : Math.round(eggCount * unitPrice);

    const now = new Date().toISOString();
    const id = `sale-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    runSql(
      db,
      `INSERT INTO egg_sales
       (id,farm_id,sale_date,price_basis,egg_count,weight_kg,unit_price,total_amount,buyer_name,notes,created_by_id,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, farmId, saleDate, priceBasis, eggCount,
        priceBasis === 'kg' ? Number(weightKg) : null,
        unitPrice, totalAmount,
        String(b.buyerName || '').trim() || null,
        String(b.notes || '').trim() || null,
        req.user.id, now, now
      ]
    );

    const sale = queryOne<any>(
      db,
      `SELECT es.*, f.farm_code, f.owner_name FROM egg_sales es JOIN farms f ON f.id=es.farm_id WHERE es.id=?`,
      [id]
    );
    const summary = buildSalesSummary(db, 'es.farm_id=?', [farmId]);

    return res.json({
      success: true,
      message: `Penjualan Rp ${totalAmount.toLocaleString('id-ID')} berhasil dicatat.`,
      sale: mapEggSaleRow(sale),
      summary,
    });
  } catch (err) {
    console.error('CREATE SALE ERROR:', err);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan penjualan telur.' });
  }
});

router.put('/sales/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'member' && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Akses tidak diizinkan.' });
    }
    const db = await getDb();
    ensureEggSalesTable(db);
    const old = queryOne<any>(db, `SELECT * FROM egg_sales WHERE id=?`, [req.params.id]);
    if (!old) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    if (req.user.role === 'member' && old.farm_id !== req.user.farmId) {
      return res.status(403).json({ success: false, message: 'Transaksi ini bukan milik Farm ID Anda.' });
    }

    const b = req.body || {};
    const saleDate = String(b.saleDate || old.sale_date);
    const priceBasis = b.priceBasis === 'egg' ? 'egg' : 'kg';
    const eggCount = Math.floor(Number(b.eggCount || 0));
    const weightKg = b.weightKg === '' || b.weightKg == null ? null : Number(b.weightKg);
    const unitPrice = Number(b.unitPrice || 0);
    if (!Number.isInteger(eggCount) || eggCount <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Jumlah telur/harga tidak valid.' });
    }
    if (priceBasis === 'kg' && (!Number.isFinite(weightKg) || Number(weightKg) <= 0)) {
      return res.status(400).json({ success: false, message: 'Berat wajib diisi untuk harga per kg.' });
    }

    const produced = Number(queryOne<any>(db, `SELECT COALESCE(SUM(egg_count),0) AS total FROM daily_reports WHERE farm_id=?`, [old.farm_id])?.total || 0);
    const otherSold = Number(queryOne<any>(db, `SELECT COALESCE(SUM(egg_count),0) AS total FROM egg_sales WHERE farm_id=? AND id<>?`, [old.farm_id, old.id])?.total || 0);
    if (eggCount > Math.max(0, produced - otherSold)) {
      return res.status(400).json({ success: false, message: 'Jumlah telur melebihi stok produksi yang tercatat.' });
    }

    const totalAmount = priceBasis === 'kg'
      ? Math.round(Number(weightKg) * unitPrice)
      : Math.round(eggCount * unitPrice);
    const now = new Date().toISOString();

    runSql(
      db,
      `UPDATE egg_sales SET sale_date=?,price_basis=?,egg_count=?,weight_kg=?,unit_price=?,total_amount=?,buyer_name=?,notes=?,updated_at=? WHERE id=?`,
      [
        saleDate, priceBasis, eggCount, priceBasis === 'kg' ? Number(weightKg) : null,
        unitPrice, totalAmount, String(b.buyerName || '').trim() || null,
        String(b.notes || '').trim() || null, now, old.id
      ]
    );
    const sale = queryOne<any>(
      db,
      `SELECT es.*, f.farm_code, f.owner_name FROM egg_sales es JOIN farms f ON f.id=es.farm_id WHERE es.id=?`,
      [old.id]
    );
    return res.json({ success: true, message: 'Transaksi penjualan diperbarui.', sale: mapEggSaleRow(sale) });
  } catch (err) {
    console.error('UPDATE SALE ERROR:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui transaksi.' });
  }
});

router.delete('/sales/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'member' && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Akses tidak diizinkan.' });
    }
    const db = await getDb();
    ensureEggSalesTable(db);
    const sale = queryOne<any>(db, `SELECT * FROM egg_sales WHERE id=?`, [req.params.id]);
    if (!sale) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    if (req.user.role === 'member' && sale.farm_id !== req.user.farmId) {
      return res.status(403).json({ success: false, message: 'Transaksi ini bukan milik Farm ID Anda.' });
    }
    runSql(db, `DELETE FROM egg_sales WHERE id=?`, [sale.id]);
    return res.json({ success: true, message: 'Transaksi penjualan dihapus.' });
  } catch (err) {
    console.error('DELETE SALE ERROR:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus transaksi.' });
  }
});


// ==========================================
// 9. FILE UPLOAD ENDPOINT
// ==========================================

router.post('/upload', requireAuth, upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File tidak ditemukan dalam permohonan.' });
    }
    const publicUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: publicUrl, filename: req.file.filename, size: req.file.size });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: err.message || 'Gagal mengupload file.' });
  }
});

// ==========================================
// 10. DEMO SEED & CLEAN DATABASE TOGGLES
// ==========================================

router.post('/admin/seed-demo', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    seedDemoData(db);
    const now = new Date().toISOString();
    runSql(
      db,
      `INSERT INTO admin_logs (id, admin_user_id, admin_name, action, details, timestamp)
       VALUES (?, ?, ?, 'SEED_DEMO', 'Memuat ulang data simulasi kandang dan peternak demo', ?)`,
      [`log-${Date.now()}`, req.user!.id, req.user!.fullName || 'Administrator Eggnest', now]
    );
    res.json({ success: true, message: 'Data demo berhasil dimuat ulang ke SQLite database.' });
  } catch (err: any) {
    console.error('Error seeding demo data:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat data demo.' });
  }
});

router.post('/admin/reset-clean', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    resetCleanDatabase(db);
    const now = new Date().toISOString();
    runSql(
      db,
      `INSERT INTO admin_logs (id, admin_user_id, admin_name, action, details, timestamp)
       VALUES (?, ?, ?, 'RESET_CLEAN', 'Mengosongkan seluruh data demo untuk peluncuran produksi bersih', ?)`,
      [`log-${Date.now()}`, req.user!.id, req.user!.fullName || 'Administrator Eggnest', now]
    );
    res.json({ success: true, message: 'Database telah dikosongkan (Clean Empty state aktif).' });
  } catch (err: any) {
    console.error('Error resetting clean database:', err);
    res.status(500).json({ success: false, message: 'Gagal mengosongkan database.' });
  }
});

export default router;
