import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'data.db');

export const db = new DatabaseSync(DB_PATH);

// Enable SQLite Foreign Key Enforcement & WAL mode for performance & integrity
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export function initDatabase() {
  db.exec(`
    -- USERS TABLE
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('member', 'admin')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      farm_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- FARMS TABLE
    CREATE TABLE IF NOT EXISTS farms (
      id TEXT PRIMARY KEY,
      farm_code TEXT UNIQUE NOT NULL,
      user_id TEXT,
      owner_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      location TEXT NOT NULL,
      purchase_date TEXT,
      activation_date TEXT NOT NULL,
      initial_chickens INTEGER NOT NULL DEFAULT 12,
      active_chickens INTEGER NOT NULL DEFAULT 12,
      chicken_breed TEXT NOT NULL DEFAULT 'Layer Lohmann Brown Petelur Unggul',
      initial_age_weeks INTEGER NOT NULL DEFAULT 18,
      current_age_weeks INTEGER NOT NULL DEFAULT 18,
      warranty_end TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unclaimed' CHECK (status IN ('unclaimed', 'active', 'warning', 'critical', 'inactive', 'completed')),
      photo_url TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- DAILY REPORTS TABLE (With UNIQUE constraint on (farm_id, date) to prevent duplicates)
    CREATE TABLE IF NOT EXISTS daily_reports (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL,
      date TEXT NOT NULL,
      egg_count INTEGER NOT NULL,
      feed_kg REAL NOT NULL,
      chicken_condition TEXT NOT NULL CHECK (chicken_condition IN ('healthy', 'issue')),
      issue_types TEXT,
      notes TEXT,
      photo_url TEXT,
      video_url TEXT,
      productivity_rate REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (farm_id, date),
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
    );

    -- CHICKENS TABLE (Individual Chicken Population)
    CREATE TABLE IF NOT EXISTS chickens (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL,
      chicken_number INTEGER NOT NULL,
      generation INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL CHECK (status IN ('HEALTHY', 'SICK', 'DEAD', 'REPLACED')) DEFAULT 'HEALTHY',
      initial_age_weeks INTEGER NOT NULL DEFAULT 18,
      current_age_weeks INTEGER NOT NULL DEFAULT 22,
      joined_date TEXT NOT NULL,
      death_date TEXT,
      death_reason TEXT,
      replaced_by_chicken_id TEXT,
      replacement_of_chicken_id TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
    );

    -- CHICKEN HEALTH REPORTS TABLE (Recorded per chicken per daily report)
    CREATE TABLE IF NOT EXISTS chicken_health_reports (
      id TEXT PRIMARY KEY,
      daily_report_id TEXT NOT NULL,
      chicken_id TEXT NOT NULL,
      chicken_number INTEGER NOT NULL,
      condition TEXT NOT NULL CHECK (condition IN ('HEALTHY', 'SICK', 'DEAD')),
      created_at TEXT NOT NULL,
      FOREIGN KEY (daily_report_id) REFERENCES daily_reports(id) ON DELETE CASCADE,
      FOREIGN KEY (chicken_id) REFERENCES chickens(id) ON DELETE CASCADE
    );

    -- CHICKEN HEALTH PROBLEMS TABLE (Specific issues linked to a chicken health report)
    CREATE TABLE IF NOT EXISTS chicken_health_problems (
      id TEXT PRIMARY KEY,
      health_report_id TEXT NOT NULL,
      problem_type TEXT NOT NULL,
      custom_notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (health_report_id) REFERENCES chicken_health_reports(id) ON DELETE CASCADE
    );

    -- SUPPORT TICKETS TABLE
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      ticket_code TEXT UNIQUE NOT NULL,
      farm_id TEXT NOT NULL,
      farm_code TEXT NOT NULL,
      user_id TEXT,
      owner_name TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      egg_count_today INTEGER,
      photo_url TEXT,
      video_url TEXT,
      status TEXT NOT NULL DEFAULT 'Diterima' CHECK (status IN ('Diterima', 'Diproses', 'Solusi Diberikan', 'Selesai')),
      admin_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- SUPPORT MESSAGES TABLE (Ticket conversation thread)
    CREATE TABLE IF NOT EXISTS support_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT NOT NULL CHECK (sender_role IN ('member', 'admin', 'veterinarian')),
      message TEXT NOT NULL,
      attachment_url TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
    );

    -- ACADEMY CONTENTS TABLE
    CREATE TABLE IF NOT EXISTS academy_contents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('video', 'article')),
      video_url TEXT,
      duration TEXT,
      thumbnail TEXT NOT NULL,
      read_time TEXT,
      published INTEGER NOT NULL DEFAULT 1,
      is_recommended INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- ADMIN ALERTS TABLE
    CREATE TABLE IF NOT EXISTS admin_alerts (
      id TEXT PRIMARY KEY,
      farm_code TEXT NOT NULL,
      farm_id TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      data_summary TEXT,
      action_text TEXT NOT NULL,
      resolved INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
    );

    -- SYSTEM SETTINGS TABLE
    CREATE TABLE IF NOT EXISTS system_settings (
      id TEXT PRIMARY KEY,
      egg_price_per_kg INTEGER NOT NULL DEFAULT 32000,
      eggs_per_kg INTEGER NOT NULL DEFAULT 16,
      warning_drop_threshold INTEGER NOT NULL DEFAULT 15,
      critical_drop_threshold INTEGER NOT NULL DEFAULT 30,
      warning_missed_report_days INTEGER NOT NULL DEFAULT 3,
      critical_missed_report_days INTEGER NOT NULL DEFAULT 4,
      whatsapp_support_number TEXT NOT NULL DEFAULT '0812-8899-7700',
      company_name TEXT NOT NULL DEFAULT 'Eggnest Indonesia',
      company_address TEXT NOT NULL DEFAULT 'Jakarta, Indonesia',
      updated_at TEXT NOT NULL
    );

    -- ADMIN AUDIT LOGS TABLE (For tracking admin actions and impersonation)
    CREATE TABLE IF NOT EXISTS admin_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      admin_name TEXT NOT NULL,
      target_user_id TEXT,
      action TEXT NOT NULL,
      target TEXT NOT NULL,
      details TEXT,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      timestamp TEXT NOT NULL
    );

    -- NOTIFICATIONS TABLE
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('warning', 'info', 'success', 'alert')),
      date TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      action_url TEXT,
      created_at TEXT NOT NULL
    );

    -- FARM SCORES TABLE
    CREATE TABLE IF NOT EXISTS farm_scores (
      id TEXT PRIMARY KEY,
      farm_id TEXT UNIQUE NOT NULL,
      production_score INTEGER NOT NULL DEFAULT 90,
      report_score INTEGER NOT NULL DEFAULT 95,
      maintenance_score INTEGER NOT NULL DEFAULT 88,
      health_score INTEGER NOT NULL DEFAULT 94,
      total_score INTEGER NOT NULL DEFAULT 92,
      status_text TEXT NOT NULL DEFAULT 'SANGAT BAIK',
      streak_days INTEGER NOT NULL DEFAULT 30,
      badges TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
    );
  `);

  // Ensure default system settings exist
  const existingSettings = db.prepare('SELECT id FROM system_settings WHERE id = ?').get('default');
  if (!existingSettings) {
    db.prepare(`
      INSERT INTO system_settings (
        id, egg_price_per_kg, eggs_per_kg, warning_drop_threshold, critical_drop_threshold,
        warning_missed_report_days, critical_missed_report_days, whatsapp_support_number,
        company_name, company_address, updated_at
      ) VALUES (
        'default', 32000, 16, 15, 30, 3, 4, '0812-8899-7700', 'Eggnest Indonesia', 'Jakarta, Indonesia', datetime('now')
      )
    `).run();
  }

  // Seed default admin user if none exists
  const existingAdmin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!existingAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('admin123', salt);
    db.prepare(`
      INSERT INTO users (id, full_name, phone, email, password_hash, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'admin', 'active', datetime('now'), datetime('now'))
    `).run('user-admin-1', 'Admin Utama Eggnest', '0811998877', 'admin@eggnest.id', passwordHash);
  }

  // Check if database has initial demo data
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count <= 1) {
    seedInitialDemoData();
  }

  // Ensure all farms have individual chicken records
  migrateChickensData();
}

