import {
  User,
  Farm,
  DailyReport,
  FarmScore,
  SupportTicket,
  AcademyContent,
  NotificationItem,
  AdminAlert,
  SystemSettings,
  AdminLog,
} from '../types';

export const DEFAULT_SETTINGS: SystemSettings = {
  eggPricePerKg: 32000,
  eggsPerKg: 16,
  warningDropThreshold: 15,
  criticalDropThreshold: 30,
  warningMissedReportDays: 3,
  criticalMissedReportDays: 4,
  whatsappSupportNumber: '0812-8899-7700',
  companyName: 'Eggnest Farm Hub Indonesia',
  companyAddress: 'Jl. Margonda Raya No. 128, Depok, Jawa Barat 16424',
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user-001',
    fullName: 'Budi Santoso',
    phone: '081234567890',
    email: 'budi.santoso@gmail.com',
    role: 'member',
    status: 'active',
    farmId: 'farm-001',
    createdAt: '2026-07-20T08:00:00Z',
  },
  {
    id: 'user-002',
    fullName: 'H. Suherman',
    phone: '081388776655',
    email: 'suherman@gmail.com',
    role: 'member',
    status: 'active',
    farmId: 'farm-002',
    createdAt: '2026-07-25T09:30:00Z',
  },
  {
    id: 'user-003',
    fullName: 'Ibu Ratna Dewi',
    phone: '081812349988',
    email: 'ratna.dewi@yahoo.com',
    role: 'member',
    status: 'active',
    farmId: 'farm-003',
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'user-admin',
    fullName: 'Admin Utama Eggnest',
    phone: '081199887766',
    email: 'admin@eggnest.id',
    role: 'admin',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export const INITIAL_FARMS: Farm[] = [
  {
    id: 'farm-001',
    farmCode: 'EN-000127',
    userId: 'user-001',
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
    createdAt: '2026-07-15T10:00:00Z',
  },
  {
    id: 'farm-002',
    farmCode: 'EN-000217',
    userId: 'user-002',
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
    photoUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=1000&q=80',
    createdAt: '2026-07-20T11:00:00Z',
  },
  {
    id: 'farm-003',
    farmCode: 'EN-000189',
    userId: 'user-003',
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
    createdAt: '2026-07-28T09:00:00Z',
  },
  // Unclaimed ready-for-registration Farm IDs:
  {
    id: 'farm-004',
    farmCode: 'EN-000128',
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
    createdAt: '2026-08-25T14:00:00Z',
  },
  {
    id: 'farm-005',
    farmCode: 'EN-000129',
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
    createdAt: '2026-08-28T10:00:00Z',
  },
  {
    id: 'farm-006',
    farmCode: 'EN-000130',
    ownerName: '',
    phone: '',
    location: 'Paket Belum Diaktivasi (Tersedia)',
    purchaseDate: '2026-08-30',
    activationDate: '',
    initialChickens: 24,
    activeChickens: 24,
    chickenBreed: 'Layer Lohmann Brown',
    initialAgeWeeks: 18,
    currentAgeWeeks: 18,
    warrantyEnd: '30 Hari setelah aktivasi',
    status: 'unclaimed',
    photoUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1000&q=80',
    createdAt: '2026-08-30T16:00:00Z',
  },
];

export const DEMO_FARM: Farm = INITIAL_FARMS[0];


// Generate 30 days of realistic daily reports for August 2026
export const generate30DaysReports = (): DailyReport[] => {
  const reports: DailyReport[] = [];
  const baseEggs = [9, 10, 10, 11, 9, 10, 12, 10, 9, 10, 11, 10, 9, 8, 10, 11, 10, 10, 9, 11, 10, 9, 10, 10, 11, 10, 9, 10, 9, 10];
  const baseFeeds = [1.2, 1.2, 1.25, 1.2, 1.18, 1.2, 1.25, 1.2, 1.2, 1.2, 1.22, 1.2, 1.2, 1.15, 1.2, 1.25, 1.2, 1.2, 1.18, 1.25, 1.2, 1.2, 1.22, 1.2, 1.25, 1.2, 1.2, 1.2, 1.2, 1.2];
  
  for (let i = 1; i <= 30; i++) {
    const dayStr = i < 10 ? `0${i}` : `${i}`;
    const date = `2026-08-${dayStr}`;
    const eggCount = baseEggs[i - 1] || 10;
    const feedKg = baseFeeds[i - 1] || 1.2;
    const prod = Number(((eggCount / 12) * 100).toFixed(1));

    reports.push({
      id: `rep-${i}`,
      farmId: 'farm-001',
      date,
      eggCount,
      feedKg,
      chickenCondition: 'healthy',
      notes: i % 7 === 0 ? 'Pembersihan sekam kandang rutin selesai dilakukan.' : '',
      createdAt: `${date}T16:30:00Z`,
      productivityRate: prod,
    });
  }

  // Today is 31 August 2026
  reports.push({
    id: 'rep-31',
    farmId: 'farm-001',
    date: '2026-08-31',
    eggCount: 10,
    feedKg: 1.2,
    chickenCondition: 'healthy',
    notes: 'Ayam aktif dan nafsu makan sangat baik.',
    createdAt: '2026-08-31T07:15:00Z',
    productivityRate: 83.3,
  });

  return reports;
};

export const INITIAL_REPORTS = generate30DaysReports();

export const INITIAL_FARM_SCORE: FarmScore = {
  id: 'fs-001',
  farmId: 'farm-001',
  productionScore: 95,
  reportScore: 90,
  maintenanceScore: 93,
  healthScore: 91,
  totalScore: 92,
  statusText: 'SANGAT BAIK',
  streakDays: 26,
  badges: [
    {
      id: 'badge-1',
      icon: '🏅',
      title: 'Peternak Disiplin',
      description: 'Melakukan laporan harian tanpa putus selama 20+ hari.',
      earnedDate: '25 Agustus 2026',
    },
    {
      id: 'badge-2',
      icon: '🥚',
      title: 'Produksi Stabil',
      description: 'Menjaga produktivitas di atas 80% selama 3 minggu.',
      earnedDate: '28 Agustus 2026',
    },
    {
      id: 'badge-3',
      icon: '🐔',
      title: 'Ayam Sehat',
      description: 'Kesehatan kawanan ayam terjaga 100% tanpa keluhan sakit.',
      earnedDate: '30 Agustus 2026',
    },
  ],
  updatedAt: '31 Agustus 2026',
};

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Produksi menurun 18%',
    message: 'Produksi 5 hari terakhir sedikit menurun dibanding rata-rata.',
    type: 'warning',
    date: '31 Agu 2026, 06:00',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Jangan lupa lapor hari ini',
    message: 'Input laporan harian untuk pantau perkembangan ayam dan telur.',
    type: 'info',
    date: '31 Agu 2026, 07:00',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Laporan berhasil disimpan',
    message: 'Laporan tanggal 30 Agustus 2026 (10 Butir) tersimpan aman.',
    type: 'success',
    date: '30 Agu 2026, 17:15',
    read: true,
  },
];

