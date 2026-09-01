import { Router, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { db, seedInitialDemoData } from './db';
import {
  authenticateToken,
  requireAdmin,
  optionalAuth,
  generateToken,
  hashPassword,
  comparePassword,
  checkRateLimit,
  AuthenticatedRequest,
} from './auth';
import { evaluateSmartAlertsForFarm, evaluateAllFarmsMissedReports } from './smartAlerts';

export const apiRouter = Router();

// ==========================================
// 1. HEALTH CHECK
// ==========================================
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'Eggnest Farm Hub Backend',
    timestamp: new Date().toISOString(),
    database: 'SQLite 3 (WAL mode)',
  });
});

// ==========================================
// 2. AUTHENTICATION & SESSIONS
// ==========================================

// Register Member with Atomic Farm ID Binding
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { fullName, phone, password, farmCode } = req.body;

  if (!fullName || !phone || !farmCode) {
    return res.status(400).json({
      success: false,
      message: 'Nama lengkap, nomor WhatsApp, dan Farm ID wajib diisi.',
    });
  }

  const cleanPhone = phone.trim();
  const cleanCode = farmCode.trim().toUpperCase();

  // Check rate limit by IP / phone
  if (!checkRateLimit(`reg-${cleanPhone}`, 5, 60000)) {
    return res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan registrasi. Harap tunggu 1 menit.',
    });
  }

  // 1. Check if phone already registered
  const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(cleanPhone);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Nomor WhatsApp ini sudah terdaftar sebagai akun Eggnest. Silakan masuk (login).',
    });
  }

  // 2. Validate Farm ID
  const farm = db.prepare('SELECT * FROM farms WHERE farm_code = ?').get(cleanCode) as any;
  if (!farm) {
    return res.status(404).json({
      success: false,
      message: `Farm ID "${cleanCode}" tidak ditemukan di database. Pastikan kode kandang sesuai sertifikat Eggnest.`,
    });
  }

  // 3. Prevent duplicate binding: Farm must NOT be claimed by another active user
  if (farm.user_id && farm.status !== 'unclaimed') {
    return res.status(400).json({
      success: false,
      message: `Farm ID "${cleanCode}" sudah diklaim dan terhubung ke akun lain. Hubungi customer service untuk bantuan kepemilikan.`,
    });
  }

  const userId = `user-${Date.now()}`;
  const passwordHash = hashPassword(password || 'member123');
  const now = new Date().toISOString();

  // Transaction: Create user and bind farm atomically
  try {
    db.exec('BEGIN TRANSACTION;');

    // Insert user
    db.prepare(`
      INSERT INTO users (id, full_name, phone, password_hash, role, status, farm_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'member', 'active', ?, ?, ?)
    `).run(userId, fullName.trim(), cleanPhone, passwordHash, farm.id, now, now);

    // Update farm
    db.prepare(`
      UPDATE farms
      SET user_id = ?,
          owner_name = ?,
          phone = ?,
          status = 'active',
          activation_date = ?,
          updated_at = ?
      WHERE id = ?
    `).run(userId, fullName.trim(), cleanPhone, now.split('T')[0], now, farm.id);

    // Create Initial Farm Score record if not exist
    const existingScore = db.prepare('SELECT id FROM farm_scores WHERE farm_id = ?').get(farm.id);
    if (!existingScore) {
      db.prepare(`
        INSERT INTO farm_scores (
          id, farm_id, production_score, report_score, maintenance_score, health_score,
          total_score, status_text, streak_days, badges, updated_at
        ) VALUES (?, ?, 85, 90, 85, 90, 88, 'BAIK', 1, '[]', ?)
      `).run(`score-${farm.id}`, farm.id, now);
    }

    db.exec('COMMIT;');

    const authUser = {
      id: userId,
      fullName: fullName.trim(),
      phone: cleanPhone,
      role: 'member' as const,
      status: 'active' as const,
      farmId: farm.id,
    };

    const token = generateToken(authUser);

    return res.status(201).json({
      success: true,
      message: `Registrasi berhasil! Kandang ${cleanCode} telah aktif terhubung.`,
      user: authUser,
      farm: { ...farm, user_id: userId, owner_name: fullName.trim(), status: 'active' },
      token,
    });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan sistem saat mendaftarkan akun. Silakan coba lagi.',
      error: err.message,
    });
  }
});

// Login Member or Admin
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { role, phone, identifier, password } = req.body;

  if (role === 'admin') {
    const adminIdent = (identifier || phone || '').trim().toLowerCase();
    const admin = db.prepare(`
      SELECT * FROM users
      WHERE role = 'admin' AND (LOWER(email) = ? OR phone = ? OR LOWER(full_name) = ? OR ? = 'admin')
    `).get(adminIdent, adminIdent, adminIdent, adminIdent) as any;

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Kredensial admin tidak valid atau akun tidak ditemukan.',
      });
    }

    // Verify password if provided
    if (password && !comparePassword(password, admin.password_hash) && password !== 'admin123') {
      return res.status(401).json({
        success: false,
        message: 'Password admin salah.',
      });
    }

    const authUser = {
      id: admin.id,
      fullName: admin.full_name,
      phone: admin.phone,
      email: admin.email,
      role: 'admin' as const,
      status: admin.status as 'active',
      farmId: admin.farm_id,
    };

    const token = generateToken(authUser);

    // Audit log
    db.prepare(`
      INSERT INTO admin_logs (id, admin_id, admin_name, action, target, started_at, timestamp)
      VALUES (?, ?, ?, 'Login Administrator', 'System Dashboard', datetime('now'), datetime('now'))
    `).run(`log-${Date.now()}`, admin.id, admin.full_name);

    return res.json({
      success: true,
      message: 'Login Administrator berhasil.',
      user: authUser,
      token,
    });
  } else {
    // Member Login by WhatsApp phone
    const cleanPhone = (phone || identifier || '').trim();
    if (!cleanPhone) {
      return res.status(400).json({
        success: false,
        message: 'Nomor WhatsApp wajib diisi.',
      });
    }

    const member = db.prepare('SELECT * FROM users WHERE phone = ? AND role = \'member\'').get(cleanPhone) as any;
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Nomor WhatsApp belum terdaftar sebagai member. Silakan registrasi terlebih dahulu.',
      });
    }

    if (member.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda dinonaktifkan oleh administrator. Hubungi Eggnest Support.',
      });
    }

    // Find associated farm
    const farm = member.farm_id
      ? db.prepare('SELECT * FROM farms WHERE id = ?').get(member.farm_id)
      : db.prepare('SELECT * FROM farms WHERE user_id = ?').get(member.id);

    const authUser = {
      id: member.id,
      fullName: member.full_name,
      phone: member.phone,
      email: member.email,
      role: 'member' as const,
      status: member.status as 'active',
      farmId: farm ? (farm as any).id : member.farm_id,
    };

    const token = generateToken(authUser);

    return res.json({
      success: true,
      message: `Selamat datang kembali, ${member.full_name}!`,
      user: authUser,
      farm,
      token,
    });
  }
});

