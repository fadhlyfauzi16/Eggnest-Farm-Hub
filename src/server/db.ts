import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'eggnest.sqlite');

let db: Database;

// Helper to ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Persist the database to disk
export function persistDatabase() {
  if (!db) return;
  try {
    ensureDataDir();
    const binaryArray = db.export();
    const buffer = Buffer.from(binaryArray);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

export async function getDb(): Promise<Database> {
  if (db) return db;

  ensureDataDir();
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('Failed to load existing SQLite database, creating new one.', e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Initialize schema
  initSchema(db);
  persistDatabase();
  return db;
}

function initSchema(database: Database) {
  database.exec(`
    PRAGMA foreign_keys = ON;

    -- USERS TABLE
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      full_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('member', 'admin', 'veterinarian')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      farm_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- FARMS TABLE
    CREATE TABLE IF NOT EXISTS farms (
      id TEXT PRIMARY KEY,
      farm_code TEXT UNIQUE NOT NULL,
      owner_user_id TEXT UNIQUE,
      owner_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      location TEXT NOT NULL,
      purchase_date TEXT,
      activation_date TEXT NOT NULL,
      initial_chickens INTEGER NOT NULL DEFAULT 12,
      active_chickens INTEGER NOT NULL DEFAULT 12,
      chicken_breed TEXT NOT NULL DEFAULT 'Isa Brown Layer Super',
      initial_age_weeks INTEGER NOT NULL DEFAULT 18,
      current_age_weeks INTEGER NOT NULL DEFAULT 22,
      warranty_end TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unclaimed' CHECK(status IN ('unclaimed', 'active', 'warning', 'critical', 'inactive', 'completed')),
      photo_url TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- DAILY REPORTS TABLE (Unique constraint on farm_id + report_date)
    CREATE TABLE IF NOT EXISTS daily_reports (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL,
      report_date TEXT NOT NULL,
      egg_count INTEGER NOT NULL DEFAULT 0,
      feed_kg REAL NOT NULL DEFAULT 0.0,
      chicken_condition TEXT NOT NULL DEFAULT 'healthy' CHECK(chicken_condition IN ('healthy', 'issue')),
      issue_types TEXT, -- JSON array string
      notes TEXT,
      photo_url TEXT,
      video_url TEXT,
      productivity_rate REAL NOT NULL DEFAULT 0.0,
      fcr REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
      UNIQUE(farm_id, report_date)
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
      title TEXT,
      description TEXT NOT NULL,
      egg_count_today INTEGER,
      photo_url TEXT,
      video_url TEXT,
      status TEXT NOT NULL DEFAULT 'Diterima' CHECK(status IN ('Diterima', 'Diproses', 'Solusi Diberikan', 'Selesai')),
      admin_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- SUPPORT MESSAGES (THREAD) TABLE
    CREATE TABLE IF NOT EXISTS support_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT NOT NULL CHECK(sender_role IN ('member', 'admin', 'veterinarian')),
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
      type TEXT NOT NULL DEFAULT 'article' CHECK(type IN ('video', 'article')),
      video_url TEXT,
      duration TEXT,
      thumbnail TEXT NOT NULL,
      read_time TEXT,
      published INTEGER NOT NULL DEFAULT 1,
      is_recommended INTEGER NOT NULL DEFAULT 0,
      views_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- ADMIN ALERTS TABLE
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL,
      farm_code TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('critical', 'warning', 'info')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      data_summary TEXT,
      action_text TEXT NOT NULL DEFAULT 'HUBUNGI MEMBER',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'resolved')),
      resolved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
    );

    -- SYSTEM SETTINGS TABLE (Key-Value & Global Parameters)
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- ADMIN AUDIT LOGS TABLE
    CREATE TABLE IF NOT EXISTS admin_logs (
      id TEXT PRIMARY KEY,
      admin_user_id TEXT NOT NULL,
      admin_name TEXT NOT NULL,
      target_user_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- INDEXES FOR MAXIMUM QUERY PERFORMANCE
    CREATE INDEX IF NOT EXISTS idx_reports_farm_date ON daily_reports(farm_id, report_date);
    CREATE INDEX IF NOT EXISTS idx_tickets_farm ON support_tickets(farm_id);
    CREATE INDEX IF NOT EXISTS idx_messages_ticket ON support_messages(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_farm ON alerts(farm_id, status);
  `);

  // Seed default settings and initial admin if empty
  seedInitialDefaults(database);
}

function seedInitialDefaults(database: Database) {
  // Check if system_settings exist
  const resSettings = database.exec(`SELECT COUNT(*) as cnt FROM system_settings`);
  const countSettings = resSettings[0]?.values[0]?.[0] as number;

  if (countSettings === 0) {
    const defaultSettings = {
      eggPricePerKg: 32000,
      eggsPerKg: 16,
      warningDropThreshold: 15,
      criticalDropThreshold: 30,
      warningMissedReportDays: 3,
      criticalMissedReportDays: 4,
      whatsappSupportNumber: '0812-8899-7700',
      companyName: 'Eggnest Indonesia',
      companyAddress: 'Kawasan Agrotech Nusantara, Jawa Barat',
      logoUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=120&q=80',
    };

    for (const [k, v] of Object.entries(defaultSettings)) {
      database.run(
        `INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)`,
        [k, JSON.stringify(v), new Date().toISOString()]
      );
    }
  }

  // Check and bootstrap the 3 Super Admin accounts
  const superAdmins = [
    {
      id: 'admin-super-01',
      phone: '081100000001',
      email: 'superadmin1@eggnest.com',
      fullName: 'Super Admin 1 (Operasional & Kemitraan)',
      password: process.env.ADMIN1_PASSWORD || 'Admin1#Eggnest2026',
    },
    {
      id: 'admin-super-02',
      phone: '081100000002',
      email: 'superadmin2@eggnest.com',
      fullName: 'Super Admin 2 (Kesehatan Unggas & SOP)',
      password: process.env.ADMIN2_PASSWORD || 'Admin2#Eggnest2026',
    },
    {
      id: 'admin-super-03',
      phone: '081100000003',
      email: 'superadmin3@eggnest.com',
      fullName: 'Super Admin 3 (Garansi & Quality Control)',
      password: process.env.ADMIN3_PASSWORD || 'Admin3#Eggnest2026',
    },
  ];

  const now = new Date().toISOString();
  for (const admin of superAdmins) {
    const existing = database.exec(`SELECT id FROM users WHERE email = '${admin.email}'`);
    const passwordHash = bcrypt.hashSync(admin.password, 10);
    if (!existing[0] || existing[0].values.length === 0) {
      database.run(
        `INSERT INTO users (id, phone, email, full_name, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'admin', 'active', ?, ?)`,
        [admin.id, admin.phone, admin.email, admin.fullName, passwordHash, now, now]
      );
    } else {
      // Ensure password hash and admin role are kept up to date
      database.run(
        `UPDATE users SET password_hash = ?, role = 'admin', status = 'active', updated_at = ? WHERE email = ?`,
        [passwordHash, now, admin.email]
      );
    }
  }
}

// SQL Query helper functions
export function queryAll<T = any>(database: Database, sql: string, params: any[] = []): T[] {
  const stmt = database.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = any>(database: Database, sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(database, sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function runSql(database: Database, sql: string, params: any[] = []): void {
  database.run(sql, params);
  persistDatabase();
}