export const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'ticket-1',
    ticketCode: 'EN-CS-00921',
    farmId: 'farm-001',
    farmCode: 'EN-000127',
    ownerName: 'Pak Budi Santoso',
    category: 'Produksi Menurun',
    eggCountToday: 8,
    description: 'Cuaca terasa agak panas 2 hari ini dan telur sempat turun dari biasanya 10 menjadi 8 butir.',
    photoUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
    status: 'Diproses',
    adminNotes: 'Tim teknis Eggnest sedang menganalisis sirkulasi udara kandang dan kecukupan elektrolit.',
    createdAt: '30 Agustus 2026, 14:20',
    updatedAt: '31 Agustus 2026, 08:30',
  },
  {
    id: 'ticket-2',
    ticketCode: 'EN-CS-00874',
    farmId: 'farm-001',
    farmCode: 'EN-000127',
    ownerName: 'Pak Budi Santoso',
    category: 'Masalah Pakan',
    description: 'Pemberian pakan konsentrat batch baru apakah perlu dicampur bertahap?',
    status: 'Selesai',
    adminNotes: 'Disarankan transisi 3 hari: Hari 1 (75:25), Hari 2 (50:50), Hari 3 (100%).',
    createdAt: '22 Agustus 2026, 09:10',
    updatedAt: '23 Agustus 2026, 11:00',
  },
];