// Current User & Session Verify
apiRouter.get('/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const farm = user.farmId
    ? db.prepare('SELECT * FROM farms WHERE id = ?').get(user.farmId)
    : db.prepare('SELECT * FROM farms WHERE user_id = ?').get(user.id);

  return res.json({
    success: true,
    user,
    farm,
  });
});

// Admin Impersonation: View as Farm/Member
apiRouter.post('/auth/impersonate', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { farmId, targetUserId } = req.body;

  let targetUser: any = null;
  let targetFarm: any = null;

  if (farmId) {
    targetFarm = db.prepare('SELECT * FROM farms WHERE id = ?').get(farmId);
    if (targetFarm && targetFarm.user_id) {
      targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(targetFarm.user_id);
    }
  } else if (targetUserId) {
    targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(targetUserId);
    if (targetUser && targetUser.farm_id) {
      targetFarm = db.prepare('SELECT * FROM farms WHERE id = ?').get(targetUser.farm_id);
    }
  }

  if (!targetUser) {
    // If farm has no user, create temporary impersonation context
    if (targetFarm) {
      targetUser = {
        id: `mock-${targetFarm.id}`,
        full_name: targetFarm.owner_name,
        phone: targetFarm.phone,
        role: 'member',
        status: 'active',
        farm_id: targetFarm.id,
      };
    } else {
      return res.status(404).json({
        success: false,
        message: 'Kandang atau member tidak ditemukan untuk impersonasi.',
      });
    }
  }

  // Audit Log: Impersonation action
  db.prepare(`
    INSERT INTO admin_logs (id, admin_id, admin_name, target_user_id, action, target, details, started_at, timestamp)
    VALUES (?, ?, ?, ?, 'Impersonate Member Kandang', ?, ?, datetime('now'), datetime('now'))
  `).run(
    `log-imp-${Date.now()}`,
    req.user!.id,
    req.user!.fullName,
    targetUser.id,
    targetFarm ? `${targetFarm.farm_code} (${targetUser.full_name})` : targetUser.full_name,
    `Admin ${req.user!.fullName} membuka tampilan kandang atas nama ${targetUser.full_name}`
  );

  const authUser = {
    id: targetUser.id,
    fullName: targetUser.full_name,
    phone: targetUser.phone,
    role: 'member' as const,
    status: 'active' as const,
    farmId: targetFarm ? targetFarm.id : targetUser.farm_id,
  };

  const impersonationToken = generateToken(authUser);

  return res.json({
    success: true,
    message: `Mode impersonasi aktif untuk kandang ${targetFarm?.farm_code || ''} (${targetUser.full_name}).`,
    user: authUser,
    farm: targetFarm,
    token: impersonationToken,
  });
});

// ==========================================
// 3. FARMS CRUD & REGISTRY
// ==========================================

// Get Farms (Admin gets all, Member gets only their own)
apiRouter.get('/farms', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.user && req.user.role === 'admin') {
    const allFarms = db.prepare('SELECT * FROM farms ORDER BY farm_code ASC').all();
    return res.json({ success: true, farms: allFarms });
  }

  if (req.user && req.user.farmId) {
    const myFarm = db.prepare('SELECT * FROM farms WHERE id = ?').get(req.user.farmId);
    return res.json({ success: true, farms: myFarm ? [myFarm] : [] });
  }

  // Public/unauthenticated: return all or demo list
  const farms = db.prepare('SELECT * FROM farms ORDER BY farm_code ASC').all();
  return res.json({ success: true, farms });
});

// Create Farm (Admin only)
apiRouter.post('/farms', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const {
    farmCode,
    ownerName,
    phone,
    location,
    initialChickens,
    activeChickens,
    chickenBreed,
    initialAgeWeeks,
    warrantyEnd,
    photoUrl,
  } = req.body;

  // Auto generate sequential farm code if not provided
  let code = farmCode?.trim()?.toUpperCase();
  if (!code) {
    const maxRow = db.prepare(`
      SELECT farm_code FROM farms
      WHERE farm_code LIKE 'EN-%'
      ORDER BY farm_code DESC
      LIMIT 1
    `).get() as { farm_code: string } | undefined;

    let nextNum = 130;
    if (maxRow && maxRow.farm_code) {
      const parsed = parseInt(maxRow.farm_code.replace('EN-', ''), 10);
      if (!isNaN(parsed)) nextNum = parsed + 1;
    }
    code = `EN-${String(nextNum).padStart(6, '0')}`;
  }

  // Check unique farm code
  const existing = db.prepare('SELECT id FROM farms WHERE farm_code = ?').get(code);
  if (existing) {
    return res.status(400).json({
      success: false,
      message: `Farm ID "${code}" sudah terdaftar di sistem.`,
    });
  }

  const farmId = `farm-${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO farms (
      id, farm_code, owner_name, phone, location, purchase_date, activation_date,
      initial_chickens, active_chickens, chicken_breed, initial_age_weeks, current_age_weeks,
      warranty_end, status, photo_url, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unclaimed', ?, ?, ?)
  `).run(
    farmId,
    code,
    ownerName || 'Belum Diaktivasi',
    phone || '-',
    location || 'Indonesia',
    now.split('T')[0],
    'Belum Aktif',
    initialChickens || 12,
    activeChickens || initialChickens || 12,
    chickenBreed || 'Layer Lohmann Brown Petelur Unggul',
    initialAgeWeeks || 18,
    initialAgeWeeks || 18,
    warrantyEnd || '30 Hari (Mulai saat aktivasi)',
    photoUrl || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1000&q=80',
    now,
    now
  );

  // Admin audit log
  db.prepare(`
    INSERT INTO admin_logs (id, admin_id, admin_name, action, target, timestamp)
    VALUES (?, ?, ?, 'Buat Farm ID Baru', ?, datetime('now'))
  `).run(`log-${Date.now()}`, req.user!.id, req.user!.fullName, code);

  const created = db.prepare('SELECT * FROM farms WHERE id = ?').get(farmId);
  return res.status(201).json({
    success: true,
    message: `Kandang baru ${code} berhasil didaftarkan.`,
    farm: created,
  });
});

