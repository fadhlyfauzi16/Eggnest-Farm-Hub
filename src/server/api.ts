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

// Ensure public upload directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueName = `img-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
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
    role: 'member' | 'admin' | 'veterinarian';
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

// ==========================================
// 1. AUTHENTICATION & REGISTRATION ENDPOINTS
// ==========================================

router.post('/auth/register', async (req, res) => {
  try {
    const { fullName, phone, password, farmCode } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp wajib diisi.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter.' });
    }
    if (!farmCode || !farmCode.trim()) {
      return res.status(400).json({ success: false, message: 'Farm ID / Kode Aktivasi wajib diisi.' });
    }

    const cleanCode = farmCode.trim().toUpperCase();
    const cleanPhone = phone.trim();
    const db = await getDb();

    // Check if Farm ID exists
    const farm = queryOne<any>(db, `SELECT * FROM farms WHERE farm_code = ?`, [cleanCode]);
    if (!farm) {
      return res.status(400).json({
        success: false,
        message: `Farm ID "${cleanCode}" tidak ditemukan dalam sistem Eggnest. Silakan periksa kembali kartu garansi Anda.`,
      });
    }

    // Constraint: Check if Farm ID is already claimed
    if (farm.owner_user_id || farm.status !== 'unclaimed') {
      return res.status(400).json({
        success: false,
        message: `Farm ID "${cleanCode}" sudah diklaim dan terhubung dengan akun peternak lain.`,
      });
    }

    // Check if Phone is already registered
    const existingUser = queryOne<any>(db, `SELECT id FROM users WHERE phone = ?`, [cleanPhone]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Nomor WhatsApp ini sudah terdaftar. Silakan login ke akun Anda.',
      });
    }

    // Create user with hashed password
    const newUserId = `user-${Date.now()}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();
    const todayDate = now.split('T')[0];

    runSql(
      db,
      `INSERT INTO users (id, phone, full_name, password_hash, role, status, farm_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'member', 'active', ?, ?, ?)`,
      [newUserId, cleanPhone, fullName.trim(), passwordHash, farm.id, now, now]
    );

    // Bind Farm to user
    runSql(
      db,
      `UPDATE farms SET
        owner_user_id = ?,
        owner_name = ?,
        phone = ?,
        status = 'active',
        activation_date = ?,
        location = CASE WHEN location LIKE '%Belum%' THEN 'Indonesia' ELSE location END,
        updated_at = ?
       WHERE id = ?`,
      [newUserId, fullName.trim(), cleanPhone, todayDate, now, farm.id]
    );

    // Fetch newly created user & updated farm
    const createdUser = queryOne<any>(db, `SELECT id, phone, email, full_name, role, status, farm_id, created_at FROM users WHERE id = ?`, [newUserId]);
    const updatedFarm = queryOne<any>(db, `SELECT * FROM farms WHERE id = ?`, [farm.id]);

    const token = jwt.sign(
      { id: createdUser.id, role: createdUser.role, phone: createdUser.phone, farmId: farm.id },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Log registration
    runSql(
      db,
      `INSERT INTO admin_logs (id, admin_user_id, admin_name, target_user_id, action, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [`log-${Date.now()}`, 'system', 'Sistem Eggnest', newUserId, 'MEMBER_REGISTER', `Member ${fullName} mengklaim Farm ${cleanCode}`, now]
    );

    res.status(201).json({
      success: true,
      message: `Registrasi berhasil! Farm ID ${cleanCode} telah aktif terhubung.`,
      token,
      user: createdUser,
      farm: updatedFarm,
    });
  } catch (err: any) {
    console.error('Error during register:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat registrasi.' });
  }
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
          message: 'Nomor WhatsApp belum terdaftar sebagai peternak Eggnest. Silakan lakukan registrasi.',
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
        farm,
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
    const user = queryOne<any>(
      db,
      `SELECT id, phone, email, full_name, role, status, farm_id, created_at FROM users WHERE id = ?`,
      [req.user!.id]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    let farm = null;
    if (user.farm_id) {
      farm = queryOne<any>(db, `SELECT * FROM farms WHERE id = ?`, [user.farm_id]);
    }

    res.json({ success: true, user, farm });
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

    const activeChickens = farm.active_chickens || 12;
    const todayStr = '2026-08-31';

    // Today's report (or latest)
    const todayReport = reports.find((r) => r.report_date === todayStr) || reports[reports.length - 1];
    const todayEggCount = todayReport ? todayReport.egg_count : 0;
    const todayFeedKg = todayReport ? todayReport.feed_kg : 0;

    // Current month reports (August 2026)
    const monthReports = reports.filter((r) => r.report_date.startsWith('2026-08'));
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

    // Chart data 30 days
    const chartData = reports.slice(-30).map((r) => {
      const day = r.report_date.split('-')[2];
      return {
        day: `${parseInt(day, 10)} Agu`,
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
    const farmId = (req.query.farmId as string) || req.user?.farmId;

    if (!farmId) {
      return res.status(400).json({ success: false, message: 'Farm ID wajib disertakan.' });
    }

    const reports = queryAll<any>(
      db,
      `SELECT * FROM daily_reports WHERE farm_id = ? ORDER BY report_date ASC`,
      [farmId]
    );

    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memuat laporan harian.' });
  }
});

router.post('/reports', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      farmId: reqFarmId,
      date,
      eggCount,
      feedKg,
      chickenCondition = 'healthy',
      issueTypes,
      notes,
      photoUrl,
      videoUrl,
    } = req.body;

    const farmId = reqFarmId || req.user?.farmId;
    if (!farmId) {
      return res.status(400).json({ success: false, message: 'Farm ID tidak ditemukan.' });
    }
    if (!date) {
      return res.status(400).json({ success: false, message: 'Tanggal laporan wajib diisi.' });
    }

    const db = await getDb();
    const farm = queryOne<any>(db, `SELECT * FROM farms WHERE id = ?`, [farmId]);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Kandang tidak ditemukan.' });
    }

    // Load settings for FCR
    const eggsPerKgSetting = queryOne<any>(db, `SELECT value FROM system_settings WHERE key = 'eggsPerKg'`);
    const eggsPerKg = eggsPerKgSetting ? JSON.parse(eggsPerKgSetting.value) : 16;

    const activeChickens = farm.active_chickens || 12;
    const productivityRate = Number(((eggCount / activeChickens) * 100).toFixed(1));
    const eggMassKg = eggCount > 0 ? eggCount / eggsPerKg : 0;
    const fcr = eggMassKg > 0 ? Number((feedKg / eggMassKg).toFixed(2)) : null;

    const now = new Date().toISOString();
    const reportId = `rep-${farmId}-${date}`;
    const issueTypesJson = issueTypes ? JSON.stringify(issueTypes) : null;

    // Guaranteed Unique per (farm_id, report_date) via INSERT OR REPLACE / UPSERT
    runSql(
      db,
      `INSERT INTO daily_reports (
        id, farm_id, report_date, egg_count, feed_kg, chicken_condition, issue_types, notes, photo_url, video_url, productivity_rate, fcr, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(farm_id, report_date) DO UPDATE SET
        egg_count = excluded.egg_count,
        feed_kg = excluded.feed_kg,
        chicken_condition = excluded.chicken_condition,
        issue_types = excluded.issue_types,
        notes = excluded.notes,
        photo_url = excluded.photo_url,
        video_url = excluded.video_url,
        productivity_rate = excluded.productivity_rate,
        fcr = excluded.fcr,
        updated_at = excluded.updated_at`,
      [
        reportId,
        farmId,
        date,
        Number(eggCount),
        Number(feedKg),
        chickenCondition,
        issueTypesJson,
        notes || null,
        photoUrl || null,
        videoUrl || null,
        productivityRate,
        fcr,
        now,
        now,
      ]
    );

    // Trigger Smart Alerts Engine on the fly
    evaluateSmartAlerts(db, farmId);

    res.json({
      success: true,
      message: `Laporan ${date} berhasil disimpan ke database.`,
      productivity: Math.round(productivityRate),
      fcr,
    });
  } catch (err: any) {
    console.error('Error saving daily report:', err);
    res.status(500).json({ success: false, message: 'Gagal menyimpan laporan ke database.' });
  }
});