export const ACADEMY_CONTENTS: AcademyContent[] = [
  {
    id: 'acad-1',
    title: 'Menjaga Produksi Telur',
    category: 'Produksi Telur',
    description: 'Tips penting menjaga konsistensi bertelur pada usia puncak produksi 20–25 minggu.',
    content: `
### Usia Emas Ayam Petelur (20–25 Minggu)
Pada rentang usia 20 hingga 25 minggu, ayam petelur memasuki fase puncak (peak production). Di masa ini, potensi produksi dapat mencapai 85%–95%.

#### 4 Kunci Utama:
1. **Pemberian Pakan Tepat Waktu**: Berikan 100–110 gram pakan per ekor per hari. Bagi menjadi 2 sesi: pagi (07:00) 40% dan sore (15:30) 60%.
2. **Pencahayaan Konsisten**: Pastikan kandang mendapat pencahayaan 14–16 jam per hari (gabungan sinar matahari dan lampu hangat di malam hari).
3. **Air Minum Selalu Segar**: Ayam memerlukan 2x lipat air dibanding bobot pakan. Jangan sampai wadah minum kosong lebih dari 15 menit.
4. **Hindari Stres & Kebisingan**: Jauhkan hewan pengganggu (kucing/anjing liar) dan hindari suara bising mendadak.
    `,
    type: 'video',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '2 menit',
    thumbnail: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80',
    ageMinWeeks: 20,
    ageMaxWeeks: 25,
    readTime: '2 mnt baca',
    isRecommended: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'acad-2',
    title: 'Mengapa produksi telur menurun?',
    category: 'Masalah Umum',
    description: 'Penyebab umum penurunan jumlah telur harian dan langkah cepat mengatasinya.',
    content: `
### Mengenal Penyebab Telur Berkurang
Penurunan telur sebesar 10–20% bisa disebabkan oleh beberapa faktor non-penyakit:
- **Perubahan Suhu Ekstrem**: Udara yang terlalu terik membuat ayam minum berlebih dan nafsu pakan menurun.
- **Kekurangan Kalsium**: Cangkang telur tipis atau produksi mandeg karena kekurangan grit/kulit kerang.
- **Wadah Pakan Tercecer**: Pastikan pakan di palung tidak terbuang atau basah.
- **Masa Rontok Bulu (Molting)**: Terjadi alami jika ayam memasuki usia pergantian bulu.
    `,
    type: 'article',
    thumbnail: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80',
    readTime: '3 mnt baca',
    isRecommended: true,
    createdAt: '2026-08-18',
  },
  {
    id: 'acad-3',
    title: 'Berapa kebutuhan pakan 12 ekor ayam?',
    category: 'Pakan',
    description: 'Panduan takaran harian yang tepat untuk 12 ekor ayam layer tanpa sisa pakan basi.',
    content: `
### Standar Porsi Pakan untuk 12 Ayam:
- **Total Kebutuhan Harian**: 1,2 kg sampai 1,35 kg per hari (rata-rata 100–110 gram / ekor).
- **Jadwal Pemberian**:
  - Pagi (07.00): Berikan 500 gram.
  - Sore (15.30): Berikan 700–800 gram (ayam lebih banyak makan menjelang malam untuk pembentukan kerabang telur).
- **Tips**: Jangan tumpuk pakan baru di atas pakan lama yang berjamur.
    `,
    type: 'article',
    thumbnail: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
    readTime: '2 mnt baca',
    isRecommended: false,
    createdAt: '2026-08-10',
  },
  {
    id: 'acad-4',
    title: 'Cara menjaga air minum tetap bersih',
    category: 'Air Minum',
    description: 'Sanitasi tempat minum nipple / talang agar terhindar dari bakteri E. coli.',
    content: `
### Kebersihan Air Minum
- Kuras tempat air minimal 2 hari sekali.
- Tambahkan suplemen vitamin atau cuka apel (1 sdt per 2 liter) seminggu sekali untuk menjaga asam lambung ayam.
- Hindari paparan matahari langsung pada pipa air agar air tidak panas.
    `,
    type: 'article',
    thumbnail: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80',
    readTime: '2 mnt baca',
    isRecommended: false,
    createdAt: '2026-08-12',
  },
  {
    id: 'acad-5',
    title: 'Ciri ayam stres dan solusinya',
    category: 'Kesehatan Ayam',
    description: 'Kenali tanda-tanda stres ayam petelur sebelum menurunkan produksi secara permanen.',
    content: `
### Tanda Ayam Stres:
1. Ayam saling mematuk bulu (kanibalisme ringan).
2. Bernapas terengah-engah dengan paruh terbuka (heat stress).
3. Kotoran menjadi sangat encer atau berair.
4. Jengger pucat atau layu.

#### Solusi Cepat:
- Pasang jaring peneduh / semprot kabut air tipis saat siang panas.
- Berikan anti-stres elektrolit pada air minum.
    `,
    type: 'article',
    thumbnail: 'https://images.unsplash.com/photo-1579613832125-5d34a13ffe0a?auto=format&fit=crop&w=600&q=80',
    readTime: '3 mnt baca',
    isRecommended: false,
    createdAt: '2026-08-20',
  },
  {
    id: 'acad-6',
    title: 'Cara membersihkan kandang tanpa bikin ayam kaget',
    category: 'Kebersihan Kandang',
    description: 'Teknik bersihkan kotoran di kolong kandang dengan santai dan higienis.',
    content: `
### Jadwal Perawatan Kandang:
- **Harian**: Ambil telur pagi dan sore, bersihkan palung pakan dari bulu rontok.
- **Mingguan**: Taburkan kapur tohor atau sekam kering di bawah tampungan kotoran untuk meredam bau amonia.
- **Bulanan**: Semprot disinfektan ramah lingkungan di sekeliling area kandang.
    `,
    type: 'article',
    thumbnail: 'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?auto=format&fit=crop&w=600&q=80',
    readTime: '3 mnt baca',
    isRecommended: false,
    createdAt: '2026-08-22',
  },
  {
    id: 'acad-7',
    title: 'Mengatasi telur berukuran kecil',
    category: 'Produksi Telur',
    description: 'Panduan menaikkan grade dan berat telur rata-rata menjadi 60-65 gram.',
    content: `
### Mengapa Telur Kecil?
Ayam di awal masa bertelur (minggu 18-20) wajar menghasilkan telur berukuran kecil (45-50g). Namun jika di atas 22 minggu masih kecil, periksa:
- Kadar protein kasar pakan (minimal 17.5%).
- Pastikan asupan asam amino metionin dan lisin tercukupi dari pakan standar Eggnest.
    `,
    type: 'article',
    thumbnail: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=600&q=80',
    readTime: '2 mnt baca',
    isRecommended: false,
    createdAt: '2026-08-25',
  },
  {
    id: 'acad-8',
    title: 'Apa yang harus dilakukan jika ayam tidak bertelur?',
    category: 'Masalah Umum',
    description: 'Langkah investigasi terarah jika produksi 0 butir dalam 2 hari beruntun.',
    content: `
### Checklist Saat Ayam Mogok Bertelur:
1. **Cek Jam Cahaya**: Apakah malam hari kandang gelap total lebih dari 12 jam?
2. **Cek Kutu / Parasit**: Periksa pangkal bulu dubur ayam apakah ada tungau merah.
3. **Cek Suhu & Ventilasi**: Sirkulasi udara segar sangat memengaruhi hormon bertelur.
4. **Hubungi Konsultasi**: Gunakan menu Bantuan Eggnest untuk kirim foto dan konsultasi langsung dengan dokter hewan pendamping.
    `,
    type: 'article',
    thumbnail: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
    readTime: '4 mnt baca',
    isRecommended: false,
    createdAt: '2026-08-27',
  },
];