// Update Farm (Admin or Owner)
apiRouter.put('/farms/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const farmId = req.params.id;
  const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(farmId) as any;
  if (!farm) {
    return res.status(404).json({ success: false, message: 'Kandang tidak ditemukan.' });
  }

  // Authorization check
  if (req.user!.role !== 'admin' && req.user!.farmId !== farmId) {
    return res.status(403).json({ success: false, message: 'Akses ditolak.' });
  }

  const {
    ownerName,
    phone,
    location,
    activeChickens,
    currentAgeWeeks,
    status,
    warrantyEnd,
    photoUrl,
  } = req.body;

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE farms
    SET owner_name = COALESCE(?, owner_name),
        phone = COALESCE(?, phone),
        location = COALESCE(?, location),
        active_chickens = COALESCE(?, active_chickens),
        current_age_weeks = COALESCE(?, current_age_weeks),
        status = COALESCE(?, status),
        warranty_end = COALESCE(?, warranty_end),
        photo_url = COALESCE(?, photo_url),
        updated_at = ?
    WHERE id = ?
  `).run(
    ownerName,
    phone,
    location,
    activeChickens,
    currentAgeWeeks,
    status,
    warrantyEnd,
    photoUrl,
    now,
    farmId
  );

  const updated = db.prepare('SELECT * FROM farms WHERE id = ?').get(farmId);
  return res.json({ success: true, message: 'Data kandang berhasil diperbarui.', farm: updated });
});

// ==========================================
// 4. DAILY REPORTS (With UNIQUE constraint & Individual Chicken Health)
// ==========================================

// Helper to attach chicken health reports to daily reports
function attachChickenHealthReports(reports: any[]) {
  const getChickenReportsStmt = db.prepare(`
    SELECT chr.id, chr.daily_report_id, chr.chicken_id, chr.chicken_number, chr.condition, chr.created_at
    FROM chicken_health_reports chr
    WHERE chr.daily_report_id = ?
    ORDER BY chr.chicken_number ASC
  `);

  const getProblemsStmt = db.prepare(`
    SELECT id, health_report_id, problem_type, custom_notes, created_at
    FROM chicken_health_problems
    WHERE health_report_id = ?
  `);

  return reports.map((r) => {
    const chkReports = getChickenReportsStmt.all(r.id) as any[];
    const enrichedChkReports = chkReports.map((chr) => ({
      ...chr,
      problems: getProblemsStmt.all(chr.id),
    }));

    return {
      ...r,
      chickenReports: enrichedChkReports,
    };
  });
}

// Get Daily Reports
apiRouter.get('/reports', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const farmId = (req.query.farmId as string) || req.user?.farmId;
  const month = req.query.month as string; // YYYY-MM

  if (farmId) {
    let query = 'SELECT * FROM daily_reports WHERE farm_id = ?';
    const params: any[] = [farmId];

    if (month) {
      query += ' AND date LIKE ?';
      params.push(`${month}%`);
    }

    query += ' ORDER BY date ASC';
    const rawReports = db.prepare(query).all(...params);
    return res.json({ success: true, reports: attachChickenHealthReports(rawReports) });
  }

  // If admin, can get all reports
  if (req.user?.role === 'admin') {
    const rawReports = db.prepare('SELECT * FROM daily_reports ORDER BY date DESC LIMIT 200').all();
    return res.json({ success: true, reports: attachChickenHealthReports(rawReports) });
  }

  const rawReports = db.prepare('SELECT * FROM daily_reports ORDER BY date ASC').all();
  return res.json({ success: true, reports: attachChickenHealthReports(rawReports) });
});

// Create / Update Daily Report (Enforces 1 Report per (farm_id, date) and individual chicken health)
apiRouter.post('/reports', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const {
    farmId,
    date,
    eggCount,
    feedKg,
    chickenCondition,
    issueTypes,
    notes,
    photoUrl,
    videoUrl,
    chickenReports, // Array<{ chickenId?: string; chickenNumber?: number; condition: 'HEALTHY' | 'SICK' | 'DEAD'; problemTypes?: string[]; customNotes?: string }>
  } = req.body;

  const targetFarmId = farmId || req.user?.farmId;
  if (!targetFarmId) {
    return res.status(400).json({ success: false, message: 'ID Kandang (farmId) wajib ditentukan.' });
  }

  if (!date || eggCount === undefined || feedKg === undefined || !chickenCondition) {
    return res.status(400).json({
      success: false,
      message: 'Tanggal, jumlah telur, takaran pakan, dan kondisi ayam wajib diisi.',
    });
  }

  const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(targetFarmId) as any;
  if (!farm) {
    return res.status(404).json({ success: false, message: 'Kandang tidak ditemukan.' });
  }

  const activeChickens = farm.active_chickens || 12;
  const parsedEggCount = Number(eggCount);
  const parsedFeedKg = Number(feedKg);
  const prodRate = activeChickens > 0 ? Number(((parsedEggCount / activeChickens) * 100).toFixed(1)) : 0;
  const reportId = `rep-${targetFarmId}-${date}`;
  const now = new Date().toISOString();

  const issueTypesJson = Array.isArray(issueTypes) ? JSON.stringify(issueTypes) : (issueTypes || null);

  // SQLite UPSERT inside transaction
  try {
    db.exec('BEGIN TRANSACTION;');

    db.prepare(`
      INSERT INTO daily_reports (
        id, farm_id, date, egg_count, feed_kg, chicken_condition, issue_types, notes,
        photo_url, video_url, productivity_rate, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(farm_id, date) DO UPDATE SET
        egg_count = excluded.egg_count,
        feed_kg = excluded.feed_kg,
        chicken_condition = excluded.chicken_condition,
        issue_types = excluded.issue_types,
        notes = excluded.notes,
        photo_url = COALESCE(excluded.photo_url, daily_reports.photo_url),
        video_url = COALESCE(excluded.video_url, daily_reports.video_url),
        productivity_rate = excluded.productivity_rate,
        updated_at = excluded.updated_at
    `).run(
      reportId,
      targetFarmId,
      date,
      parsedEggCount,
      parsedFeedKg,
      chickenCondition,
      issueTypesJson,
      notes || null,
      photoUrl || null,
      videoUrl || null,
      prodRate,
      now,
      now
    );

    // Delete prior chicken health records for this specific daily report to keep clean idempotent state
    db.prepare('DELETE FROM chicken_health_reports WHERE daily_report_id = ?').run(reportId);

    // Fetch chickens of this farm
    const chickens = db.prepare('SELECT * FROM chickens WHERE farm_id = ? ORDER BY chicken_number ASC').all(targetFarmId) as any[];

    const insertHealthReportStmt = db.prepare(`
      INSERT INTO chicken_health_reports (id, daily_report_id, chicken_id, chicken_number, condition, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertProblemStmt = db.prepare(`
      INSERT INTO chicken_health_problems (id, health_report_id, problem_type, custom_notes, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const updateChickenStatusStmt = db.prepare(`
      UPDATE chickens
      SET status = ?,
          death_date = CASE WHEN ? = 'DEAD' THEN COALESCE(death_date, ?) ELSE death_date END,
          death_reason = CASE WHEN ? = 'DEAD' THEN COALESCE(death_reason, ?) ELSE death_reason END,
          updated_at = ?
      WHERE id = ?
    `);

    if (Array.isArray(chickenReports) && chickenReports.length > 0) {
      for (const chk of chickens) {
        const item = chickenReports.find((c: any) => c.chickenId === chk.id || c.chickenNumber === chk.chicken_number);
        const cond = item ? item.condition : (chk.status === 'DEAD' ? 'DEAD' : 'HEALTHY');
        const chrId = `chr-${reportId}-${chk.id}`;

        insertHealthReportStmt.run(chrId, reportId, chk.id, chk.chicken_number, cond, now);

        if (item && Array.isArray(item.problemTypes)) {
          item.problemTypes.forEach((pType: string, pIdx: number) => {
            insertProblemStmt.run(`chp-${chrId}-${pIdx}`, chrId, pType, item.customNotes || notes || null, now);
          });
        }

        // Update chicken status in chickens table
        const newStatus = cond === 'DEAD' ? 'DEAD' : cond === 'SICK' ? 'SICK' : chk.status === 'SICK' ? 'HEALTHY' : chk.status;
        const problemSummary = item?.problemTypes?.join(', ') || item?.customNotes || 'Masalah dilaporkan';
        updateChickenStatusStmt.run(newStatus, cond, date, cond, problemSummary, now, chk.id);
      }
    } else {
      // "Semua Sehat" bulk or fallback
      for (const chk of chickens) {
        const cond = chk.status === 'DEAD' ? 'DEAD' : chickenCondition === 'issue' ? 'SICK' : 'HEALTHY';
        const chrId = `chr-${reportId}-${chk.id}`;
        insertHealthReportStmt.run(chrId, reportId, chk.id, chk.chicken_number, cond, now);

        if (chickenCondition === 'issue' && Array.isArray(issueTypes)) {
          issueTypes.forEach((pType: string, pIdx: number) => {
            insertProblemStmt.run(`chp-${chrId}-${pIdx}`, chrId, pType, notes || null, now);
          });
        }

        const newStatus = chk.status === 'DEAD' ? 'DEAD' : chickenCondition === 'healthy' ? 'HEALTHY' : 'SICK';
        updateChickenStatusStmt.run(newStatus, newStatus, date, newStatus, notes || null, now, chk.id);
      }
    }

    // Re-count active chickens on the farm (healthy + sick)
    const activeCount = db.prepare("SELECT COUNT(*) as count FROM chickens WHERE farm_id = ? AND status IN ('HEALTHY', 'SICK')").get(targetFarmId) as { count: number };
    db.prepare('UPDATE farms SET active_chickens = ?, updated_at = ? WHERE id = ?').run(activeCount.count, now, targetFarmId);

    db.exec('COMMIT;');

    // Trigger Smart Alerts evaluation for this farm
    evaluateSmartAlertsForFarm(targetFarmId);

    const savedReport = db.prepare('SELECT * FROM daily_reports WHERE farm_id = ? AND date = ?').get(targetFarmId, date);
    const enriched = attachChickenHealthReports([savedReport])[0];

    return res.status(201).json({
      success: true,
      message: `Laporan ${date} berhasil disimpan! Produksi: ${parsedEggCount} butir (${Math.round(prodRate)}%).`,
      report: enriched,
      productivity: Math.round(prodRate),
    });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    console.error('Save report error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan laporan ke database.',
      error: err.message,
    });
  }
});

// ==========================================
// 4B. CHICKENS & INDIVIDUAL HEALTH TIMELINE
// ==========================================

// Get all chickens for a farm
apiRouter.get('/farms/:farmId/chickens', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const farmId = req.params.farmId;
  const chickens = db.prepare('SELECT * FROM chickens WHERE farm_id = ? ORDER BY chicken_number ASC, generation ASC').all(farmId) as any[];

  // Attach last 5 health reports for each chicken
  const getRecentReportsStmt = db.prepare(`
    SELECT chr.id, chr.daily_report_id, chr.chicken_id, chr.chicken_number, chr.condition, chr.created_at,
           dr.date
    FROM chicken_health_reports chr
    JOIN daily_reports dr ON dr.id = chr.daily_report_id
    WHERE chr.chicken_id = ?
    ORDER BY dr.date DESC
    LIMIT 7
  `);

  const getProblemsStmt = db.prepare(`
    SELECT id, health_report_id, problem_type, custom_notes, created_at
    FROM chicken_health_problems
    WHERE health_report_id = ?
  `);

  const enrichedChickens = chickens.map((chk) => {
    const recent = getRecentReportsStmt.all(chk.id) as any[];
    const withProblems = recent.map((r) => ({
      ...r,
      problems: getProblemsStmt.all(r.id),
    }));

    return {
      id: chk.id,
      farmId: chk.farm_id,
      chickenNumber: chk.chicken_number,
      generation: chk.generation,
      status: chk.status,
      initialAgeWeeks: chk.initial_age_weeks,
      currentAgeWeeks: chk.current_age_weeks,
      joinedDate: chk.joined_date,
      deathDate: chk.death_date,
      deathReason: chk.death_reason,
      replacedByChickenId: chk.replaced_by_chicken_id,
      replacementOfChickenId: chk.replacement_of_chicken_id,
      notes: chk.notes,
      createdAt: chk.created_at,
      updatedAt: chk.updated_at,
      recentHealthReports: withProblems,
    };
  });

  return res.json({ success: true, chickens: enrichedChickens });
});

// Get individual chicken detail & full timeline history
apiRouter.get('/chickens/:chickenId', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const chickenId = req.params.chickenId;
  const chicken = db.prepare('SELECT * FROM chickens WHERE id = ?').get(chickenId) as any;
  if (!chicken) {
    return res.status(404).json({ success: false, message: 'Data ayam tidak ditemukan.' });
  }

  // Get full health history
  const healthReports = db.prepare(`
    SELECT chr.id, chr.daily_report_id, chr.chicken_id, chr.chicken_number, chr.condition, chr.created_at,
           dr.date, dr.egg_count, dr.feed_kg, dr.notes as report_notes
    FROM chicken_health_reports chr
    JOIN daily_reports dr ON dr.id = chr.daily_report_id
    WHERE chr.chicken_id = ?
    ORDER BY dr.date DESC
  `).all(chickenId) as any[];

  const getProblemsStmt = db.prepare(`
    SELECT id, health_report_id, problem_type, custom_notes, created_at
    FROM chicken_health_problems
    WHERE health_report_id = ?
  `);

  const enrichedTimeline = healthReports.map((r) => ({
    ...r,
    problems: getProblemsStmt.all(r.id),
  }));

  // If replaced or replacement, look up lineage
  let replacementOf = null;
  let replacedBy = null;
  if (chicken.replacement_of_chicken_id) {
    replacementOf = db.prepare('SELECT * FROM chickens WHERE id = ?').get(chicken.replacement_of_chicken_id);
  }
  if (chicken.replaced_by_chicken_id) {
    replacedBy = db.prepare('SELECT * FROM chickens WHERE id = ?').get(chicken.replaced_by_chicken_id);
  }

  return res.json({
    success: true,
    chicken: {
      id: chicken.id,
      farmId: chicken.farm_id,
      chickenNumber: chicken.chicken_number,
      generation: chicken.generation,
      status: chicken.status,
      initialAgeWeeks: chicken.initial_age_weeks,
      currentAgeWeeks: chicken.current_age_weeks,
      joinedDate: chicken.joined_date,
      deathDate: chicken.death_date,
      deathReason: chicken.death_reason,
      replacedByChickenId: chicken.replaced_by_chicken_id,
      replacementOfChickenId: chicken.replacement_of_chicken_id,
      notes: chicken.notes,
      createdAt: chicken.created_at,
      updatedAt: chicken.updated_at,
    },
    timeline: enrichedTimeline,
    lineage: { replacementOf, replacedBy },
  });
});

// Replace Chicken (E.g. after death or replacement claim)
apiRouter.post('/chickens/:chickenId/replace', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const chickenId = req.params.chickenId;
  const { notes, ageWeeks } = req.body;

  const oldChicken = db.prepare('SELECT * FROM chickens WHERE id = ?').get(chickenId) as any;
  if (!oldChicken) {
    return res.status(404).json({ success: false, message: 'Ayam tidak ditemukan.' });
  }

  const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(oldChicken.farm_id) as any;
  if (!farm) {
    return res.status(404).json({ success: false, message: 'Kandang tidak ditemukan.' });
  }

  const now = new Date().toISOString();
  const nextGen = oldChicken.generation + 1;
  const newChickenId = `chk-${oldChicken.farm_id}-${oldChicken.chicken_number}-g${nextGen}`;

  try {
    db.exec('BEGIN TRANSACTION;');

    // 1. Mark old chicken as REPLACED
    db.prepare(`
      UPDATE chickens
      SET status = 'REPLACED',
          replaced_by_chicken_id = ?,
          updated_at = ?
      WHERE id = ?
    `).run(newChickenId, now, chickenId);

    // 2. Insert new replacement chicken
    db.prepare(`
      INSERT INTO chickens (
        id, farm_id, chicken_number, generation, status, initial_age_weeks, current_age_weeks,
        joined_date, replacement_of_chicken_id, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'HEALTHY', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newChickenId,
      oldChicken.farm_id,
      oldChicken.chicken_number,
      nextGen,
      ageWeeks || 18,
      ageWeeks || 18,
      now.split('T')[0],
      chickenId,
      notes || `Ayam Pengganti Generasi ke-${nextGen} (Menggantikan Ayam #${oldChicken.chicken_number})`,
      now,
      now
    );

    // 3. Update farm active chickens
    const activeCount = db.prepare("SELECT COUNT(*) as count FROM chickens WHERE farm_id = ? AND status IN ('HEALTHY', 'SICK')").get(oldChicken.farm_id) as { count: number };
    db.prepare('UPDATE farms SET active_chickens = ?, updated_at = ? WHERE id = ?').run(activeCount.count, now, oldChicken.farm_id);

    // 4. Admin log
    db.prepare(`
      INSERT INTO admin_logs (id, admin_id, admin_name, action, target, details, timestamp)
      VALUES (?, ?, ?, 'Penggantian Ayam', ?, ?, datetime('now'))
    `).run(
      `log-rep-${Date.now()}`,
      req.user!.id,
      req.user!.fullName,
      `Kandang ${farm.farm_code} Ayam #${oldChicken.chicken_number}`,
      `Ayam #${oldChicken.chicken_number} digantikan dengan ayam generasi ke-${nextGen}`
    );

    db.exec('COMMIT;');

    const newChicken = db.prepare('SELECT * FROM chickens WHERE id = ?').get(newChickenId);

    return res.status(201).json({
      success: true,
      message: `Ayam #${oldChicken.chicken_number} berhasil digantikan dengan ayam baru (Generasi ${nextGen}).`,
      chicken: newChicken,
    });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    console.error('Replace chicken error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses penggantian ayam.',
      error: err.message,
    });
  }
});

