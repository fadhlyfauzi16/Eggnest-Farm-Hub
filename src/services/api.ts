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
  async login(params: { role: 'member' | 'admin'; phone?: string; identifier?: string; password?: string }) {
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
    eggCount: number;
    feedKg: number;
    chickenCondition: ChickenCondition;
    issueTypes?: IssueType[];
    notes?: string;
    photoUrl?: string;
    videoUrl?: string;
  }) {
    return request<{ success: boolean; message: string; productivity: number; fcr?: number }>(
      '/reports',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
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
    ownerName?: string;
    phone?: string;
    location?: string;
    initialChickens?: number;
    chickenBreed?: string;
    initialAgeWeeks?: number;
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

  // Support Tickets
  async getTickets() {
    return request<{ success: boolean; tickets: SupportTicket[] }>('/tickets');
  },

  async createTicket(data: {
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
  async downloadExportExcel(type: 'members' | 'farms' | 'chickens' | 'reports' | 'scores' | 'tickets') {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/admin/export/${type}`, {
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