export const ADMIN_ALL_FARMS = [
  {
    id: 'farm-001',
    farmCode: 'EN-000127',
    ownerName: 'Budi Santoso',
    location: 'Depok, Jawa Barat',
    totalChickens: 12,
    todayEgg: 10,
    productivity: 83,
    status: 'normal' as const,
    lastReport: 'Hari ini, 07:15',
    phone: '0812-3456-7890',
  },
  {
    id: 'farm-002',
    farmCode: 'EN-000217',
    ownerName: 'H. Suherman',
    location: 'Bogor, Jawa Barat',
    totalChickens: 12,
    todayEgg: 4,
    productivity: 33,
    status: 'critical' as const,
    lastReport: 'Hari ini, 06:40',
    phone: '0813-8877-6655',
  },
  {
    id: 'farm-003',
    farmCode: 'EN-000189',
    ownerName: 'Ibu Ratna Dewi',
    location: 'Tangerang Selatan',
    totalChickens: 24,
    todayEgg: 0,
    productivity: 0,
    status: 'warning' as const,
    lastReport: '4 hari lalu',
    phone: '0818-1234-9988',
  },
  {
    id: 'farm-004',
    farmCode: 'EN-000301',
    ownerName: 'Ahmad Fauzi',
    location: 'Bekasi Timur',
    totalChickens: 12,
    todayEgg: 6,
    productivity: 50,
    status: 'critical' as const,
    lastReport: 'Kemarin, 17:00',
    phone: '0857-7788-9900',
  },
  {
    id: 'farm-005',
    farmCode: 'EN-000142',
    ownerName: 'Dr. Hendra Gunawan',
    location: 'Bandung, Jawa Barat',
    totalChickens: 36,
    todayEgg: 32,
    productivity: 89,
    status: 'normal' as const,
    lastReport: 'Hari ini, 08:10',
    phone: '0811-2233-4455',
  },
  {
    id: 'farm-006',
    farmCode: 'EN-000198',
    ownerName: 'Siti Aminah',
    location: 'Jakarta Selatan',
    totalChickens: 12,
    todayEgg: 11,
    productivity: 92,
    status: 'normal' as const,
    lastReport: 'Hari ini, 06:20',
    phone: '0819-4455-6677',
  },
  {
    id: 'farm-007',
    farmCode: 'EN-000255',
    ownerName: 'Bambang Pratama',
    location: 'Yogyakarta',
    totalChickens: 18,
    todayEgg: 15,
    productivity: 83,
    status: 'normal' as const,
    lastReport: 'Hari ini, 07:45',
    phone: '0812-9988-7766',
  },
];