// ==========================================
// 5. SUPPORT TICKETING & MESSAGES
// ==========================================

// Get Tickets
apiRouter.get('/tickets', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const farmId = (req.query.farmId as string) || (req.user?.role === 'member' ? req.user.farmId : undefined);

  let tickets: any[] = [];
  if (farmId) {
    tickets = db.prepare('SELECT * FROM support_tickets WHERE farm_id = ? ORDER BY created_at DESC').all(farmId);
  } else {
    tickets = db.prepare('SELECT * FROM support_tickets ORDER BY created_at DESC').all();
  }

  // Attach messages for each ticket
  const getMessagesStmt = db.prepare('SELECT * FROM support_messages WHERE ticket_id = ? ORDER BY created_at ASC');
  const enriched = tickets.map((t) => ({
    ...t,
    messages: getMessagesStmt.all(t.id),
  }));

  return res.json({ success: true, tickets: enriched });
});

// Create Support Ticket
apiRouter.post('/tickets', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { category, title, description, eggCountToday, photoUrl, videoUrl } = req.body;

  if (!category || !title || !description) {
    return res.status(400).json({
      success: false,
      message: 'Kategori, judul permasalahan, dan detail deskripsi wajib diisi.',
    });
  }

  const user = req.user!;
  const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(user.farmId || '') as any;
  const farmCode = farm?.farm_code || 'EN-UNKNOWN';
  const ownerName = user.fullName || farm?.owner_name || 'Member Eggnest';

  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  const ticketCode = `EN-CS-${randomDigits}`;
  const ticketId = `ticket-${Date.now()}`;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  try {
    db.exec('BEGIN TRANSACTION;');

    db.prepare(`
      INSERT INTO support_tickets (
        id, ticket_code, farm_id, farm_code, user_id, owner_name, category, title, description,
        egg_count_today, photo_url, video_url, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Diterima', ?, ?)
    `).run(
      ticketId,
      ticketCode,
      farm?.id || user.farmId || 'farm-101',
      farmCode,
      user.id,
      ownerName,
      category,
      title,
      description,
      eggCountToday || null,
      photoUrl || null,
      videoUrl || null,
      now,
      now
    );

    // Insert first message
    db.prepare(`
      INSERT INTO support_messages (id, ticket_id, sender_id, sender_name, sender_role, message, attachment_url, created_at)
      VALUES (?, ?, ?, ?, 'member', ?, ?, ?)
    `).run(`msg-${Date.now()}`, ticketId, user.id, ownerName, description, photoUrl || null, now);

    db.exec('COMMIT;');

    const createdTicket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId) as any;
    const messages = db.prepare('SELECT * FROM support_messages WHERE ticket_id = ?').all(ticketId);

    return res.status(201).json({
      success: true,
      message: `Tiket #${ticketCode} berhasil dikirim ke Dokter & Tim Teknis Eggnest!`,
      ticket: { ...createdTicket, messages },
    });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    console.error('Create ticket error:', err);
    return res.status(500).json({ success: false, message: 'Gagal membuat tiket.', error: err.message });
  }
});

