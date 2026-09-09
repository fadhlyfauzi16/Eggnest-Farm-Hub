import {
  User,
  Farm,
  Chicken,
  DailyReport,
  SupportTicket,
  SupportMessage,
  AcademyContent,
  AdminAlert,
  SystemSettings,
  AdminLog,
  ChickenCondition,
  IssueType,
} from '../types';

const TOKEN_KEY = 'eggnest_auth_token_v2';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({ success: false, message: 'Invalid JSON response' }));

  if (!response.ok) {
    throw new Error(data.message || data.error || `HTTP error ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  async login(params: { role: 'member' | 'admin' | 'mitra'; phone?: string; identifier?: string; password?: string }) {
    const res = await request<{
      success: boolean;
      message: string;
      token: string;
      user: User;
      farm?: Farm;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    if (res.token) {
      setToken(res.token);
    }
    return res;
  },

  async register(params: { fullName: string; phone: string; password?: string; farmCode: string }) {
    const res = await request<{
      success: boolean;
      message: string;
      token: string;
      user: User;
      farm: Farm;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    if (res.token) {
      setToken(res.token);
    }
    return res;
  },

  async getMe() {
    return request<{ success: boolean; user: User; farm?: Farm }>('/auth/me');
  },

  // Dashboard & Analytics
  async getDashboard(farmId?: string) {
    const query = farmId ? `?farmId=${encodeURIComponent(farmId)}` : '';
    return request<{
      success: boolean;
      data: {
        farm: Farm;
        todayReport?: DailyReport;
        todayEggCount: number;
        todayFeedKg: number;
        monthEggCount: number;
        monthFeedKg: number;
        productivityRate: number;
        productivityStatus: 'Optimal' | 'Baik' | 'Cukup' | 'Perlu Perhatian';
        averageEggsPerDay: number;
        estimatedEggValue: number;
        fcr: number | null;
        chartData: Array<{ day: string; tanggal: string; telur: number; pakan: number; produktivitas: number }>;
        reports: DailyReport[];
        settings: SystemSettings;
      };
    }>(`/dashboard${query}`);
  },

  // Reports
  async getReports(farmId?: string) {
    const query = farmId ? `?farmId=${encodeURIComponent(farmId)}` : '';
    return request<{ success: boolean; reports: DailyReport[] }>(`/reports${query}`);
  },

  async saveDailyReport(data: {
    farmId?: string;
    date: string;
    eggCount?: number;
    feedKg: number;
    chickenCondition?: ChickenCondition;
    issueTypes?: IssueType[];
    layingChickens?: number[];
    chickenReports?: Array<{
      chickenNumber: number;
      condition: 'HEALTHY' | 'SICK' | 'DEAD';
      problemTypes?: string[];
      customNotes?: string;
    }>;
    notes?: string;
    photoUrl?: string;
    videoUrl?: string;
  }) {
    return request<{
      success: boolean;
      message: string;
      productivity: number;
      fcr?: number;
      eggCount?: number;
      layingChickens?: number[];
    }>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Mitra Pendamping & wilayah
  async getPartners() {
    return request<{ success: boolean; partners: any[] }>('/admin/partners');
  },

  async createPartner(data: any) {
    return request<{ success: boolean; message: string; partner: any }>('/admin/partners', { method: 'POST', body: JSON.stringify(data) });
  },

  async updatePartner(id: string, data: any) {
    return request<{ success: boolean; message: string; partner: any }>(`/admin/partners/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async deletePartner(id: string) {
    return request<{ success: boolean; message: string }>(`/admin/partners/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async assignFarmPartner(farmId: string, partnerId: string | null) {
    return request<{ success: boolean; message: string }>(`/admin/farms/${encodeURIComponent(farmId)}/partner`, { method: 'PATCH', body: JSON.stringify({ partnerId }) });
  },


  // Portal Mitra Pendamping
  async getMitraProfile() {
    return request<{ success: boolean; partner: any }>('/mitra/profile');
  },

  async updateMitraProfile(data: {
    address: string;
    province: string;
    regency: string;
    district: string;
    village: string;
    latitude: number;
    longitude: number;
  }) {
    return request<{ success: boolean; message: string; partner: any }>('/mitra/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getMitraDashboard() {
    return request<{ success: boolean; partner: any; summary: any; farms: Farm[] }>('/mitra/dashboard');
  },

  async updateMitraFarmProfile(farmId: string, data: {
    location: string;
    fullAddress: string;
    latitude: number;
    longitude: number;
    chickenBreed: string;
    activeChickens: number;
    currentAgeWeeks: number;
    province?: string;
    regency?: string;
    district?: string;
    village?: string;
  }) {
    return request<{ success: boolean; message: string; farm: Farm }>(
      `/mitra/farms/${encodeURIComponent(farmId)}/profile`,
      { method: 'PUT', body: JSON.stringify(data) }
    );
  },

  // GPS -> alamat otomatis
  async reverseGeocode(latitude: number, longitude: number) {
    const qs = new URLSearchParams({ lat: String(latitude), lng: String(longitude) });
    return request<{
      success: boolean;
      location: {
        fullAddress: string; province: string; regency: string; city: string; district: string; village: string;
        latitude: number; longitude: number;
      };
    }>(`/location/reverse?${qs.toString()}`);
  },

  // Farms
  async getFarms() {
    return request<{ success: boolean; farms: Farm[] }>('/farms');
  },

  // Individual Chicken Detail
  async getChickenDetail(chickenId: string) {
    return request<{
      success: boolean;
      chicken: Chicken;
      timeline: any[];
      lineage: {
        replacementOf: any | null;
        replacedBy: any | null;
      };
    }>(`/chickens/${encodeURIComponent(chickenId)}`);
  },

  async createFarm(data: {
    farmCode?: string;
    ownerName?: string;
    phone?: string;
    password?: string;
    location?: string;
    purchaseDate?: string;
    fullAddress?: string;
    latitude?: number | null;
    longitude?: number | null;
    initialChickens?: number;
    chickenBreed?: string;
    initialAgeWeeks?: number;
    province?: string; regency?: string; district?: string; village?: string; partnerId?: string | null;
  }) {
    return request<{ success: boolean; message: string; farm: Farm }>('/admin/farms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateFarm(farmId: string, data: Partial<Farm>) {
    return request<{ success: boolean; message: string; farm: Farm }>(`/admin/farms/${farmId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },


  async updateMyFarm(data: {
    location: string;
    fullAddress: string;
    latitude: number;
    longitude: number;
    chickenBreed: string;
    activeChickens: number;
    currentAgeWeeks: number;
    province?: string; regency?: string; district?: string; village?: string;
  }) {
    return request<{ success: boolean; message: string; farm: Farm }>('/farms/me/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteFarm(farmId: string, deleteMember: boolean = true) {
    return request<{ success: boolean; message: string }>(
      `/admin/farms/${encodeURIComponent(farmId)}?deleteMember=${deleteMember ? 'true' : 'false'}`,
      { method: 'DELETE' }
    );
  },

  // Dokter Hewan Siaga — Asisten Kandang 24 Jam
  async getVetAiHistory(farmId?: string) {
    const query = farmId ? `?farmId=${encodeURIComponent(farmId)}` : '';
    return request<{
      success: boolean;
      messages: Array<{
        id: string;
        role: 'user' | 'assistant';
        message: string;
        attachment_url?: string | null;
        created_at: string;
      }>;
    }>(`/vet-ai/history${query}`);
  },

  async chatVetAi(message: string, photoUrl?: string, farmId?: string) {
    return request<{
      success: boolean;
      reply: string;
      urgent?: boolean;
      message: {
        id: string;
        role: 'assistant';
        message: string;
        attachment_url?: string | null;
        created_at: string;
      };
    }>('/vet-ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, photoUrl, farmId }),
    });
  },

  async clearVetAiHistory(farmId?: string) {
    const query = farmId ? `?farmId=${encodeURIComponent(farmId)}` : '';
    return request<{ success: boolean }>(`/vet-ai/history${query}`, {
      method: 'DELETE',
    });
  },

  // Support Tickets
  async getTickets(farmId?: string) {
    const query = farmId ? `?farmId=${encodeURIComponent(farmId)}` : '';
    return request<{ success: boolean; tickets: SupportTicket[] }>(`/tickets${query}`);
  },

  async createTicket(data: {
    farmId?: string;
    category: string;
    title?: string;
    description: string;
    eggCountToday?: number;
    photoUrl?: string;
    videoUrl?: string;
  }) {
    return request<{ success: boolean; message: string; ticket: SupportTicket }>('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async replyTicket(ticketId: string, message: string, attachmentUrl?: string) {
    return request<{ success: boolean; message: string; messages: SupportMessage[] }>(
      `/tickets/${ticketId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ message, attachmentUrl }),
      }
    );
  },

  async updateTicketStatus(ticketId: string, status: string, adminNotes?: string) {
    return request<{ success: boolean; message: string }>(`/admin/tickets/${ticketId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNotes }),
    });
  },

  // Member Notification Center
  async getNotifications() {
    return request<{ success: boolean; notifications: any[] }>('/notifications');
  },

  async markNotificationRead(id: string) {
    return request<{ success: boolean }>(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
  },

  async markAllNotificationsRead() {
    return request<{ success: boolean }>('/notifications/read-all', { method: 'PATCH' });
  },

  // Academy CMS
  async getAcademy(all: boolean = false) {
    return request<{ success: boolean; contents: AcademyContent[] }>(
      `/academy${all ? '?all=true' : ''}`
    );
  },

  async createAcademy(content: Partial<AcademyContent>) {
    return request<{ success: boolean; message: string; content: AcademyContent }>(
      '/admin/academy',
      {
        method: 'POST',
        body: JSON.stringify(content),
      }
    );
  },

  async updateAcademy(id: string, content: Partial<AcademyContent>) {
    return request<{ success: boolean; message: string; content: AcademyContent }>(
      `/admin/academy/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(content),
      }
    );
  },

  async togglePublishAcademy(id: string) {
    return request<{ success: boolean; message: string; published: boolean }>(
      `/admin/academy/${id}/publish`,
      {
        method: 'PATCH',
      }
    );
  },

  async toggleRecommendAcademy(id: string) {
    return request<{ success: boolean; message: string; isRecommended: boolean }>(
      `/admin/academy/${id}/recommend`,
      {
        method: 'PATCH',
      }
    );
  },

  async deleteAcademy(id: string) {
    return request<{ success: boolean; message: string }>(`/admin/academy/${id}`, {
      method: 'DELETE',
    });
  },

  // Export & Import Excel
  async downloadExportExcel(type: 'members' | 'farms' | 'chickens' | 'reports' | 'scores' | 'tickets', filters?: { province?: string; regency?: string; district?: string; village?: string; partnerId?: string }) {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const qs = new URLSearchParams();
    if (filters) Object.entries(filters).forEach(([k,v]) => { if (v && v !== 'all') qs.set(k, v); });
    const res = await fetch(`/api/admin/export/${type}${qs.toString() ? `?${qs.toString()}` : ''}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Gagal mengunduh Excel' }));
      throw new Error(err.message || 'Gagal export data');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Eggnest-Export-${type.toUpperCase()}-${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return { success: true };
  },

  async validateImport(type: 'members' | 'farms' | 'chickens' | 'reports', rows: any[]) {
    return request<{
      success: boolean;
      totalRows: number;
      validCount: number;
      invalidCount: number;
      preview: any[];
      errors: { row: number; reason: string }[];
    }>('/admin/import/validate', {
      method: 'POST',
      body: JSON.stringify({ type, rows }),
    });
  },

  async commitImport(type: 'members' | 'farms' | 'chickens' | 'reports', validRows: any[]) {
    return request<{
      success: boolean;
      importedCount: number;
      failedCount: number;
      errors: any[];
      message: string;
    }>('/admin/import/commit', {
      method: 'POST',
      body: JSON.stringify({ type, validRows }),
    });
  },

  // Settings
  async getSettings() {
    return request<{ success: boolean; settings: SystemSettings }>('/settings');
  },

  async updateSettings(settings: Partial<SystemSettings>) {
    return request<{ success: boolean; message: string }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // Smart Alerts
  async getAlerts() {
    return request<{ success: boolean; alerts: AdminAlert[] }>('/admin/alerts');
  },

  async resolveAlert(id: string) {
    return request<{ success: boolean; message: string }>(`/admin/alerts/${id}/resolve`, {
      method: 'PATCH',
    });
  },

  // Impersonation
  async impersonate(farmId: string) {
    const res = await request<{
      success: boolean;
      message: string;
      token: string;
      user: User;
      farm: Farm;
    }>('/admin/impersonate', {
      method: 'POST',
      body: JSON.stringify({ farmId }),
    });
    if (res.token) {
      setToken(res.token);
    }
    return res;
  },

  async getAuditLogs() {
    return request<{ success: boolean; logs: AdminLog[] }>('/admin/logs');
  },

  // File Upload
  async uploadFile(file: File): Promise<{ url: string; filename: string }> {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Gagal upload file');
    }
    return data;
  },

  // Academy Media Upload
  async uploadAcademyMedia(
    file: File,
    kind: 'video' | 'thumbnail'
  ): Promise<{ success: boolean; url: string; filename: string; size: number }> {
    const token = getToken();
    const formData = new FormData();
    // Kirim field kind lebih dulu agar tersedia sebelum Multer memproses file.
    formData.append('kind', kind);
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/admin/academy/upload', {
      method: 'POST',
      headers,
      body: formData,
    });

    const rawText = await res.text();
    let data: any;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      data = {
        message:
          rawText?.slice(0, 300) ||
          `Server mengembalikan respons non-JSON (HTTP ${res.status})`,
      };
    }

    if (!res.ok) {
      throw new Error(data.message || `Gagal upload media Academy (HTTP ${res.status})`);
    }

    return data;
  },


  // Penjualan Telur — data transaksi nyata Member
  async getEggSales(params?: { month?: string; farmId?: string }) {
    const qs = new URLSearchParams();
    if (params?.month) qs.set('month', params.month);
    if (params?.farmId) qs.set('farmId', params.farmId);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request<{
      success: boolean;
      sales: Array<{
        id: string;
        farmId: string;
        farmCode?: string;
        ownerName?: string;
        saleDate: string;
        priceBasis: 'kg' | 'egg';
        eggCount: number;
        weightKg: number | null;
        unitPrice: number;
        totalAmount: number;
        buyerName?: string | null;
        notes?: string | null;
        createdAt: string;
        updatedAt: string;
      }>;
      summary: {
        transactionCount: number;
        totalEggs: number;
        totalWeightKg: number;
        totalAmount: number;
        averagePricePerKg: number;
        producedEggs: number;
        availableEggs: number;
      };
    }>(`/sales${query}`);
  },

  async createEggSale(data: {
    saleDate: string;
    priceBasis: 'kg' | 'egg';
    eggCount: number;
    weightKg?: number | null;
    unitPrice: number;
    buyerName?: string;
    notes?: string;
    farmId?: string;
  }) {
    return request<{ success: boolean; message: string; sale: any; summary: any }>('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateEggSale(id: string, data: {
    saleDate: string;
    priceBasis: 'kg' | 'egg';
    eggCount: number;
    weightKg?: number | null;
    unitPrice: number;
    buyerName?: string;
    notes?: string;
  }) {
    return request<{ success: boolean; message: string; sale: any }>(
      `/sales/${encodeURIComponent(id)}`,
      { method: 'PUT', body: JSON.stringify(data) }
    );
  },

  async deleteEggSale(id: string) {
    return request<{ success: boolean; message: string }>(
      `/sales/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    );
  },

  // Demo Controls
  async seedDemo() {
    return request<{ success: boolean; message: string }>('/admin/seed-demo', {
      method: 'POST',
    });
  },

  async resetClean() {
    return request<{ success: boolean; message: string }>('/admin/reset-clean', {
      method: 'POST',
    });
  },
};
