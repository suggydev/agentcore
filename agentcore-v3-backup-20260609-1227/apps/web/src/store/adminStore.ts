'use client';

import { create } from 'zustand';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1] || null;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  if (!token) throw new Error('Unauthorized');
  const res = await fetch(`${API_BASE}/api/admin${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  workspace?: { id: string; name: string; plan: string | null };
}

export interface AdminWorkspace {
  id: string;
  name: string;
  plan: string | null;
  createdAt: string;
  users: { id: string; name: string; email: string; role: string }[];
  _count: { agents: number; conversations: number; crmContacts: number; knowledgeDocs: number };
}

export interface AdminAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  resolved: boolean;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  entityType: string | null;
  entityId: string | null;
}

export interface DashboardKPIs {
  totalUsers: number;
  activeUsersToday: number;
  totalWorkspaces: number;
  totalRevenue: number;
  totalMessages: number;
  totalAgents: number;
  unresolvedAlerts: number;
  systemHealth: {
    cpuUsage: number;
    ramUsage: number;
    dbConnections: number;
    diskUsage: number;
    uptime: number;
  } | null;
}

export interface AnalyticsTrend {
  date: string;
  count?: number;
  dau?: number;
  sessions?: number;
  amount?: number;
}

export interface ModelUsage {
  model: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  avgLatency: number;
  count: number;
}

export interface BillingTransaction {
  id: string;
  type: string;
  status: string;
  amount: number;
  createdAt: string;
  workspace?: { id: string; name: string };
}

export interface SystemHealth {
  dbStatus: 'ok' | 'error';
  apiUptime: number;
  lastErrors: { id: string; message: string; createdAt: string }[];
  metrics: {
    cpuUsage: number;
    ramUsage: number;
    dbConnections: number;
    diskUsage: number;
    uptime: number;
  } | null;
}

export interface SystemConfig {
  PORT: number;
  NODE_ENV: string;
  CORS_ORIGINS: string[];
  CLIENT_URL: string;
  SUGGY_BASE_URL: string;
  MODEL_CACHE_TTL: number;
  TRIAL_DAYS: number;
  TRIAL_CREDIT_AMOUNT: number;
  PRO_CREDIT_AMOUNT: number;
  BUSINESS_CREDIT_AMOUNT: number;
}

export interface AdminState {
  users: AdminUser[];
  workspaces: AdminWorkspace[];
  alerts: AdminAlert[];
  dashboardKPIs: DashboardKPIs | null;
  analyticsSignups: AnalyticsTrend[];
  analyticsActivity: AnalyticsTrend[];
  analyticsRevenue: AnalyticsTrend[];
  analyticsModels: ModelUsage[];
  billingTransactions: BillingTransaction[];
  systemHealth: SystemHealth | null;
  systemConfig: SystemConfig | null;
  isLoading: boolean;
  error: string | null;
  dateRange: { start: string; end: string; days: number };

  setDateRange: (range: { start: string; end: string; days: number }) => void;
  fetchDashboard: () => Promise<void>;
  fetchUsers: (params?: { search?: string; role?: string; page?: number; limit?: number }) => Promise<void>;
  fetchWorkspaces: (params?: { search?: string; plan?: string; page?: number; limit?: number }) => Promise<void>;
  fetchAnalytics: (days?: number) => Promise<void>;
  fetchBillingTransactions: (params?: { status?: string; type?: string; page?: number; limit?: number }) => Promise<void>;
  fetchSystemHealth: () => Promise<void>;
  fetchSystemConfig: () => Promise<void>;
  fetchAlerts: (params?: { type?: string; resolved?: boolean; page?: number; limit?: number }) => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateUserRole: (id: string, role: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  clearError: () => void;
}

function defaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    days: 30,
  };
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  workspaces: [],
  alerts: [],
  dashboardKPIs: null,
  analyticsSignups: [],
  analyticsActivity: [],
  analyticsRevenue: [],
  analyticsModels: [],
  billingTransactions: [],
  systemHealth: null,
  systemConfig: null,
  isLoading: false,
  error: null,
  dateRange: defaultDateRange(),

  setDateRange: (range) => set({ dateRange: range }),
  clearError: () => set({ error: null }),

  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiFetch<DashboardKPIs>('/dashboard');
      set({ dashboardKPIs: data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load dashboard', isLoading: false });
    }
  },

  fetchUsers: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.set('search', params.search);
      if (params.role) searchParams.set('role', params.role);
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      const res = await apiFetch<{ data: AdminUser[]; total: number; page: number; limit: number }>(`/users?${searchParams.toString()}`);
      set({ users: res.data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load users', isLoading: false });
    }
  },

  fetchWorkspaces: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.set('search', params.search);
      if (params.plan) searchParams.set('plan', params.plan);
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      const res = await apiFetch<{ data: AdminWorkspace[]; total: number; page: number; limit: number }>(`/workspaces?${searchParams.toString()}`);
      set({ workspaces: res.data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load workspaces', isLoading: false });
    }
  },

  fetchAnalytics: async (days = 30) => {
    set({ isLoading: true, error: null });
    try {
      const [signups, activity, revenue, models] = await Promise.all([
        apiFetch<{ data: AnalyticsTrend[] }>(`/analytics/signups?days=${days}`).then((r) => r.data),
        apiFetch<{ data: AnalyticsTrend[] }>(`/analytics/activity?days=${days}`).then((r) => r.data),
        apiFetch<{ data: AnalyticsTrend[] }>(`/analytics/revenue?days=${days}`).then((r) => r.data),
        apiFetch<{ data: ModelUsage[] }>(`/analytics/models?days=${days}`).then((r) => r.data),
      ]);
      set({
        analyticsSignups: signups,
        analyticsActivity: activity,
        analyticsRevenue: revenue,
        analyticsModels: models,
        isLoading: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load analytics', isLoading: false });
    }
  },

  fetchBillingTransactions: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.set('status', params.status);
      if (params.type) searchParams.set('type', params.type);
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      const res = await apiFetch<{ data: BillingTransaction[]; total: number; page: number; limit: number }>(`/billing/transactions?${searchParams.toString()}`);
      set({ billingTransactions: res.data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load transactions', isLoading: false });
    }
  },

  fetchSystemHealth: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiFetch<SystemHealth>('/system/health');
      set({ systemHealth: data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load system health', isLoading: false });
    }
  },

  fetchSystemConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiFetch<SystemConfig>('/system/config');
      set({ systemConfig: data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load system config', isLoading: false });
    }
  },

  fetchAlerts: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const searchParams = new URLSearchParams();
      if (params.type) searchParams.set('type', params.type);
      if (params.resolved !== undefined) searchParams.set('resolved', String(params.resolved));
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      const res = await apiFetch<{ data: AdminAlert[]; total: number; page: number; limit: number }>(`/alerts?${searchParams.toString()}`);
      set({ alerts: res.data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load alerts', isLoading: false });
    }
  },

  resolveAlert: async (id) => {
    try {
      await apiFetch(`/alerts/${id}/resolve`, { method: 'POST' });
      const { alerts } = get();
      set({
        alerts: alerts.map((a) =>
          a.id === id ? { ...a, resolved: true, resolvedAt: new Date().toISOString(), resolvedBy: null } : a
        ),
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to resolve alert' });
    }
  },

  deleteUser: async (id) => {
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });
      set({ users: get().users.filter((u) => u.id !== id) });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete user' });
    }
  },

  updateUserRole: async (id, role) => {
    try {
      await apiFetch(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
      set({ users: get().users.map((u) => (u.id === id ? { ...u, role } : u)) });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update user role' });
    }
  },

  deleteWorkspace: async (id) => {
    try {
      await apiFetch(`/workspaces/${id}`, { method: 'DELETE' });
      set({ workspaces: get().workspaces.filter((w) => w.id !== id) });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete workspace' });
    }
  },

  deleteAlert: async (id) => {
    try {
      await apiFetch(`/alerts/${id}`, { method: 'DELETE' });
      set({ alerts: get().alerts.filter((a) => a.id !== id) });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete alert' });
    }
  },
}));