// ==========================================
// 4. FARMS MANAGEMENT ENDPOINTS
// ==========================================

router.get('/farms', requireAuth, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    if (req.user?.role === 'admin') {
      const farms = queryAll<any>(db, `SELECT * FROM farms ORDER BY created_at DESC`);
      res.json({ success: true, farms });
    } else {
      const farms = queryAll<any>(db, `SELECT * FROM farms WHERE id = ?`, [req.user?.farmId]);
      res.json({ success: true, farms });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memuat data kandang.' });
  }
});

router.post('/admin/farms', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      farmCode,
      ownerName = '',
      phone = '',
      location = 'Paket Belum Diaktivasi (Tersedia)',
      initialChickens = 12,
      chickenBreed = 'Layer Lohmann Brown Petelur Unggul',
      initialAgeWeeks = 18,
    } = req.body;
    const db = await getDb();

    // Farm ID can be supplied by admin or generated automatically.
    let nextCode = '';
    if (farmCode && String(farmCode).trim()) {
      nextCode = String(farmCode).trim().toUpperCase();
      if (!/^EN-\d{6}$/.test(nextCode)) {
        return res.status(400).json({
          success: false,
          message: 'Format Farm ID harus EN- diikuti 6 digit. Contoh: EN-000101.',
        });
      }
      const duplicate = queryOne<any>(db, `SELECT id FROM farms WHERE UPPER(farm_code) = UPPER(?)`, [nextCode]);
      if (duplicate) {
        return res.status(409).json({ success: false, message: `Farm ID ${nextCode} sudah digunakan.` });
      }
    } else {
      const allCodes = queryAll<{ farm_code: string }>(db, `SELECT farm_code FROM farms`);
      const numCodes = allCodes
        .map((c) => parseInt(String(c.farm_code || '').replace('EN-', ''), 10))
        .filter((n) => !isNaN(n));
      const maxNum = numCodes.length > 0 ? Math.max(...numCodes) : 100;
      nextCode = `EN-${String(maxNum + 1).padStart(6, '0')}`;
    }

    const newFarmId = `farm-${Date.now()}`;
    const now = new Date().toISOString();

    runSql(
      db,
      `INSERT INTO farms (
        id, farm_code, owner_user_id, owner_name, phone, location, activation_date, initial_chickens, active_chickens, chicken_breed, initial_age_weeks, current_age_weeks, warranty_end, status, photo_url, created_at, updated_at
      ) VALUES (?, ?, NULL, ?, ?, ?, '', ?, ?, ?, ?, ?, '30 Hari setelah aktivasi', 'unclaimed', 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1000&q=80', ?, ?)`,
      [
        newFarmId,
        nextCode,
        ownerName,
        phone,
        location,
        Number(initialChickens),
        Number(initialChickens),
        chickenBreed,
        Number(initialAgeWeeks),
        Number(initialAgeWeeks),
        now,
        now,
      ]
    );

    // Audit log
    runSql(
      db,
      `INSERT INTO admin_logs (id, admin_user_id, admin_name, action, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`log-${Date.now()}`, req.user!.id, 'Administrator Eggnest', 'CREATE_FARM', `Mendaftarkan Farm ID baru: ${nextCode}`, now]
    );

    const createdFarm = queryOne<any>(db, `SELECT * FROM farms WHERE id = ?`, [newFarmId]);
    res.status(201).json({ success: true, message: `Farm ID ${nextCode} berhasil dibuat.`, farm: createdFarm });
  } catch (err: any) {
    console.error('Error creating farm:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat Farm ID baru.' });
  }
});

router.put('/admin/farms/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const farmId = req.params.id;
    const { ownerName, phone, location, activeChickens, status } = req.body;
    const db = await getDb();
    const now = new Date().toISOString();

    runSql(
      db,
      `UPDATE farms SET
        owner_name = COALESCE(?, owner_name),
        phone = COALESCE(?, phone),
        location = COALESCE(?, location),
        active_chickens = COALESCE(?, active_chickens),
        status = COALESCE(?, status),
        updated_at = ?
       WHERE id = ?`,
      [ownerName, phone, location, activeChickens ? Number(activeChickens) : null, status, now, farmId]
    );

    const updated = queryOne<any>(db, `SELECT * FROM farms WHERE id = ?`, [farmId]);
    res.json({ success: true, message: 'Data kandang berhasil diperbarui.', farm: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui data kandang.' });
  }
});

router.delete('/admin/farms/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const farmId = req.params.id;
    const deleteMember = String(req.query.deleteMember ?? 'true') !== 'false';
    const farm = queryOne<any>(db, `SELECT * FROM farms WHERE id = ?`, [farmId]);

    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm ID tidak ditemukan.' });
    }

    const linkedUserId = farm.owner_user_id || null;
    const now = new Date().toISOString();

    // Remove dependent operational data first.
    runSql(db, `DELETE FROM support_messages WHERE ticket_id IN (SELECT id FROM support_tickets WHERE farm_id = ?)`, [farmId]);
    runSql(db, `DELETE FROM support_tickets WHERE farm_id = ?`, [farmId]);
    runSql(db, `DELETE FROM daily_reports WHERE farm_id = ?`, [farmId]);
    runSql(db, `DELETE FROM alerts WHERE farm_id = ?`, [farmId]);

    // Break circular user/farm references before deletion.
    if (linkedUserId) {
      runSql(db, `UPDATE users SET farm_id = NULL, updated_at = ? WHERE id = ?`, [now, linkedUserId]);
    }
    runSql(db, `UPDATE farms SET owner_user_id = NULL, updated_at = ? WHERE id = ?`, [now, farmId]);

    if (deleteMember && linkedUserId) {
      runSql(db, `DELETE FROM users WHERE id = ? AND role = 'member'`, [linkedUserId]);
    }

    runSql(db, `DELETE FROM farms WHERE id = ?`, [farmId]);

    runSql(
      db,
      `INSERT INTO admin_logs (id, admin_user_id, admin_name, target_user_id, action, details, timestamp)
       VALUES (?, ?, ?, ?, 'DELETE_FARM', ?, ?)`,
      [
        `log-${Date.now()}`,
        req.user!.id,
        req.user!.fullName || 'Administrator Eggnest',
        linkedUserId,
        `Menghapus Farm ID ${farm.farm_code}${deleteMember && linkedUserId ? ' beserta akun member terkait' : ''}`,
        now,
      ]
    );

    return res.json({
      success: true,
      message: `Farm ID ${farm.farm_code} berhasil dihapus${deleteMember && linkedUserId ? ' beserta akun member terkait' : ''}.`,
    });
  } catch (err: any) {
    console.error('Error deleting farm:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus Farm ID.' });
  }
});

// ==========================================
// 5. SUPPORT TICKETING SYSTEM (THREADED & PERSISTED)
// ==========================================

router.get('/tickets', requireAuth, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    let tickets: any[] = [];

    if (req.user?.role === 'admin') {
      tickets = queryAll<any>(db, `SELECT * FROM support_tickets ORDER BY created_at DESC`);
    } else {
      tickets = queryAll<any>(
        db,
        `SELECT * FROM support_tickets WHERE farm_id = ? ORDER BY created_at DESC`,
        [req.user?.farmId]
      );
    }

    // Attach messages thread for each ticket
    const populatedTickets = tickets.map((t) => {
      const messages = queryAll<any>(
        db,
        `SELECT * FROM support_messages WHERE ticket_id = ? ORDER BY created_at ASC`,
        [t.id]
      );
      return { ...t, messages };
    });

    res.json({ success: true, tickets: populatedTickets });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memuat tiket bantuan.' });
  }
});

router.post('/tickets', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { category, title, description, eggCountToday, photoUrl, videoUrl } = req.body;
    const db = await getDb();

    const user = queryOne<any>(db, `SELECT * FROM users WHERE id = ?`, [req.user!.id]);
    const farm = user?.farm_id ? queryOne<any>(db, `SELECT * FROM farms WHERE id = ?`, [user.farm_id]) : null;

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Deskripsi keluhan wajib diisi.' });
    }

    const ticketId = `ticket-${Date.now()}`;
    const randomCode = `EN-CS-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();

    runSql(
      db,
      `INSERT INTO support_tickets (
        id, ticket_code, farm_id, farm_code, user_id, owner_name, category, title, description, egg_count_today, photo_url, video_url, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Diterima', ?, ?)`,
      [
        ticketId,
        randomCode,
        farm?.id || 'farm-001',
        farm?.farm_code || 'EN-000127',
        user?.id,
        user?.full_name || 'Peternak Eggnest',
        category || 'Lainnya',
        title || category,
        description,
        eggCountToday ? Number(eggCountToday) : null,
        photoUrl || null,
        videoUrl || null,
        now,
        now,
      ]
    );

    // Initial message in thread
    const msgId = `msg-${Date.now()}`;
    runSql(
      db,
      `INSERT INTO support_messages (id, ticket_id, sender_id, sender_name, sender_role, message, attachment_url, created_at)
       VALUES (?, ?, ?, ?, 'member', ?, ?, ?)`,
      [msgId, ticketId, user?.id, user?.full_name || 'Peternak', description, photoUrl || null, now]
    );

    const createdTicket = queryOne<any>(db, `SELECT * FROM support_tickets WHERE id = ?`, [ticketId]);
    createdTicket.messages = queryAll<any>(db, `SELECT * FROM support_messages WHERE ticket_id = ?`, [ticketId]);

    res.status(201).json({
      success: true,
      message: `Tiket #${randomCode} berhasil dikirim ke Dokter Hewan & Tim Teknis Eggnest.`,
      ticket: createdTicket,
    });
  } catch (err: any) {
    console.error('Error creating support ticket:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat tiket bantuan.' });
  }
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

    runSql(
      db,
      `UPDATE support_tickets SET
        status = ?,
        admin_notes = COALESCE(?, admin_notes),
        updated_at = ?
       WHERE id = ?`,
      [status, adminNotes || null, now, ticketId]
    );

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
    const { title, category, description, content, type = 'article', videoUrl, duration, thumbnail, readTime } = req.body;

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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`,
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
        now,
        now,
      ]
    );

    const created = queryOne<any>(db, `SELECT * FROM academy_contents WHERE id = ?`, [id]);
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
    let rows: any[] = [];
    let sheetName = 'DATA';

    if (type === 'members') {
      sheetName = 'MEMBERS';
      const users = queryAll<any>(
        db,
        `SELECT u.id, u.phone, u.email, u.full_name, u.role, u.status, f.farm_code, u.created_at
         FROM users u
         LEFT JOIN farms f ON u.id = f.owner_user_id
         ORDER BY u.created_at DESC`
      );
      rows = users.map((u) => ({
        'User ID': u.id,
        'Nomor WhatsApp': u.phone,
        'Email': u.email || '-',
        'Nama Lengkap': u.full_name,
        'Peran (Role)': u.role,
        'Status Akun': u.status,
        'Kode Kandang': u.farm_code || '-',
        'Tanggal Registrasi': u.created_at,
      }));
    } else if (type === 'farms') {
      sheetName = 'FARMS';
      const farms = queryAll<any>(
        db,
        `SELECT f.*, u.email as owner_email
         FROM farms f
         LEFT JOIN users u ON f.owner_user_id = u.id
         ORDER BY f.created_at DESC`
      );
      rows = farms.map((f) => ({
        'Farm ID': f.farm_code,
        'Nama Pemilik': f.owner_name,
        'Nomor WhatsApp': f.phone,
        'Email Pemilik': f.owner_email || '-',
        'Lokasi Kandang': f.location,
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
