import { Item, MatchCandidate, Claim, NotificationItem, CommunityStory, DashboardSummary } from '../types';

const API_BASE = '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('traceback_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Items
  getItems: (params: Record<string, string | number | boolean | undefined> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, String(v));
    });
    return request<{ items: Item[]; total: number; page: number; pageSize: number; totalPages: number }>(`/items?${query.toString()}`);
  },

  getItem: (id: string) => request<{ item: Item }>(`/items/${id}`),

  createItem: (data: Partial<Item>) => request<{ item: Item; matchFound: boolean; message: string }>('/items', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateItem: (id: string, updates: Partial<Item>) => request<{ item: Item }>(`/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),

  deleteItem: (id: string) => request<{ message: string }>(`/items/${id}`, {
    method: 'DELETE',
  }),

  // Matches
  getMatches: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params);
    return request<{ matches: MatchCandidate[]; total: number }>(`/matches?${query.toString()}`);
  },

  getMatch: (id: string) => request<{ match: MatchCandidate; lostItem: Item; foundItem: Item }>(`/matches/${id}`),

  explainMatch: (lostId: string, foundId: string) => request<{ explanation: string }>('/ai/explain-match', {
    method: 'POST',
    body: JSON.stringify({ lostId, foundId }),
  }),

  // AI Description Extraction
  analyzeDescription: (text: string) => request<{
    analysis: {
      title: string;
      category: string;
      subcategory: string;
      brand: string;
      color: string;
      distinguishingFeatures: string[];
      keywords: string[];
      suggestedVerificationQuestions: string[];
      confidence: number;
    };
  }>('/ai/analyze-description', {
    method: 'POST',
    body: JSON.stringify({ text }),
  }),

  // Claims
  createClaim: (data: {
    foundItemId: string;
    lostItemId?: string;
    answers: { question: string; answer: string }[];
    privateProofDescription: string;
    proofDocumentUrl?: string;
  }) => request<{ claim: Claim; message: string }>('/claims', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getMyClaims: () => request<{ claims: Claim[] }>('/claims/my'),

  getIncomingClaims: () => request<{ claims: Claim[] }>('/claims/incoming'),

  getClaim: (id: string) => request<{ claim: Claim; foundItem: Item | null }>(`/claims/${id}`),

  reviewClaim: (id: string, data: { status: string; reviewNotes?: string; safeLocation?: string; scheduledTime?: string }) =>
    request<{ claim: Claim }>(`/claims/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  confirmHandover: (id: string, verificationCode?: string) =>
    request<{ claim: Claim; bothConfirmed: boolean; message: string }>(`/claims/${id}/confirm-handover`, {
      method: 'POST',
      body: JSON.stringify({ verificationCode }),
    }),

  // Dashboard
  getDashboardSummary: () => request<DashboardSummary>('/dashboard/summary'),

  // Notifications
  getNotifications: () => request<{ notifications: NotificationItem[] }>('/notifications'),

  markNotificationRead: (id: string) => request<{ notification: NotificationItem }>(`/notifications/${id}/read`, {
    method: 'PATCH',
  }),

  markAllNotificationsRead: () => request<{ message: string; count: number }>('/notifications/read-all', {
    method: 'POST',
  }),

  // Community Stories
  getCommunityStories: () => request<{ stories: CommunityStory[] }>('/community/stories'),

  // Admin
  getAuditLogs: () => request<{ logs: any[] }>('/admin/audit-logs'),

  getSeedStatus: () => request<{
    isSeeded: boolean;
    totalItems: number;
    demoItemsTotal: number;
    lostDemoCount: number;
    foundDemoCount: number;
    realUserItems: number;
  }>('/admin/seed-status'),

  resetDemoData: () => request<{ message: string; totalItems: number; demoItems: number }>('/admin/reset-demo', {
    method: 'POST',
  }),

  getDatabaseStatus: () => request<{
    connected: boolean;
    provider: string;
    uriRedacted: string;
    hasMongoUri: boolean;
    totalItems: number;
    status: string;
  }>('/database/status'),
};