export function migrateChickensData() {
  const farms = db.prepare('SELECT * FROM farms').all() as any[];
  const now = new Date().toISOString();

  for (const farm of farms) {
    const existingChickens = db.prepare('SELECT COUNT(*) as count FROM chickens WHERE farm_id = ?').get(farm.id) as { count: number };
    if (existingChickens.count === 0) {
      const initialCount = farm.initial_chickens || 12;
      const activeCount = farm.active_chickens !== undefined ? farm.active_chickens : initialCount;

      const insertChickenStmt = db.prepare(`
        INSERT INTO chickens (
          id, farm_id, chicken_number, generation, status, initial_age_weeks, current_age_weeks,
          joined_date, death_date, death_reason, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (let i = 1; i <= initialCount; i++) {
        const isDead = i > activeCount;
        const status = isDead ? 'DEAD' : 'HEALTHY';
        const chickenId = `chk-${farm.id}-${i}`;
        insertChickenStmt.run(
          chickenId,
          farm.id,
          i,
          1,
          status,
          farm.initial_age_weeks || 18,
          farm.current_age_weeks || 22,
          farm.activation_date && !farm.activation_date.includes('Belum') ? farm.activation_date : '2026-07-20',
          isDead ? '2026-08-10' : null,
          isDead ? 'Mati karena cuaca ekstrem / sakit' : null,
          `Ayam Ras Lohmann Brown #${i}`,
          now,
          now
        );
      }
    }

    // Also populate chicken_health_reports for past daily reports if missing
    const reports = db.prepare('SELECT * FROM daily_reports WHERE farm_id = ?').all(farm.id) as any[];
    const chickens = db.prepare('SELECT * FROM chickens WHERE farm_id = ? ORDER BY chicken_number ASC').all(farm.id) as any[];

    for (const report of reports) {
      const healthReportCount = db.prepare('SELECT COUNT(*) as count FROM chicken_health_reports WHERE daily_report_id = ?').get(report.id) as { count: number };
      if (healthReportCount.count === 0 && chickens.length > 0) {
        let issueList: string[] = [];
        try {
          if (report.issue_types) {
            issueList = JSON.parse(report.issue_types);
          }
        } catch (e) {}

        const insertHealthReportStmt = db.prepare(`
          INSERT INTO chicken_health_reports (id, daily_report_id, chicken_id, chicken_number, condition, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        const insertProblemStmt = db.prepare(`
          INSERT INTO chicken_health_problems (id, health_report_id, problem_type, custom_notes, created_at)
          VALUES (?, ?, ?, ?, ?)
        `);

        chickens.forEach((chk, idx) => {
          const healthReportId = `chr-${report.id}-${chk.id}`;
          const isChickenIssue = report.chicken_condition === 'issue' && idx === 2; // Chicken #3 had the issue
          const isChickenDead = chk.status === 'DEAD';
          const condition = isChickenDead ? 'DEAD' : isChickenIssue ? 'SICK' : 'HEALTHY';

          insertHealthReportStmt.run(
            healthReportId,
            report.id,
            chk.id,
            chk.chicken_number,
            condition,
            report.created_at || now
          );

          if (isChickenIssue && issueList.length > 0) {
            issueList.forEach((prob, pIdx) => {
              insertProblemStmt.run(
                `chp-${healthReportId}-${pIdx}`,
                healthReportId,
                prob,
                report.notes || null,
                report.created_at || now
              );
            });
          }
        });
      }
    }
  }
}

export function seedInitialDemoData() {
  const salt = bcrypt.genSaltSync(10);
  const memberPasswordHash = bcrypt.hashSync('member123', salt);
  const now = new Date().toISOString();

  // 1. Initial Member User (Budi Santoso)
  const budiUser = db.prepare('SELECT id FROM users WHERE phone = ?').get('081234567890');
  if (!budiUser) {
    db.prepare(`
      INSERT INTO users (id, full_name, phone, email, password_hash, role, status, farm_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'member', 'active', ?, ?, ?)
    `).run('user-101', 'Budi Santoso', '081234567890', 'budi@example.com', memberPasswordHash, 'farm-101', now, now);
  }

  // 2. Initial Farms
  const farm1 = db.prepare('SELECT id FROM farms WHERE farm_code = ?').get('EN-000127');
  if (!farm1) {
    db.prepare(`
      INSERT INTO farms (
        id, farm_code, user_id, owner_name, phone, location, purchase_date, activation_date,
        initial_chickens, active_chickens, chicken_breed, initial_age_weeks, current_age_weeks,
        warranty_end, status, photo_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'farm-101',
      'EN-000127',
      'user-101',
      'Budi Santoso',
      '081234567890',
      'Bogor, Jawa Barat',
      '2026-07-15',
      '2026-07-20',
      12,
      12,
      'Layer Lohmann Brown Petelur Unggul',
      18,
      22,
      '30 Hari Garansi Aktif',
      'active',
      'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1000&q=80',
      now,
      now
    );
  }

  // Second farm (Unclaimed for testing binding)
  const farm2 = db.prepare('SELECT id FROM farms WHERE farm_code = ?').get('EN-000128');
  if (!farm2) {
    db.prepare(`
      INSERT INTO farms (
        id, farm_code, user_id, owner_name, phone, location, purchase_date, activation_date,
        initial_chickens, active_chickens, chicken_breed, initial_age_weeks, current_age_weeks,
        warranty_end, status, photo_url, created_at, updated_at
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'farm-102',
      'EN-000128',
      'Belum Diaktivasi',
      '-',
      'Depok, Jawa Barat',
      '2026-08-01',
      'Belum Aktif',
      12,
      12,
      'Layer Lohmann Brown Petelur Unggul',
      18,
      18,
      '30 Hari (Mulai saat aktivasi)',
      'unclaimed',
      'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=1000&q=80',
      now,
      now
    );
  }

  // Third farm (Warning state for smart alert test)
  const farm3 = db.prepare('SELECT id FROM farms WHERE farm_code = ?').get('EN-000129');
  if (!farm3) {
    db.prepare(`
      INSERT INTO farms (
        id, farm_code, user_id, owner_name, phone, location, purchase_date, activation_date,
        initial_chickens, active_chickens, chicken_breed, initial_age_weeks, current_age_weeks,
        warranty_end, status, photo_url, created_at, updated_at
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'farm-103',
      'EN-000129',
      'Siti Rahma',
      '081399881122',
      'Tangerang Selatan, Banten',
      '2026-06-10',
      '2026-06-15',
      12,
      11,
      'Layer Lohmann Brown Petelur Unggul',
      18,
      28,
      'Garansi Berakhir',
      'warning',
      'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1000&q=80',
      now,
      now
    );
  }

  // 3. 30 Days of Daily Reports for farm-101 (August 2026)
  const reportCount = db.prepare('SELECT COUNT(*) as count FROM daily_reports WHERE farm_id = ?').get('farm-101') as { count: number };
  if (reportCount.count === 0) {
    const insertReportStmt = db.prepare(`
      INSERT INTO daily_reports (
        id, farm_id, date, egg_count, feed_kg, chicken_condition, issue_types, notes,
        productivity_rate, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Standard pattern of 9-11 eggs per day for 12 chickens
    for (let day = 1; day <= 31; day++) {
      const dayStr = String(day).padStart(2, '0');
      const date = `2026-08-${dayStr}`;
      // Slight realistic variance: mostly 10-11, some 9, on day 15 drop to 7 then back up
      let eggs = 10;
      if (day % 4 === 0) eggs = 11;
      else if (day % 3 === 0) eggs = 9;
      else if (day === 15) eggs = 7;
      else if (day >= 25) eggs = 11;

      const feed = Number((1.35 + (day % 3) * 0.05).toFixed(2));
      const condition = eggs < 8 ? 'issue' : 'healthy';
      const issues = eggs < 8 ? JSON.stringify(['Produksi menurun']) : null;
      const notes = eggs < 8 ? 'Cuaca mendung & agak lembab' : 'Kandang bersih, pakan habis';
      const prodRate = Number(((eggs / 12) * 100).toFixed(1));

      insertReportStmt.run(
        `rep-farm-101-${date}`,
        'farm-101',
        date,
        eggs,
        feed,
        condition,
        issues,
        notes,
        prodRate,
        `${date} 07:30:00`,
        `${date} 07:30:00`
      );
    }
  }

  // 4. Initial Academy Contents
  const acadCount = db.prepare('SELECT COUNT(*) as count FROM academy_contents').get() as { count: number };
  if (acadCount.count === 0) {
    const insertAcad = db.prepare(`
      INSERT INTO academy_contents (
        id, title, category, description, content, type, duration, thumbnail, read_time, published, is_recommended, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAcad.run(
      'acad-1',
      'Cara Tepat Menjaga Kestabilan Produksi Telur Harian',
      'Produksi Telur',
      'Panduan praktis menjaga ritme bertelur ayam ras petelur tetap di atas 85% dengan manajemen pencahayaan dan pakan terukur.',
      `1. Pastikan pencahayaan cukup 14–16 jam per hari (termasuk sinar matahari alami).\n2. Berikan pakan layer berkualitas tepat waktu (pagi pukul 07:00 dan sore 15:30).\n3. Jaga sirkulasi udara kandang tetap sejuk dan tidak pengap.\n4. Pantau konsistensi air minum segar setiap hari.`,
      'video',
      '2 menit',
      'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
      '2 mnt',
      1,
      1,
      '2026-08-01',
      '2026-08-01'
    );

    insertAcad.run(
      'acad-2',
      'Pemberian Pakan Optimal untuk 12 Ekor Ayam',
      'Pakan',
      'Menghitung takaran pakan harian agar tidak kurang gizi dan tidak terbuang sia-sia.',
      `Kebutuhan rata-rata ayam layer dewasa adalah 110–120 gram/ekor/hari.\nUntuk 12 ekor:\n- Total kebutuhan: ~1.4 kg/hari.\n- Pagi hari: 0.5 kg (35%)\n- Sore hari: 0.9 kg (65%) karena pembentukan cangkang telur terjadi pada malam hari.`,
      'article',
      '3 menit',
      'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80',
      '3 mnt',
      1,
      0,
      '2026-08-05',
      '2026-08-05'
    );

    insertAcad.run(
      'acad-3',
      'Manajemen Kualitas Air Minum & Suplemen Elektrolit',
      'Air Minum',
      'Air minum adalah kunci utama penyerapan nutrisi pakan. Simak tips menjaga kebersihan nipple drinker.',
      `1. Kuras toren air minimal 1 minggu sekali.\n2. Berikan vitamin/elektrolit antistres saat cuaca terik di atas 32°C.\n3. Pastikan debit air pada nipple drinker mengalir lancar tanpa sumbatan kerak.`,
      'article',
      '2 menit',
      'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80',
      '2 mnt',
      1,
      0,
      '2026-08-10',
      '2026-08-10'
    );

    insertAcad.run(
      'acad-4',
      'Mengenali Gejala Awal Penyakit Ayam Petelur',
      'Kesehatan Ayam',
      'Deteksi dini feses, nafsu makan, dan keaktifan ayam sebelum infeksi menyebar ke seluruh kandang.',
      `Ciri ayam sehat:\n- Jengger merah segar dan tegak\n- Mata bulat bersinar tanpa lendir\n- Feses padat dengan sedikit asam urat putih di atasnya\n\nJika jengger pucat atau feses encer kehijauan, segera pisahkan dan buka tiket konsultasi di aplikasi Eggnest!`,
      'video',
      '4 menit',
      'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
      '4 mnt',
      1,
      0,
      '2026-08-15',
      '2026-08-15'
    );
  }

  // 5. Initial Support Tickets & Messages
  const ticketCount = db.prepare('SELECT COUNT(*) as count FROM support_tickets').get() as { count: number };
  if (ticketCount.count === 0) {
    db.prepare(`
      INSERT INTO support_tickets (
        id, ticket_code, farm_id, farm_code, user_id, owner_name, category, title, description,
        status, admin_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'ticket-1',
      'EN-CS-100234',
      'farm-101',
      'EN-000127',
      'user-101',
      'Budi Santoso',
      'Produksi Menurun',
      'Produksi telur turun saat cuaca hujan lebat',
      'Kemarin telur hanya 7 butir karena seharian hujan lebat dan kandang agak dingin. Apakah perlu suplemen penghangat atau tambahan vitamin pakan?',
      'Solusi Diberikan',
      'Disarankan pemberian vitamin antistres di air minum dan menutup tirai samping saat angin kencang.',
      '2026-08-16 09:30',
      '2026-08-16 11:00'
    );

    db.prepare(`
      INSERT INTO support_messages (id, ticket_id, sender_id, sender_name, sender_role, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'msg-101',
      'ticket-1',
      'user-101',
      'Budi Santoso',
      'member',
      'Kemarin telur hanya 7 butir karena seharian hujan lebat dan kandang agak dingin. Apakah perlu suplemen penghangat atau tambahan vitamin pakan?',
      '2026-08-16 09:30'
    );

    db.prepare(`
      INSERT INTO support_messages (id, ticket_id, sender_id, sender_name, sender_role, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'msg-102',
      'ticket-1',
      'user-admin-1',
      'Drh. Eggnest Vet Team',
      'veterinarian',
      'Halo Pak Budi, silakan tutup tirai penahan angin pada sisi barat kandang saat hujan lebat. Tambahkan suplemen Vitamin C & Elektrolit 2 gram/liter air minum selama 2 hari untuk memulihkan stamina ayam.',
      '2026-08-16 11:00'
    );
  }

  // 6. Initial Farm Score for farm-101
  const score = db.prepare('SELECT id FROM farm_scores WHERE farm_id = ?').get('farm-101');
  if (!score) {
    const badges = JSON.stringify([
      { id: 'b1', icon: '🏆', title: 'Pencatat Disiplin', description: '30 Hari berturut-turut mengisi laporan harian', earnedDate: '2026-08-30' },
      { id: 'b2', icon: '🌟', title: 'Produksi Unggul', description: 'Rata-rata produksi telur di atas 80%', earnedDate: '2026-08-25' },
      { id: 'b3', icon: '🛡️', title: 'Kandang Sehat', description: 'Kondisi kesehatan ayam terjaga tanpa mortalitas', earnedDate: '2026-08-20' },
    ]);

    db.prepare(`
      INSERT INTO farm_scores (
        id, farm_id, production_score, report_score, maintenance_score, health_score,
        total_score, status_text, streak_days, badges, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'score-101',
      'farm-101',
      90,
      98,
      88,
      94,
      92,
      'SANGAT BAIK',
      31,
      badges,
      now
    );
  }

  // 7. Initial Notifications
  const notifCount = db.prepare('SELECT COUNT(*) as count FROM notifications').get() as { count: number };
  if (notifCount.count === 0) {
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, date, read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      'notif-1',
      'user-101',
      'Produksi Bulan Agustus Tercapai!',
      'Total produksi telur bulan ini mencapai 312 butir (83.9% produktivitas rata-rata).',
      'success',
      '2026-08-31',
      now
    );

    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, date, read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      'notif-2',
      'user-101',
      'Garansi Ayam & Penggantian',
      'Masa garansi kandang Anda aktif 30 hari sejak tanggal aktivasi.',
      'info',
      '2026-08-01',
      now
    );
  }
}