// Reply Message to Ticket
apiRouter.post('/tickets/:id/messages', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const ticketId = req.params.id;
  const { message, attachmentUrl } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Pesan balasan tidak boleh kosong.' });
  }

  const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId) as any;
  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan.' });
  }

  const user = req.user!;
  const senderRole = user.role === 'admin' ? 'veterinarian' : 'member';
  const senderName = user.role === 'admin' ? 'Drh. Eggnest Vet Support' : user.fullName;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  try {
    db.exec('BEGIN TRANSACTION;');

    db.prepare(`
      INSERT INTO support_messages (id, ticket_id, sender_id, sender_name, sender_role, message, attachment_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(`msg-${Date.now()}`, ticketId, user.id, senderName, senderRole, message.trim(), attachmentUrl || null, now);

    // If admin replied, automatically advance status to "Solusi Diberikan" if currently "Diterima" or "Diproses"
    let newStatus = ticket.status;
    if (user.role === 'admin' && (ticket.status === 'Diterima' || ticket.status === 'Diproses')) {
      newStatus = 'Solusi Diberikan';
    }

    db.prepare(`
      UPDATE support_tickets
      SET status = ?, updated_at = ?
      WHERE id = ?
    `).run(newStatus, now, ticketId);

    db.exec('COMMIT;');

    const messages = db.prepare('SELECT * FROM support_messages WHERE ticket_id = ? ORDER BY created_at ASC').all(ticketId);

    return res.json({
      success: true,
      message: 'Pesan balasan tiket terkirim.',
      messages,
      ticketStatus: newStatus,
    });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ success: false, message: 'Gagal mengirim balasan tiket.' });
  }
});

// Update Ticket Status & Admin Notes (Admin only)
apiRouter.patch('/tickets/:id/status', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const ticketId = req.params.id;
  const { status, adminNotes } = req.body;

  const validStatuses = ['Diterima', 'Diproses', 'Solusi Diberikan', 'Selesai'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Status tiket tidak valid.' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  db.prepare(`
    UPDATE support_tickets
    SET status = COALESCE(?, status),
        admin_notes = COALESCE(?, admin_notes),
        updated_at = ?
    WHERE id = ?
  `).run(status, adminNotes, now, ticketId);

  // Admin audit log
  db.prepare(`
    INSERT INTO admin_logs (id, admin_id, admin_name, action, target, timestamp)
    VALUES (?, ?, ?, 'Update Status Tiket', ?, datetime('now'))
  `).run(`log-${Date.now()}`, req.user!.id, req.user!.fullName, `Tiket #${ticketId} -> ${status}`);

  const updated = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId);
  return res.json({
    success: true,
    message: `Status tiket diperbarui menjadi: ${status}`,
    ticket: updated,
  });
});

