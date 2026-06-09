import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || body.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const queryKeys = {
  agents: {
    all: ['agents'] as const,
    detail: (id: string) => ['agents', id] as const,
    models: ['agents', 'models'] as const,
  },
  conversations: {
    all: ['conversations'] as const,
    detail: (id: string) => ['conversations', id] as const,
  },
  billing: {
    info: ['billing'] as const,
    transactions: ['billing', 'transactions'] as const,
  },
  workspace: {
    settings: ['workspace', 'settings'] as const,
  },
  analytics: {
    summary: ['analytics', 'summary'] as const,
    agents: (id: string) => ['analytics', 'agents', id] as const,
  },
  admin: {
    users: ['admin', 'users'] as const,
    metrics: ['admin', 'metrics'] as const,
  },
};

export function useAgents() {
  return useQuery({
    queryKey: queryKeys.agents.all,
    queryFn: () => apiFetch<Array<Record<string, unknown>>>('/api/agents'),
  });
}

export function useAgent(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.agents.detail(id!),
    queryFn: () => apiFetch<Record<string, unknown>>(`/api/agents/${id}`),
    enabled: !!id,
  });
}

export function useAgentModels() {
  return useQuery({
    queryKey: queryKeys.agents.models,
    queryFn: () => apiFetch<Array<Record<string, unknown>>>('/api/agents/models'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<Record<string, unknown>>('/api/agents', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents.all });
    },
  });
}

export function useUpdateAgent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<Record<string, unknown>>(`/api/agents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents.all });
      qc.invalidateQueries({ queryKey: queryKeys.agents.detail(id) });
    },
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/agents/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents.all });
    },
  });
}

export function useBillingInfo() {
  return useQuery({
    queryKey: queryKeys.billing.info,
    queryFn: () => apiFetch<Record<string, unknown>>('/api/billing/info'),
  });
}

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: queryKeys.analytics.summary,
    queryFn: () => apiFetch<Record<string, unknown>>('/api/analytics/summary'),
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: () => apiFetch<Array<Record<string, unknown>>>('/api/admin/users'),
  });
}
