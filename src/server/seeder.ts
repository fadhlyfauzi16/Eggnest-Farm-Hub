import { Database } from 'sql.js';
import bcrypt from 'bcryptjs';
import { runSql, persistDatabase } from './db';
import { evaluateSmartAlerts } from './alertEngine';

export function resetCleanDatabase(database: Database) {
  // Clear all operational demo data except admin users and settings
  database.exec(`
    DELETE FROM admin_logs;
    DELETE FROM alerts;
    DELETE FROM support_messages;
    DELETE FROM support_tickets;
    DELETE FROM daily_reports;
    DELETE FROM farms;
    DELETE FROM users WHERE role != 'admin';
  `);
  persistDatabase();
}

export function seedDemoData(database: Database) {
  // Clear all
  database.exec(`
    DELETE FROM admin_logs;
    DELETE FROM alerts;
    DELETE FROM support_messages;
    DELETE FROM support_tickets;
    DELETE FROM daily_reports;
    DELETE FROM academy_contents;
    DELETE FROM farms;
    DELETE FROM users;
  `);

  const now = new Date().toISOString();
  const passwordMemberHash = bcrypt.hashSync('password123', 10);
  const passwordAdminHash = bcrypt.hashSync('admin123', 10);

  // 1. Seed Users
  const users = [
    {
      id: 'user-001',
      phone: '081234567890',
      email: 'budi.santoso@gmail.com',
      fullName: 'Budi Santoso',
      passwordHash: passwordMemberHash,
      role: 'member',
      farmId: 'farm-001',
    },
    {
      id: 'user-002',
      phone: '081388776655',
      email: 'suherman@gmail.com',
      fullName: 'H. Suherman',
      passwordHash: passwordMemberHash,
      role: 'member',
      farmId: 'farm-002',
    },
    {
      id: 'user-003',
      phone: '081812349988',
      email: 'ratna.dewi@yahoo.com',
      fullName: 'Ibu Ratna Dewi',
      passwordHash: passwordMemberHash,
      role: 'member',
      farmId: 'farm-003',
    },
    {
      id: 'user-admin',
      phone: '081199887766',
      email: 'admin@eggnest.id',
      fullName: 'Administrator Eggnest',
      passwordHash: passwordAdminHash,
      role: 'admin',
    },
  ];

  users.forEach((u) => {
    runSql(
      database,
      `INSERT INTO users (id, phone, email, full_name, password_hash, role, status, farm_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
      [u.id, u.phone, u.email, u.fullName, u.passwordHash, u.role, u.farmId || null, now, now]
    );
  });

  // 2. Seed Farms
  const farms = [
    {
      id: 'farm-001',
      farmCode: 'EN-000127',
      ownerUserId: 'user-001',
      ownerName: 'Budi Santoso',
      phone: '081234567890',
      location: 'Depok, Jawa Barat',
      purchaseDate: '2026-07-15',
      activationDate: '2026-07-20',
      initialChickens: 12,
      activeChickens: 12,
      chickenBreed: 'Layer Lohmann Brown Petelur Unggul',
      initialAgeWeeks: 18,
      currentAgeWeeks: 24,
      warrantyEnd: '2026-08-19',
      status: 'active',
      photoUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1000&q=80',
    },
    {
      id: 'farm-002',
      farmCode: 'EN-000217',
      ownerUserId: 'user-002',
      ownerName: 'H. Suherman',
      phone: '081388776655',
      location: 'Bogor, Jawa Barat',
      purchaseDate: '2026-07-20',
      activationDate: '2026-07-25',
      initialChickens: 12,
      activeChickens: 12,
      chickenBreed: 'Layer Lohmann Brown',
      initialAgeWeeks: 18,
      currentAgeWeeks: 23,
      warrantyEnd: '2026-08-24',
      status: 'critical',
      photoUrl: 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?auto=format&fit=crop&w=1000&q=80',
    },
    {
      id: 'farm-003',
      farmCode: 'EN-000189',
      ownerUserId: 'user-003',
      ownerName: 'Ibu Ratna Dewi',
      phone: '081812349988',
      location: 'Tangerang Selatan',
      purchaseDate: '2026-07-28',
      activationDate: '2026-08-01',
      initialChickens: 24,
      activeChickens: 24,
      chickenBreed: 'Layer Lohmann Brown',
      initialAgeWeeks: 18,
      currentAgeWeeks: 22,
      warrantyEnd: '2026-08-31',
      status: 'warning',
      photoUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=1000&q=80',
    },
    {
      id: 'farm-004',
      farmCode: 'EN-000128',
      ownerUserId: null,
      ownerName: '',
      phone: '',
      location: 'Paket Belum Diaktivasi (Tersedia)',
      purchaseDate: '2026-08-25',
      activationDate: '',
      initialChickens: 12,
      activeChickens: 12,
      chickenBreed: 'Layer Lohmann Brown',
      initialAgeWeeks: 18,
      currentAgeWeeks: 18,
      warrantyEnd: '30 Hari setelah aktivasi',
      status: 'unclaimed',
      photoUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1000&q=80',
    },
    {
      id: 'farm-005',
      farmCode: 'EN-000129',
      ownerUserId: null,
      ownerName: '',
      phone: '',
      location: 'Paket Belum Diaktivasi (Tersedia)',
      purchaseDate: '2026-08-28',
      activationDate: '',
      initialChickens: 12,
      activeChickens: 12,
      chickenBreed: 'Layer Lohmann Brown',
      initialAgeWeeks: 18,
      currentAgeWeeks: 18,
      warrantyEnd: '30 Hari setelah aktivasi',
      status: 'unclaimed',
      photoUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1000&q=80',
    },
  ];

  farms.forEach((f) => {
    runSql(
      database,
      `INSERT INTO farms (id, farm_code, owner_user_id, owner_name, phone, location, purchase_date, activation_date, initial_chickens, active_chickens, chicken_breed, initial_age_weeks, current_age_weeks, warranty_end, status, photo_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        f.id,
        f.farmCode,
        f.ownerUserId,
        f.ownerName,
        f.phone,
        f.location,
        f.purchaseDate,
        f.activationDate,
        f.initialChickens,
        f.activeChickens,
        f.chickenBreed,
        f.initialAgeWeeks,
        f.currentAgeWeeks,
        f.warrantyEnd,
        f.status,
        f.photoUrl,
        now,
        now,
      ]
    );
  });

  // 3. Seed 31 Days of Daily Reports for Budi's Farm (farm-001)
  const baseEggs = [9, 10, 10, 11, 9, 10, 12, 10, 9, 10, 11, 10, 9, 8, 10, 11, 10, 10, 9, 11, 10, 9, 10, 10, 11, 10, 9, 10, 9, 10, 10];
  const baseFeeds = [1.2, 1.2, 1.25, 1.2, 1.18, 1.2, 1.25, 1.2, 1.2, 1.2, 1.22, 1.2, 1.2, 1.15, 1.2, 1.25, 1.2, 1.2, 1.18, 1.25, 1.2, 1.2, 1.22, 1.2, 1.25, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2];

  for (let i = 1; i <= 31; i++) {
    const dayStr = i < 10 ? `0${i}` : `${i}`;
    const reportDate = `2026-08-${dayStr}`;
    const eggCount = baseEggs[i - 1] || 10;
    const feedKg = baseFeeds[i - 1] || 1.2;
    const prod = Number(((eggCount / 12) * 100).toFixed(1));
    const eggMassKg = eggCount / 16;
    const fcr = Number((feedKg / eggMassKg).toFixed(2));

    runSql(
      database,
      `INSERT INTO daily_reports (id, farm_id, report_date, egg_count, feed_kg, chicken_condition, notes, productivity_rate, fcr, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'healthy', ?, ?, ?, ?, ?)`,
      [
        `rep-001-${reportDate}`,
        'farm-001',
        reportDate,
        eggCount,
        feedKg,
        i === 31 ? 'Ayam aktif dan nafsu makan sangat baik.' : (i % 7 === 0 ? 'Pembersihan sekam rutin.' : null),
        prod,
        fcr,
        `${reportDate}T16:00:00Z`,
        `${reportDate}T16:00:00Z`,
      ]
    );
  }

  // Reports for Suherman (farm-002: critical drop, stopped reporting 4 days ago)
  for (let i = 1; i <= 27; i++) {
    const dayStr = i < 10 ? `0${i}` : `${i}`;
    const reportDate = `2026-08-${dayStr}`;
    const eggCount = i > 24 ? 4 : 9;
    const feedKg = 1.2;
    const prod = Number(((eggCount / 12) * 100).toFixed(1));
    const isIssue = i > 24;

    runSql(
      database,
      `INSERT INTO daily_reports (id, farm_id, report_date, egg_count, feed_kg, chicken_condition, issue_types, notes, productivity_rate, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `rep-002-${reportDate}`,
        'farm-002',
        reportDate,
        eggCount,
        feedKg,
        isIssue ? 'issue' : 'healthy',
        isIssue ? JSON.stringify(['Ayam sakit', 'Produksi menurun']) : null,
        isIssue ? 'Nafsu makan berkurang drastis' : null,
        prod,
        `${reportDate}T16:00:00Z`,
        `${reportDate}T16:00:00Z`,
      ]
    );
  }

  // 4. Seed Support Tickets & Messages Thread
  const tickets = [
    {
      id: 'ticket-1',
      ticketCode: 'EN-CS-00921',
      farmId: 'farm-001',
      farmCode: 'EN-000127',
      userId: 'user-001',
      ownerName: 'Budi Santoso',
      category: 'Produksi Menurun',
      title: 'Penurunan panen telur 2 hari terakhir',
      description: 'Cuaca terasa agak panas 2 hari ini dan telur sempat turun dari biasanya 10 menjadi 8 butir.',
      eggCountToday: 8,
      photoUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
      status: 'Diproses',
      adminNotes: 'Tim teknis Eggnest sedang menganalisis sirkulasi udara kandang dan kecukupan elektrolit.',
      createdAt: '2026-08-30T14:20:00Z',
    },
    {
      id: 'ticket-2',
      ticketCode: 'EN-CS-00874',
      farmId: 'farm-001',
      farmCode: 'EN-000127',
      userId: 'user-001',
      ownerName: 'Budi Santoso',
      category: 'Masalah Pakan',
      title: 'Transisi konsentrat pakan baru',
      description: 'Pemberian pakan konsentrat batch baru apakah perlu dicampur bertahap?',
      status: 'Selesai',
      adminNotes: 'Disarankan transisi 3 hari: Hari 1 (75:25), Hari 2 (50:50), Hari 3 (100%).',
      createdAt: '2026-08-22T09:10:00Z',
    },
  ];

  tickets.forEach((t) => {
    runSql(
      database,
      `INSERT INTO support_tickets (id, ticket_code, farm_id, farm_code, user_id, owner_name, category, title, description, egg_count_today, photo_url, status, admin_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id,
        t.ticketCode,
        t.farmId,
        t.farmCode,
        t.userId,
        t.ownerName,
        t.category,
        t.title,
        t.description,
        t.eggCountToday || null,
        t.photoUrl || null,
        t.status,
        t.adminNotes || null,
        t.createdAt,
        now,
      ]
    );

    // Initial message
    runSql(
      database,
      `INSERT INTO support_messages (id, ticket_id, sender_id, sender_name, sender_role, message, attachment_url, created_at)
       VALUES (?, ?, ?, ?, 'member', ?, ?, ?)`,
      [`msg-${t.id}-1`, t.id, t.userId, t.ownerName, t.description, t.photoUrl || null, t.createdAt]
    );

    // Admin reply if processed or done
    if (t.adminNotes) {
      runSql(
        database,
        `INSERT INTO support_messages (id, ticket_id, sender_id, sender_name, sender_role, message, created_at)
         VALUES (?, ?, 'user-admin', 'Drh. Eggnest Technical Team', 'admin', ?, ?)`,
        [`msg-${t.id}-2`, t.id, t.adminNotes, now]
      );
    }
  });

  // 5. Seed Academy Contents
  const academy = [
    {
      id: 'acad-1',
      title: 'Menjaga Produksi Telur Puncak',
      category: 'Produksi Telur',
      description: 'Tips penting menjaga konsistensi bertelur pada usia puncak produksi 20–25 minggu.',
      content: `### Usia Emas Ayam Petelur (20–25 Minggu)\nPada rentang usia 20 hingga 25 minggu, ayam petelur memasuki fase puncak (peak production). Di masa ini, potensi produksi dapat mencapai 85%–95%.\n\n#### 4 Kunci Utama:\n1. Pemberian pakan tepat waktu.\n2. Pencahayaan konsisten 14–16 jam per hari.\n3. Air minum selalu segar dan steril.\n4. Hindari stres mendadak.`,
      type: 'video',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: '2 menit',
      thumbnail: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
      readTime: '2 mnt baca',
      published: 1,
      isRecommended: 1,
    },
    {
      id: 'acad-2',
      title: 'Mengapa produksi telur menurun?',
      category: 'Permasalahan Umum',
      description: 'Penyebab umum penurunan jumlah telur harian dan langkah cepat mengatasinya.',
      content: `### Mengenal Penyebab Telur Berkurang\nPenurunan telur bisa disebabkan oleh perubahan suhu panas ekstrem, kekurangan mineral kalsium cangkang, atau pakan berjamur.`,
      type: 'article',
      thumbnail: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80',
      readTime: '3 mnt baca',
      published: 1,
      isRecommended: 1,
    },
    {
      id: 'acad-3',
      title: 'Berapa kebutuhan pakan 12 ekor ayam?',
      category: 'Pakan',
      description: 'Panduan takaran harian yang tepat untuk 12 ekor ayam layer tanpa sisa pakan basi.',
      content: `### Standar Porsi Pakan untuk 12 Ayam:\n- Total kebutuhan harian: 1,2 kg sampai 1,35 kg per hari (100–110 gram/ekor).\n- Jadwal: Pagi (500g), Sore (700-800g).`,
      type: 'article',
      thumbnail: 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?auto=format&fit=crop&w=600&q=80',
      readTime: '2 mnt baca',
      published: 1,
      isRecommended: 0,
    },
    {
      id: 'acad-4',
      title: 'Cara menjaga air minum tetap bersih',
      category: 'Air Minum',
      description: 'Sanitasi tempat minum nipple / talang agar terhindar dari bakteri E. coli.',
      content: `### Kebersihan Air Minum\nKuras tempat air minimal 2 hari sekali dan berikan vitamin elektrolit di siang hari terik.`,
      type: 'article',
      thumbnail: 'https://images.unsplash.com/photo-1516972810927-80185027ca84?auto=format&fit=crop&w=600&q=80',
      readTime: '2 mnt baca',
      published: 1,
      isRecommended: 0,
    },
    {
      id: 'acad-5',
      title: 'Ciri ayam stres dan solusinya',
      category: 'Kesehatan Ayam',
      description: 'Kenali tanda-tanda stres ayam petelur sebelum menurunkan produksi secara permanen.',
      content: `### Tanda Ayam Stres\nAyam mematuk bulu, bernapas terengah-engah, kotoran sangat berair, atau jengger pucat.`,
      type: 'article',
      thumbnail: 'https://images.unsplash.com/photo-1579613832125-5d34a13ffe0a?auto=format&fit=crop&w=600&q=80',
      readTime: '3 mnt baca',
      published: 1,
      isRecommended: 0,
    },
    {
      id: 'acad-6',
      title: 'Cara membersihkan kandang tanpa bikin ayam kaget',
      category: 'Kebersihan Kandang',
      description: 'Teknik bersihkan kotoran di kolong kandang dengan santai dan higienis.',
      content: `### Jadwal Perawatan Kandang\nTaburkan kapur tohor atau sekam kering di bawah tampungan kotoran secara berkala.`,
      type: 'article',
      thumbnail: 'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?auto=format&fit=crop&w=600&q=80',
      readTime: '3 mnt baca',
      published: 1,
      isRecommended: 0,
    },
  ];

  academy.forEach((a) => {
    runSql(
      database,
      `INSERT INTO academy_contents (id, title, category, description, content, type, video_url, duration, thumbnail, read_time, published, is_recommended, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        a.id,
        a.title,
        a.category,
        a.description,
        a.content,
        a.type,
        a.videoUrl || null,
        a.duration || null,
        a.thumbnail,
        a.readTime,
        a.published,
        a.isRecommended,
        now,
        now,
      ]
    );
  });

  // 6. Evaluate Smart Alerts engine
  evaluateSmartAlerts(database);

  // 7. Initial Admin Audit Log
  runSql(
    database,
    `INSERT INTO admin_logs (id, admin_user_id, admin_name, target_user_id, action, details, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      `log-${Date.now()}`,
      'user-admin',
      'Administrator Eggnest',
      'user-001',
      'SEED_DATABASE',
      'Inisialisasi dataset demo produksi & kandang Eggnest',
      now,
    ]
  );

  persistDatabase();
}