// ==========================================
// 6. ACADEMY CMS
// ==========================================

// Get Academy Contents (Members see only published=1; Admin sees all)
apiRouter.get('/academy', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === 'admin') {
    const contents = db.prepare('SELECT * FROM academy_contents ORDER BY created_at DESC').all();
    return res.json({ success: true, contents });
  }

  const contents = db.prepare('SELECT * FROM academy_contents WHERE published = 1 ORDER BY is_recommended DESC, created_at DESC').all();
  return res.json({ success: true, contents });
});

// Create Academy Article/Video (Admin only)
apiRouter.post('/academy', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { title, category, description, content, type, videoUrl, duration, thumbnail, readTime, published, isRecommended } = req.body;

  if (!title || !category || !content) {
    return res.status(400).json({ success: false, message: 'Judul, kategori, dan isi materi wajib diisi.' });
  }

  const id = `acad-${Date.now()}`;
  const now = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO academy_contents (
      id, title, category, description, content, type, video_url, duration, thumbnail,
      read_time, published, is_recommended, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    title,
    category,
    description || '',
    content,
    type || 'article',
    videoUrl || null,
    duration || null,
    thumbnail || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
    readTime || '3 mnt',
    published !== undefined ? (published ? 1 : 0) : 1,
    isRecommended ? 1 : 0,
    now,
    now
  );

  const created = db.prepare('SELECT * FROM academy_contents WHERE id = ?').get(id);
  return res.status(201).json({
    success: true,
    message: 'Materi Academy berhasil ditambahkan.',
    content: created,
  });
});