export const INITIAL_ADMIN_ALERTS: AdminAlert[] = [
  {
    id: 'alert-1',
    farmCode: 'EN-00217',
    farmId: 'farm-002',
    ownerName: 'H. Suherman',
    type: 'critical_drop',
    severity: 'critical',
    title: 'Produksi turun 35%',
    description: 'Tren 4 hari terakhir: 8 → 7 → 5 → 4 telur. Memerlukan kunjungan teknisi/analisis pakan.',
    dataSummary: '8 → 7 → 5 → 4 telur',
    actionText: 'LIHAT DETAIL',
    resolved: false,
    createdAt: '31 Agustus 2026, 06:45',
  },
  {
    id: 'alert-2',
    farmCode: 'EN-00189',
    farmId: 'farm-003',
    ownerName: 'Ibu Ratna Dewi',
    type: 'missed_reports',
    severity: 'warning',
    title: 'Member tidak melapor selama 4 hari',
    description: 'Terakhir melapor tanggal 27 Agustus 2026. Hubungi melalui WhatsApp untuk konfirmasi status kandang.',
    actionText: 'HUBUNGI MEMBER',
    resolved: false,
    createdAt: '31 Agustus 2026, 06:00',
  },
  {
    id: 'alert-3',
    farmCode: 'EN-00301',
    farmId: 'farm-004',
    ownerName: 'Ahmad Fauzi',
    type: 'sick_chicken',
    severity: 'critical',
    title: 'Ayam sakit dilaporkan',
    description: 'Tiket bantuan #EN-CS-00925 masuk: 2 ekor ayam lemas dan jengger pucat.',
    actionText: 'LIHAT TIKET',
    resolved: false,
    createdAt: '30 Agustus 2026, 17:30',
  },
];
