import {
  User,
  Farm,
  DailyReport,
  SupportTicket,
  SupportMessage,
  AcademyContent,
  AdminAlert,
  SystemSettings,
  AdminLog,
  ChickenCondition,
  IssueType,
  SupportCategory,
  Chicken,
  ChickenHealthReport,
} from '../types';

const TOKEN_KEY = 'eggnest_auth_token_v2';
const USER_KEY = 'eggnest_auth_user_v2';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredUser(): User | null {
  const saved = localStorage.getItem(USER_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user: User | null): void {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // 1. Auth
  async register(params: {
    fullName: string;
    phone: string;
    password?: string;
    farmCode: string;
  }): Promise<{ success: boolean; message: string; user: User; farm: Farm; token: string }> {
    const res = await request<{
      success: boolean;
      message: string;
      user: User;
      farm: Farm;
      token: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    setStoredToken(res.token);
    setStoredUser(res.user);
    return res;
  },

  async login(params: {
    role: 'member' | 'admin';
    phone?: string;
    identifier?: string;
    password?: string;
  }): Promise<{ success: boolean; message: string; user: User; farm?: Farm; token: string }> {
    const res = await request<{
      success: boolean;
      message: string;
      user: User;
      farm?: Farm;
      token: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    setStoredToken(res.token);
    setStoredUser(res.user);
    return res;
  },

  async getMe(): Promise<{ success: boolean; user: User; farm?: Farm }> {
    return request<{ success: boolean; user: User; farm?: Farm }>('/auth/me');
  },

  async impersonate(params: { farmId?: string; targetUserId?: string }): Promise<{
    success: boolean;
    message: string;
    user: User;
    farm?: Farm;
    token: string;
  }> {
    const res = await request<{
      success: boolean;
      message: string;
      user: User;
      farm?: Farm;
      token: string;
    }>('/auth/impersonate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    setStoredToken(res.token);
    setStoredUser(res.user);
    return res;
  },

  logout(): void {
    setStoredToken(null);
    setStoredUser(null);
  },

  // 2. Farms
  async getFarms(): Promise<{ success: boolean; farms: Farm[] }> {
    const res = await request<{ success: boolean; farms: any[] }>('/farms');
    const normalized = res.farms.map((f) => ({
      id: f.id,
      farmCode: f.farm_code || f.farmCode,
      userId: f.user_id || f.userId,
      ownerName: f.owner_name || f.ownerName,
      phone: f.phone,
      location: f.location,
      purchaseDate: f.purchase_date || f.purchaseDate,
      activationDate: f.activation_date || f.activationDate,
      initialChickens: f.initial_chickens || f.initialChickens || 12,
      activeChickens: f.active_chickens || f.activeChickens || 12,
      chickenBreed: f.chicken_breed || f.chickenBreed,
      initialAgeWeeks: f.initial_age_weeks || f.initialAgeWeeks || 18,
      currentAgeWeeks: f.current_age_weeks || f.currentAgeWeeks || 18,
      warrantyEnd: f.warranty_end || f.warrantyEnd,
      status: f.status,
      photoUrl: f.photo_url || f.photoUrl,
      createdAt: f.created_at || f.createdAt,
      updatedAt: f.updated_at || f.updatedAt,
    }));
    return { success: true, farms: normalized };
  },

  async createFarm(farmData: Partial<Farm>): Promise<{ success: boolean; farm: Farm }> {
    return request<{ success: boolean; farm: Farm }>('/farms', {
      method: 'POST',
      body: JSON.stringify(farmData),
    });
  },

  async updateFarm(farmId: string, farmData: Partial<Farm>): Promise<{ success: boolean; farm: Farm }> {
    return request<{ success: boolean; farm: Farm }>(`/farms/${farmId}`, {
      method: 'PUT',
      body: JSON.stringify(farmData),
    });
  },

  // 3. Daily Reports
  async getReports(farmId?: string, month?: string): Promise<{ success: boolean; reports: DailyReport[] }> {
    const params = new URLSearchParams();
    if (farmId) params.append('farmId', farmId);
    if (month) params.append('month', month);
    const query = params.toString() ? `?${params.toString()}` : '';

    const res = await request<{ success: boolean; reports: any[] }>(`/reports${query}`);
    const normalized = res.reports.map((r) => {
      let parsedIssues: IssueType[] = [];
      if (r.issue_types) {
        try {
          parsedIssues = typeof r.issue_types === 'string' ? JSON.parse(r.issue_types) : r.issue_types;
        } catch (e) {
          parsedIssues = [];
        }
      }
      return {
        id: r.id,
        farmId: r.farm_id || r.farmId,
        date: r.date,
        eggCount: r.egg_count !== undefined ? r.egg_count : r.eggCount,
        feedKg: r.feed_kg !== undefined ? r.feed_kg : r.feedKg,
        chickenCondition: r.chicken_condition || r.chickenCondition,
        issueTypes: parsedIssues,
        notes: r.notes,
        photoUrl: r.photo_url || r.photoUrl,
        videoUrl: r.video_url || r.videoUrl,
        productivityRate: r.productivity_rate !== undefined ? r.productivity_rate : r.productivityRate,
        createdAt: r.created_at || r.createdAt,
        updatedAt: r.updated_at || r.updatedAt,
        chickenReports: r.chickenReports,
      };
    });
    return { success: true, reports: normalized };
  },

  async saveReport(data: {
    farmId: string;
    date: string;
    eggCount: number;
    feedKg: number;
    chickenCondition: ChickenCondition;
    issueTypes?: IssueType[];
    notes?: string;
    photoUrl?: string;
    videoUrl?: string;
    chickenReports?: {
      chickenId?: string;
      chickenNumber?: number;
      condition: 'HEALTHY' | 'SICK' | 'DEAD';
      problemTypes?: string[];
      customNotes?: string;
    }[];
  }): Promise<{ success: boolean; message: string; report: DailyReport; productivity: number }> {
    return request<{ success: boolean; message: string; report: DailyReport; productivity: number }>(
      '/reports',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  // 3B. Chickens Management
  async getChickens(farmId: string): Promise<{ success: boolean; chickens: Chicken[] }> {
    return request<{ success: boolean; chickens: Chicken[] }>(`/farms/${farmId}/chickens`);
  },

  async getChickenDetail(chickenId: string): Promise<{
    success: boolean;
    chicken: Chicken;
    timeline: any[];
    lineage: { replacementOf: any; replacedBy: any };
  }> {
    return request<{
      success: boolean;
      chicken: Chicken;
      timeline: any[];
      lineage: { replacementOf: any; replacedBy: any };
    }>(`/chickens/${chickenId}`);
  },

  async replaceChicken(
    chickenId: string,
    data: { notes?: string; ageWeeks?: number }
  ): Promise<{ success: boolean; message: string; chicken: Chicken }> {
    return request<{ success: boolean; message: string; chicken: Chicken }>(
      `/chickens/${chickenId}/replace`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  // 4. Support Tickets
  async getTickets(farmId?: string): Promise<{ success: boolean; tickets: SupportTicket[] }> {
    const query = farmId ? `?farmId=${farmId}` : '';
    const res = await request<{ success: boolean; tickets: any[] }>(`/tickets${query}`);
    const normalized = res.tickets.map((t) => ({
      id: t.id,
      ticketCode: t.ticket_code || t.ticketCode,
      farmId: t.farm_id || t.farmId,
      farmCode: t.farm_code || t.farmCode,
      userId: t.user_id || t.userId,
      ownerName: t.owner_name || t.ownerName,
      category: t.category,
      title: t.title,
      description: t.description,
      eggCountToday: t.egg_count_today !== undefined ? t.egg_count_today : t.eggCountToday,
      photoUrl: t.photo_url || t.photoUrl,
      videoUrl: t.video_url || t.videoUrl,
      status: t.status,
      adminNotes: t.admin_notes || t.adminNotes,
      messages: (t.messages || []).map((m: any) => ({
        id: m.id,
        ticketId: m.ticket_id || m.ticketId,
        senderId: m.sender_id || m.senderId,
        senderName: m.sender_name || m.senderName,
        senderRole: m.sender_role || m.senderRole,
        message: m.message,
        attachmentUrl: m.attachment_url || m.attachmentUrl,
        createdAt: m.created_at || m.createdAt,
      })),
      createdAt: t.created_at || t.createdAt,
      updatedAt: t.updated_at || t.updatedAt,
    }));
    return { success: true, tickets: normalized };
  },

  async createTicket(data: {
    category: SupportCategory;
    title: string;
    description: string;
    eggCountToday?: number;
    photoUrl?: string;
    videoUrl?: string;
  }): Promise<{ success: boolean; message: string; ticket: SupportTicket }> {
    return request<{ success: boolean; message: string; ticket: SupportTicket }>('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async replyTicket(ticketId: string, message: string, attachmentUrl?: string): Promise<{
    success: boolean;
    messages: SupportMessage[];
    ticketStatus: SupportTicket['status'];
  }> {
    return request<{ success: boolean; messages: SupportMessage[]; ticketStatus: SupportTicket['status'] }>(
      `/tickets/${ticketId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ message, attachmentUrl }),
      }
    );
  },

  async updateTicketStatus(
    ticketId: string,
    status: SupportTicket['status'],
    adminNotes?: string
  ): Promise<{ success: boolean; ticket: SupportTicket }> {
    return request<{ success: boolean; ticket: SupportTicket }>(`/tickets/${ticketId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNotes }),
    });
  },

  // 5. Academy CMS
  async getAcademy(): Promise<{ success: boolean; contents: AcademyContent[] }> {
    const res = await request<{ success: boolean; contents: any[] }>('/academy');
    const normalized = res.contents.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      description: c.description,
      content: c.content,
      type: c.type,
      videoUrl: c.video_url || c.videoUrl,
      duration: c.duration,
      thumbnail: c.thumbnail,
      readTime: c.read_time || c.readTime,
      published: c.published === 1 || c.published === true,
      isRecommended: c.is_recommended === 1 || c.isRecommended === true,
      createdAt: c.created_at || c.createdAt,
      updatedAt: c.updated_at || c.updatedAt,
    }));
    return { success: true, contents: normalized };
  },

  async createAcademy(data: Partial<AcademyContent>): Promise<{ success: boolean; content: AcademyContent }> {
    return request<{ success: boolean; content: AcademyContent }>('/academy', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAcademy(id: string, data: Partial<AcademyContent>): Promise<{ success: boolean; content: AcademyContent }> {
    return request<{ success: boolean; content: AcademyContent }>(`/academy/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async togglePublishAcademy(id: string): Promise<{ success: boolean; published: boolean }> {
    return request<{ success: boolean; published: boolean }>(`/academy/${id}/publish`, {
      method: 'PATCH',
    });
  },

  async deleteAcademy(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/academy/${id}`, {
      method: 'DELETE',
    });
  },

  // 6. Smart Alerts
  async getAlerts(): Promise<{ success: boolean; alerts: AdminAlert[] }> {
    const res = await request<{ success: boolean; alerts: any[] }>('/alerts');
    const normalized = res.alerts.map((a) => ({
      id: a.id,
      farmCode: a.farm_code || a.farmCode,
      farmId: a.farm_id || a.farmId,
      ownerName: a.owner_name || a.ownerName,
      type: a.type,
      severity: a.severity,
      title: a.title,
      description: a.description,
      dataSummary: a.data_summary || a.dataSummary,
      actionText: a.action_text || a.actionText,
      resolved: a.resolved === 1 || a.resolved === true,
      status: a.status || (a.resolved ? 'resolved' : 'active'),
      createdAt: a.created_at || a.createdAt,
      resolvedAt: a.resolved_at || a.resolvedAt,
    }));
    return { success: true, alerts: normalized };
  },

  async resolveAlert(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/alerts/${id}/resolve`, {
      method: 'PATCH',
    });
  },

  // 7. System Settings
  async getSettings(): Promise<{ success: boolean; settings: SystemSettings }> {
    const res = await request<{ success: boolean; settings: any }>('/settings');
    const s = res.settings;
    return {
      success: true,
      settings: {
        eggPricePerKg: s.egg_price_per_kg ?? s.eggPricePerKg ?? 32000,
        eggsPerKg: s.eggs_per_kg ?? s.eggsPerKg ?? 16,
        warningDropThreshold: s.warning_drop_threshold ?? s.warningDropThreshold ?? 15,
        criticalDropThreshold: s.critical_drop_threshold ?? s.criticalDropThreshold ?? 30,
        warningMissedReportDays: s.warning_missed_report_days ?? s.warningMissedReportDays ?? 3,
        criticalMissedReportDays: s.critical_missed_report_days ?? s.criticalMissedReportDays ?? 4,
        whatsappSupportNumber: s.whatsapp_support_number ?? s.whatsappSupportNumber ?? '0812-8899-7700',
        companyName: s.company_name ?? s.companyName ?? 'Eggnest Indonesia',
        companyAddress: s.company_address ?? s.companyAddress ?? 'Jakarta, Indonesia',
      },
    };
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<{ success: boolean; settings: SystemSettings }> {
    return request<{ success: boolean; settings: SystemSettings }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // 8. Upload File
  async uploadImage(dataUrl: string, filename?: string): Promise<{ success: boolean; url: string }> {
    return request<{ success: boolean; url: string }>('/upload', {
      method: 'POST',
      body: JSON.stringify({ dataUrl, filename }),
    });
  },

  // 9. Admin Logs & Database Seed
  async getAdminLogs(): Promise<{ success: boolean; logs: AdminLog[] }> {
    const res = await request<{ success: boolean; logs: any[] }>('/admin/logs');
    const normalized = res.logs.map((l) => ({
      id: l.id,
      adminName: l.admin_name || l.adminName,
      action: l.action,
      target: l.target,
      timestamp: l.timestamp,
    }));
    return { success: true, logs: normalized };
  },

  async resetCleanDatabase(): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/admin/reset-db', {
      method: 'POST',
    });
  },

  async seedDemoDatabase(): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/admin/seed-demo', {
      method: 'POST',
    });
  },
};