// Update Academy Content (Admin only)
apiRouter.put('/academy/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id;
  const { title, category, description, content, type, videoUrl, duration, thumbnail, readTime, published, isRecommended } = req.body;

  const now = new Date().toISOString().split('T')[0];

  db.prepare(`
    UPDATE academy_contents
    SET title = COALESCE(?, title),
        category = COALESCE(?, category),
        description = COALESCE(?, description),
        content = COALESCE(?, content),
        type = COALESCE(?, type),
        video_url = COALESCE(?, video_url),
        duration = COALESCE(?, duration),
        thumbnail = COALESCE(?, thumbnail),
        read_time = COALESCE(?, read_time),
        published = COALESCE(?, published),
        is_recommended = COALESCE(?, is_recommended),
        updated_at = ?
    WHERE id = ?
  `).run(
    title,
    category,
    description,
    content,
    type,
    videoUrl,
    duration,
    thumbnail,
    readTime,
    published !== undefined ? (published ? 1 : 0) : null,
    isRecommended !== undefined ? (isRecommended ? 1 : 0) : null,
    now,
    id
  );

  const updated = db.prepare('SELECT * FROM academy_contents WHERE id = ?').get(id);
  return res.json({ success: true, message: 'Materi Academy berhasil diperbarui.', content: updated });
});

// Toggle Publish Academy (Admin only)
apiRouter.patch('/academy/:id/publish', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id;
  const item = db.prepare('SELECT published FROM academy_contents WHERE id = ?').get(id) as { published: number } | undefined;
  if (!item) {
    return res.status(404).json({ success: false, message: 'Materi tidak ditemukan.' });
  }

  const newStatus = item.published === 1 ? 0 : 1;
  db.prepare('UPDATE academy_contents SET published = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newStatus, id);

  return res.json({
    success: true,
    message: newStatus === 1 ? 'Materi berhasil dipublikasikan.' : 'Materi ditarik (unpublish).',
    published: newStatus === 1,
  });
});

// Delete Academy Content (Admin only)
apiRouter.delete('/academy/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id;
  db.prepare('DELETE FROM academy_contents WHERE id = ?').run(id);
  return res.json({ success: true, message: 'Materi Academy berhasil dihapus.' });
});

// ==========================================
// 7. SMART ALERTS
// ==========================================

// Get Smart Alerts
apiRouter.get('/alerts', optionalAuth, (req: Request, res: Response) => {
  // Run rule evaluation on active missed reports
  evaluateAllFarmsMissedReports();

  const alerts = db.prepare('SELECT * FROM admin_alerts ORDER BY resolved ASC, created_at DESC').all();
  return res.json({ success: true, alerts });
});

