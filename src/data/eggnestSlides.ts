export interface EggnestSlide {
  num: string; // "01", "02", ...
  id: string;
  title: string;
  mainMessage: string;
  category: string;
  camProgress: number; // 0.0 to 5.0 in 3D camera
  bulletPoints?: string[];
  stats?: { label: string; value: string; note?: string }[];
  highlight?: string;
  quote?: string;
  comparison?: {
    alone: string[];
    withEggnest: string[];
  };
  steps?: { step: string; title: string; desc: string }[];
}

export const EGGNEST_SLIDES: EggnestSlide[] = [
  {
    num: "01",
    id: "cover",
    category: "PENDAHULUAN",
    title: "DARI RUMAH, KITA BANGUN KETAHANAN PANGAN",
    mainMessage: "Cover. Gerakan 1 Rumah 1 Kandang – Eggnest Home Farm.",
    camProgress: 0.0,
    bulletPoints: [
      "Pemberdayaan keluarga mandiri berbasis pangan segar berprotein tinggi.",
      "Solusi peternakan rumahan modern yang higienis, terstandar, dan nirbau.",
      "Gerakan swasembada telur nasional yang dimulai dari pekarangan kita sendiri."
    ],
    highlight: "1 RUMAH • 1 KANDANG • 12 AYAM PETELUR",
    stats: [
      { label: "Populasi Per Unit", value: "12 Ekor", note: "ISA Brown Pullet Siap Telur" },
      { label: "Potensi Panen", value: "±330 Butir", note: "Rata-rata per bulan" },
      { label: "Ruang Dibutuhkan", value: "1.5 × 1.2 m", note: "Cocok untuk teras / halaman" }
    ]
  },
  {
    num: "02",
    id: "kebutuhan-harian",
    category: "KESADARAN MASALAH",
    title: "SETIAP HARI KITA BUTUH PANGAN",
    mainMessage: "Pangan bukan kebutuhan sesekali. Setiap keluarga membutuhkannya setiap hari.",
    camProgress: 0.3,
    bulletPoints: [
      "Protein hewani adalah asupan krusial bagi pertumbuhan anak dan kesehatan orang dewasa.",
      "Keluarga Indonesia mengonsumsi telur hampir setiap hari untuk sarapan dan menu utama.",
      "Kebutuhan pangan bersifat primer, tak terputus, dan terus meningkat seiring waktu."
    ],
    quote: "Pangan tidak bisa ditunda. Kita makan setiap hari, namun dari mana sumber protein harian keluarga kita berasal?",
    stats: [
      { label: "Frekuensi Kebutuhan", value: "3× Sehari", note: "Asupan vital keluarga" },
      { label: "Ketergantungan Pasar", value: "98%", note: "Pasokan rumah tangga dibeli dari luar" }
    ]
  },
  {
    num: "03",
    id: "hanya-konsumen",
    category: "KESADARAN MASALAH",
    title: "TAPI KEBANYAKAN RUMAH MASIH HANYA MENJADI KONSUMEN",
    mainMessage: "Telur, beras, sayur dan protein hampir semuanya dibeli. Bangun kesadaran masalah.",
    camProgress: 0.6,
    bulletPoints: [
      "Keluarga sangat rentan terhadap fluktuasi harga pasar dan rantai distribusi pangan yang panjang.",
      "Ketika harga telur melonjak atau distribusi terganggu, pengeluaran dapur langsung terbebani.",
      "Rumah tangga hanya menjadi titik akhir konsumsi, tanpa memiliki ketahanan pangan internal."
    ],
    highlight: "Ketergantungan 100% pada pasar membuat keluarga rentan terhadap inflasi dan krisis pasokan.",
    stats: [
      { label: "Rantai Pasok", value: "4–6 Titik", note: "Dari peternak besar ke meja makan" },
      { label: "Usia Telur di Pasar", value: "7–14 Hari", note: "Kualitas kesegaran menurun" }
    ]
  },
  {
    num: "04",
    id: "rumah-produsen",
    category: "TURNING POINT",
    title: "BAGAIMANA JIKA RUMAH JUGA BISA MENJADI PRODUSEN?",
    mainMessage: "Turning point. Ketahanan pangan bisa dimulai dari skala rumah tangga.",
    camProgress: 0.9,
    bulletPoints: [
      "Mengubah halaman belakang yang pasif menjadi lumbung protein produktif keluarga.",
      "Memangkas rantai distribusi hingga 0 kilometer: dari kandang langsung ke piring makan.",
      "Keluarga tidak hanya berhemat pengeluaran, tetapi juga memiliki rasa aman pangan mandiri."
    ],
    quote: "Kedaulatan pangan sejati bukan hanya tentang gudang nasional yang besar, melainkan lumbung pangan di setiap rumah.",
    highlight: "Transformasi Paradigma: Dari Konsumen Pasif Menjadi Rumah Tangga Produsen Pangan Segar."
  },
  {
    num: "05",
    id: "kenapa-ayam-petelur",
    category: "PILIHAN STRATEGIS",
    title: "KENAPA AYAM PETELUR?",
    mainMessage: "Produksi harian, kebutuhan pasar terus ada, lahan relatif kecil, bisa dikonsumsi maupun dijual.",
    camProgress: 1.1,
    bulletPoints: [
      "Produksi Harian: Bertelur hampir setiap hari (siklus panen 24-26 jam), bukan menunggu bulanan.",
      "Kebutuhan Pasar Selalu Ada: Telur adalah komoditas dengan likuiditas tertinggi di masyarakat.",
      "Lahan Ringkas: Kandang baterai vertikal Eggnest hanya butuh area 1.5 meter persegi.",
      "Dua Manfaat Sekaligus: Langsung dikonsumsi keluarga atau dijual ke tetangga sekitar."
    ],
    stats: [
      { label: "Siklus Panen", value: "Setiap Pagi", note: "Panen segar harian" },
      { label: "Rasio Konversi", value: "Tinggi & Konsisten", note: "Pakan presisi efisien" },
      { label: "Kebutuhan Lahan", value: "Minimalis", note: "Desain vertikal 2 tingkat" }
    ]
  },
  {
    num: "06",
    id: "cukup-12-ekor",
    category: "FORMULA DASAR",
    title: "CUKUP DIMULAI DARI 12 EKOR",
    mainMessage: "Visual besar: 12 ekor → ±11 telur/hari → ±330 telur/bulan.",
    camProgress: 1.4,
    bulletPoints: [
      "12 Ekor Ayam Pullet Terseleksi berumur ±16 minggu yang siap bertelur.",
      "Tingkat produksi (lay rate) rata-rata 90–92% dengan perawatan standar.",
      "Menghasilkan ±10 hingga 11 butir telur segar setiap hari tanpa jeda.",
      "Dalam satu bulan menghasilkan ±330 butir telur (sekitar 20,6 kg telur segar)."
    ],
    stats: [
      { label: "Populasi", value: "12 Ekor", note: "Ayam ras petelur cokelat unggul" },
      { label: "Produksi Harian", value: "±11 Butir", note: "91.6% produktivitas harian" },
      { label: "Produksi Bulanan", value: "±330 Butir", note: "Setara ±20.6 kg telur bermutu" }
    ]
  },
  {
    num: "07",
    id: "gerakan-bersama",
    category: "SKALA & DAMPAK",
    title: "BAYANGKAN JIKA GERAKAN INI DILAKUKAN BERSAMA",
    mainMessage: "1 rumah = 12 ayam. 100 rumah = 1.200 ayam. 1.000 rumah = 12.000 ayam.",
    camProgress: 1.8,
    bulletPoints: [
      "1 Rumah: 12 Ayam → 330 Telur/Bulan (Ketahanan Pangan 1 Keluarga)",
      "100 Rumah (1 RW): 1.200 Ayam → 33.000 Telur/Bulan (Kemandirian Klaster Wilayah)",
      "1.000 Rumah (1 Desa/Kelurahan): 12.000 Ayam → 330.000 Telur/Bulan (Lumbung Protein Desa)"
    ],
    stats: [
      { label: "Skala 1 Rumah", value: "12 Ekor", note: "±330 telur/bulan" },
      { label: "Skala 100 Rumah", value: "1.200 Ekor", note: "±33.000 telur/bulan" },
      { label: "Skala 1.000 Rumah", value: "12.000 Ekor", note: "±330.000 telur/bulan" }
    ],
    highlight: "Kekuatan desentralisasi: ribuan rumah tangga bersama-sama membentuk jaringan suplai pangan lokal yang tahan krisis."
  },
  {
    num: "08",
    id: "inilah-eggnest",
    category: "NILAI INTI",
    title: "INILAH EGGNEST HOME FARM",
    mainMessage: "Eggnest bukan sekadar menjual ayam dan kandang. Eggnest membangun ekosistem peternakan rumah tangga.",
    camProgress: 2.1,
    bulletPoints: [
      "Bukan sekadar transaksi jual-beli kandang lalu ditinggal sendiri.",
      "Eggnest adalah penyedia ekosistem terpadu dari bibit, pakan, SOP perawatan, hingga teknologi.",
      "Memastikan pemula sekalipun dapat berhasil beternak tanpa bau, higienis, dan tanpa repot.",
      "Menghubungkan peternak rumahan ke dalam jaringan komunitas dan rantai pasok terpercaya."
    ],
    highlight: "Sistem Terintegrasi: Sarana Fisik + Standar Operasional + Dukungan Nutrisi + Ekosistem Digital."
  },
  {
    num: "09",
    id: "farm-id",
    category: "JARINGAN CERDAS",
    title: "1 RUMAH • 1 KANDANG • 1 FARM ID",
    mainMessage: "Setiap kandang menjadi bagian dari jaringan Eggnest dan tercatat dalam Farm Hub.",
    camProgress: 2.5,
    bulletPoints: [
      "Setiap unit kandang memiliki plat identitas unik 'Eggnest Farm ID' berkode QR.",
      "Terkoneksi langsung ke server cloud Eggnest untuk rekam jejak kesehatan dan produktivitas.",
      "Memudahkan pemesanan pakan ulang, konsultasi dokter hewan, serta verifikasi mutu kandang.",
      "Menjadi sertifikat digital kepemilikan peternakan rumah tangga modern."
    ],
    stats: [
      { label: "Identitas Unik", value: "FARM ID", note: "Nomor registrasi kandang resmi" },
      { label: "Konektivitas", value: "Cloud Synced", note: "Terhubung ke database Farm Hub" }
    ]
  },
  {
    num: "10",
    id: "kenapa-farm-hub",
    category: "TEKNOLOGI",
    title: "KENAPA HARUS EGGNEST FARM HUB?",
    mainMessage: "Monitoring produksi, edukasi, pendampingan, laporan kandang, bantuan masalah dan database produktivitas.",
    camProgress: 4.0,
    bulletPoints: [
      "Monitoring Produksi Harian: Catat butir telur dan pantau lay rate dalam genggaman ponsel.",
      "Modul Edukasi Mandiri: Video panduan praktis dan tips perawatan ayam tropis.",
      "Pendampingan & Bantuan Cepat: Tombol SOS konsultasi jika ayam menunjukkan gejala sakit.",
      "Database Produktivitas: Riwayat akurat untuk mengukur efisiensi pakan dan keuntungan."
    ],
    stats: [
      { label: "Kemudahan Akses", value: "Mobile Apps", note: "Android & iOS ready" },
      { label: "Fitur Utama", value: "6 Modul", note: "Panen, Pakan, Suhu, Chat Ahli, Edukasi, Toko" }
    ]
  },
  {
    num: "11",
    id: "tidak-berjalan-sendiri",
    category: "DUKUNGAN & JAMINAN",
    title: "ANDA TIDAK BERJALAN SENDIRI",
    mainMessage: "Ada pendampingan, edukasi dokter hewan, kunjungan berkala, pakan, vitamin dan support.",
    camProgress: 3.2,
    bulletPoints: [
      "Pendampingan Berkelanjutan: Tim teknisi kami mendampingi mulai dari perakitan hingga masa bertelur.",
      "Konsultasi Dokter Hewan: Diskusi berkala mengenai biosecurity, kesehatan, dan nutrisi.",
      "Kunjungan Berkala & Evaluasi: Pemeriksaan performa kandang bagi anggota program komunitas.",
      "Jaminan Ketersediaan Pakan: Suplai pakan berformula khusus dikirim tepat waktu ke depan pintu."
    ],
    quote: "Kunci keberhasilan peternak pemula adalah pendampingan ahli yang selalu siap saat dibutuhkan.",
    highlight: "Full Support System: Anda fokus menikmati panen telur segar, kami menjaga sistem pendukungnya."
  },
  {
    num: "12",
    id: "apa-yang-didapatkan",
    category: "PAKET LENGKAP",
    title: "APA YANG ANDA DAPATKAN?",
    mainMessage: "Kandang premium + 12 ayam ±16 minggu + pakan awal + vitamin + garansi + edukasi + pendampingan + Farm Hub/Farm ID.",
    camProgress: 1.5,
    bulletPoints: [
      "Kandang Galvanis Premium: Kawat galvanis tahan karat 2 tingkat dengan roll-out telur otomatis.",
      "12 Ekor Ayam Pullet Siap Telur: Umur ±16 minggu, bebas penyakit dan vaksinasi lengkap.",
      "Paket Pakan Awal & Vitamin: Nutrisi pelet berprotein tinggi + probiotik alami pengurai aroma.",
      "Sistem Minum Otomatis: Pipa PVC, nipel drinker antikarat, dan tandon air higienis.",
      "Akses Seumur Hidup Farm Hub & Farm ID: Aplikasi monitoring digital dan sertifikat kemitraan.",
      "Garansi Kematian Awal & Pendampingan Penuh: Garansi penggantian ayam jika sakit pada masa adaptasi."
    ],
    stats: [
      { label: "Spesifikasi Kandang", value: "Premium Galvanis", note: "Tahan cuaca & higienis" },
      { label: "Garansi Adaptasi", value: "100% Proteksi", note: "Penggantian pullet di masa awal" }
    ]
  },
  {
    num: "13",
    id: "berapa-yang-dihasilkan",
    category: "ANALISIS EKONOMI",
    title: "BERAPA YANG BISA DIHASILKAN?",
    mainMessage: "±11 telur/hari → ±330/bulan → ±20,6 kg/bulan → nilai kotor ±Rp495 ribu/bulan pada asumsi Rp24 ribu/kg.",
    camProgress: 2.2,
    bulletPoints: [
      "Produksi Harian: Rata-rata 11 butir telur segar per hari.",
      "Produksi Bulanan: ±330 butir telur per bulan.",
      "Konversi Bobot: ±20,6 kg telur ayam berkualitas super per bulan.",
      "Nilai Kotor Bulanan: ±Rp 495.000/bulan (asumsi harga telur curah Rp 24.000/kg).",
      "Nilai Lebih Telur Segar Sehat: Nilai mencapai Rp 600.000 - Rp 750.000 jika dijual sebagai telur segar bebas antibiotik ke komunitas sekitar."
    ],
    stats: [
      { label: "Panen Harian", value: "±11 Butir", note: "Segar setiap pagi" },
      { label: "Panen Bulanan", value: "±20,6 kg", note: "±330 butir total" },
      { label: "Nilai Kotor", value: "±Rp 495.000", note: "Pada asumsi Rp24rb/kg" }
    ],
    highlight: "Penghematan langsung belanja dapur + potensi pemasukan tambahan dari surplus panen telur."
  },
  {
    num: "14",
    id: "bukan-hanya-dijual",
    category: "PEMANFAATAN",
    title: "TELUR BUKAN HANYA UNTUK DIJUAL",
    mainMessage: "Konsumsi keluarga → mengurangi belanja. Surplus → bisa dijual. Produksi bersama → membentuk suplai lokal.",
    camProgress: 2.6,
    bulletPoints: [
      "1. Konsumsi Keluarga: Memenuhi kebutuhan protein harian anak & keluarga, memotong biaya belanja dapur.",
      "2. Surplus Bernilai Jual: Sisa telur dapat dijual ke tetangga, kerabat, atau rekan kerja dengan harga premium.",
      "3. Produksi Bersama (Komunal): Mengumpulkan surplus dari klaster RT untuk menyuplai warung, toko kelontong, atau katering lokal.",
      "4. Berbagi & Kepedulian Sosial: Menjadi sumber bantuan pangan berkualitas bagi warga yang membutuhkan di sekitar."
    ],
    stats: [
      { label: "Fase 1", value: "Konsumsi Dapur", note: "Kurangi belanja pangan keluarga" },
      { label: "Fase 2", value: "Penjualan Surplus", note: "Tambahan penghasilan tunai" },
      { label: "Fase 3", value: "Suplai Komunitas", note: "Ekosistem pasar lokal terpadu" }
    ]
  },
  {
    num: "15",
    id: "dukungan-pemerintah-csr",
    category: "SINERGI & KEMITRAAN",
    title: "PELUANG DUKUNGAN PEMERINTAH & CSR",
    mainMessage: "Hubungkan dengan ketahanan pangan, pemberdayaan masyarakat, ekonomi produktif dan CSR. Hindari janji pasti memperoleh bantuan.",
    camProgress: 4.8,
    bulletPoints: [
      "Sinergi Program Ketahanan Pangan Desa: Model ideal untuk alokasi dana desa program ketahanan pangan hewani.",
      "Pemberdayaan Ekonomi Produktif: Program padat karya mikro bagi kelompok wanita tani (KWT), PKK, atau karang taruna.",
      "Program CSR Perusahaan: Peluang kolaborasi program keberlanjutan (ESG) korporasi dalam penanggulangan stunting.",
      "Model Transparan & Terukur: Pencatatan Farm Hub memberikan data akurat bagi laporan evaluasi program instansi."
    ],
    highlight: "Catatan: Peluang kemitraan strategis terbuka luas berbasis program ketahanan pangan masyarakat dan CSR, dijalankan sesuai prosedur pengajuan resmi tiap institusi.",
    stats: [
      { label: "Fokus Program", value: "Stunting & Gizi", note: "Penyediaan protein hewani murah" },
      { label: "Target Sasaran", value: "PKK & KWT", note: "Kelompok binaan desa" }
    ]
  },
  {
    num: "16",
    id: "kenapa-tidak-sendiri",
    category: "KOMPARASI",
    title: "KENAPA TIDAK TERNAK SENDIRI SAJA?",
    mainMessage: "Perbandingan “sendiri” vs “bersama Eggnest”. Pembeda Eggnest adalah sistem, standardisasi, pendampingan, data dan ekosistem.",
    camProgress: 3.6,
    comparison: {
      alone: [
        "Beli bibit sembarangan tanpa riwayat vaksin jelas",
        "Kandang rakitan rentan bau, cepat berkarat, dan kotor",
        "Kematian ayam tinggi karena minim pengetahuan teknis",
        "Bingung cari formula pakan yang pas dan konsisten",
        "Tidak ada dokter hewan pendamping jika ayam sakit",
        "Pencatatan manual mudah hilang dan tanpa analisis"
      ],
      withEggnest: [
        "Bibit pullet terseleksi ±16 minggu bersertifikasi vaksin lengkap",
        "Kandang galvanis terstandar nirbau dengan sistem roll-out otomatis",
        "Garansi awal adaptasi dan panduan SOP perawatan ramah pemula",
        "Pakan formula khusus berprotein tinggi dikirim berkala",
        "Akses konsultasi langsung dengan dokter hewan & tim ahli",
        "Aplikasi Eggnest Farm Hub untuk monitoring produksi dan data akurat"
      ]
    },
    highlight: "Pembeda utama Eggnest bukan sekadar fisik kandang, melainkan SISTEM, STANDARISASI, PENDAMPINGAN AHLI, dan EKOSISTEM DIGITAL."
  },
  {
    num: "17",
    id: "cara-bergabung",
    category: "ALUR KERJA SAMA",
    title: "CARA BERGABUNG",
    mainMessage: "Daftar → verifikasi → aktivasi Farm ID → kandang & ayam → pendampingan → produksi → laporan Farm Hub.",
    camProgress: 4.2,
    steps: [
      { step: "01", title: "Pendaftaran", desc: "Isi formulir pendaftaran program melalui web atau WhatsApp resmi." },
      { step: "02", title: "Verifikasi Lokasi", desc: "Konsultasi kesiapan area halaman rumah (minimal 1.5 × 1.2 meter)." },
      { step: "03", title: "Aktivasi Farm ID", desc: "Penerbitan nomor identitas resmi kandang dan akun Eggnest Farm Hub." },
      { step: "04", title: "Pengiriman & Instalasi", desc: "Kandang premium galvanis dan 12 ayam pullet tiba di lokasi Anda." },
      { step: "05", title: "Pendampingan Awal", desc: "Bimbingan masa adaptasi dan pemberian pakan serta vitamin pertama." },
      { step: "06", title: "Panen Produksi", desc: "Ayam mulai bertelur setiap hari, nikmati telur segar perdana." },
      { step: "07", title: "Laporan & Evaluasi", desc: "Input panen harian di aplikasi Farm Hub untuk pantauan kesehatan rutin." }
    ]
  },
  {
    num: "18",
    id: "closing-impact",
    category: "VISI & DAMPAK",
    title: "CLOSING IMPACT — DARI 12 EKOR, KITA MULAI PERUBAHAN",
    mainMessage: "Tutup dengan visi besar, bukan jualan paket.",
    camProgress: 5.0,
    bulletPoints: [
      "Ketahanan pangan bangsa tidak dibangun dari slogan, melainkan dari piring makan di setiap rumah.",
      "12 ekor ayam di halaman Anda adalah langkah awal menuju kemandirian energi dan nutrisi keluarga.",
      "Ketika ribuan rumah tangga bergandengan tangan, Indonesia menjadi tangguh, berdaulat, dan swasembada.",
      "Mari ambil bagian dalam Gerakan 1 Rumah 1 Kandang bersama Eggnest Home Farm."
    ],
    quote: "Dari 12 ekor ayam, dari satu petak halaman rumah, kita nyalakan lentera ketahanan pangan Indonesia.",
    highlight: "1 RUMAH • 1 KANDANG • UNTUK KETAHANAN PANGAN INDONESIA"
  }
];