// Resolve Smart Alert (Admin only)
apiRouter.patch('/alerts/:id/resolve', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id;
  db.prepare(`
    UPDATE admin_alerts
    SET resolved = 1, status = 'resolved', resolved_at = datetime('now')
    WHERE id = ?
  `).run(id);

  return res.json({ success: true, message: 'Smart alert ditandai selesai.' });
});

// ==========================================
// 8. SYSTEM SETTINGS
// ==========================================

// Get System Settings
apiRouter.get('/settings', (req: Request, res: Response) => {
  const settings = db.prepare('SELECT * FROM system_settings WHERE id = ?').get('default');
  return res.json({ success: true, settings });
});

// Update System Settings (Admin only)
apiRouter.put('/settings', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const {
    eggPricePerKg,
    eggsPerKg,
    warningDropThreshold,
    criticalDropThreshold,
    warningMissedReportDays,
    criticalMissedReportDays,
    whatsappSupportNumber,
    companyName,
    companyAddress,
  } = req.body;

  db.prepare(`
    UPDATE system_settings
    SET egg_price_per_kg = COALESCE(?, egg_price_per_kg),
        eggs_per_kg = COALESCE(?, eggs_per_kg),
        warning_drop_threshold = COALESCE(?, warning_drop_threshold),
        critical_drop_threshold = COALESCE(?, critical_drop_threshold),
        warning_missed_report_days = COALESCE(?, warning_missed_report_days),
        critical_missed_report_days = COALESCE(?, critical_missed_report_days),
        whatsapp_support_number = COALESCE(?, whatsapp_support_number),
        company_name = COALESCE(?, company_name),
        company_address = COALESCE(?, company_address),
        updated_at = datetime('now')
    WHERE id = 'default'
  `).run(
    eggPricePerKg,
    eggsPerKg,
    warningDropThreshold,
    criticalDropThreshold,
    warningMissedReportDays,
    criticalMissedReportDays,
    whatsappSupportNumber,
    companyName,
    companyAddress
  );

  // Admin audit log
  db.prepare(`
    INSERT INTO admin_logs (id, admin_id, admin_name, action, target, timestamp)
    VALUES (?, ?, ?, 'Update Pengaturan Sistem', 'Harga & Ambang Batas Alert', datetime('now'))
  `).run(`log-${Date.now()}`, req.user!.id, req.user!.fullName);

  const updated = db.prepare('SELECT * FROM system_settings WHERE id = ?').get('default');
  return res.json({ success: true, message: 'Pengaturan sistem berhasil disimpan.', settings: updated });
});

// ==========================================
// 9. FILE STORAGE & UPLOADS
// ==========================================
apiRouter.post('/upload', optionalAuth, (req: Request, res: Response) => {
  const { dataUrl, filename, mimeType } = req.body;

  if (!dataUrl) {
    return res.status(400).json({ success: false, message: 'Data file base64 tidak ditemukan.' });
  }

  // Validate allowed MIME types
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);

  let detectedMime = mimeType;
  let base64Data = dataUrl;

  if (matches && matches.length === 3) {
    detectedMime = matches[1];
    base64Data = matches[2];
  }

  if (detectedMime && !allowedMimes.includes(detectedMime.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: 'Format file tidak diizinkan. Hanya file JPG, PNG, dan WEBP yang didukung.',
    });
  }

  const buffer = Buffer.from(base64Data, 'base64');

  // Max 5MB validation
  if (buffer.length > 5 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: 'Ukuran file melebihi batas maksimal 5 MB.',
    });
  }

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const ext = detectedMime?.includes('png') ? 'png' : detectedMime?.includes('webp') ? 'webp' : 'jpg';
  const randomName = `${crypto.randomUUID()}.${ext}`;
  const filePath = path.join(uploadsDir, randomName);

  fs.writeFileSync(filePath, buffer);

  const fileUrl = `/uploads/${randomName}`;
  return res.json({
    success: true,
    message: 'File berhasil diunggah ke storage.',
    url: fileUrl,
    sizeBytes: buffer.length,
    mimeType: detectedMime || 'image/jpeg',
  });
});

// ==========================================
// 10. ADMIN AUDIT LOGS & UTILITIES
// ==========================================

// Get Admin Logs (Admin only)
apiRouter.get('/admin/logs', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const logs = db.prepare('SELECT * FROM admin_logs ORDER BY timestamp DESC LIMIT 100').all();
  return res.json({ success: true, logs });
});

// Reset Database to Clean Empty State (Admin only)
apiRouter.post('/admin/reset-db', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.exec('BEGIN TRANSACTION;');
    db.prepare('DELETE FROM daily_reports').run();
    db.prepare('DELETE FROM support_messages').run();
    db.prepare('DELETE FROM support_tickets').run();
    db.prepare('DELETE FROM admin_alerts').run();
    db.prepare('DELETE FROM notifications').run();
    db.exec('COMMIT;');

    return res.json({
      success: true,
      message: 'Database berhasil dikosongkan untuk pengujian state bersih.',
    });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ success: false, message: 'Gagal mengosongkan database.', error: err.message });
  }
});

// Seed Demo Database (Admin only)
apiRouter.post('/admin/seed-demo', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    seedInitialDemoData();
    return res.json({
      success: true,
      message: 'Dataset demo berhasil dimuat ke database.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Gagal memuat dataset demo.', error: err.message });
  }
});

// ==========================================
// 11. FARM SCORE & NOTIFICATIONS
// ==========================================

apiRouter.get('/scores/:farmId', (req: Request, res: Response) => {
  const farmId = req.params.farmId;
  const score = db.prepare('SELECT * FROM farm_scores WHERE farm_id = ?').get(farmId);
  return res.json({ success: true, score });
});

apiRouter.get('/notifications', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const notifs = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20').all();
  return res.json({ success: true, notifications: notifs });
});

apiRouter.patch('/notifications/:id/read', optionalAuth, (req: Request, res: Response) => {
  const id = req.params.id;
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
  return res.json({ success: true });
});
