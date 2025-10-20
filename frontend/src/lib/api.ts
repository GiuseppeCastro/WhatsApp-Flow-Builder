import type { Flow, ValidationResult, ExecutionHistory, TriggerPayload } from '../types/schemas';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || 'Request failed');
  }

  return data.data as T;
}

export const api = {
  // Health
  health: () => fetchAPI<{ status: string }>('/health'),

  // Flows
  getAllFlows: (activeFilter?: boolean) => {
    const query = activeFilter !== undefined ? `?active=${activeFilter}` : '';
    return fetchAPI<Flow[]>(`/flows${query}`);
  },

  getFlowById: (id: string) => fetchAPI<Flow>(`/flows/${id}`),

  createFlow: (name: string) =>
    fetchAPI<Flow>('/flows', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  updateFlow: (id: string, updates: Partial<Flow>) =>
    fetchAPI<Flow>(`/flows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteFlow: (id: string) =>
    fetch(`${API_BASE}/flows/${id}`, { method: 'DELETE' }).then((res) => {
      if (!res.ok) throw new Error('Delete failed');
    }),

  validateFlow: (id: string) => fetchAPI<ValidationResult>(`/flows/${id}/validate`, { method: 'POST' }),

  activateFlow: (id: string) => fetchAPI<Flow>(`/flows/${id}/activate`, { method: 'POST' }),

  deactivateFlow: (id: string) => fetchAPI<Flow>(`/flows/${id}/deactivate`, { method: 'POST' }),

  // Triggers (Phase 3)
  triggerFlow: (flowId: string, payload: TriggerPayload) =>
    fetchAPI<{ runId: string }>(`/triggers/${flowId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Executions (Phase 3)
  getExecutionById: (runId: string) => fetchAPI<ExecutionHistory>(`/executions/${runId}`),

  getExecutionsByFlowId: (flowId: string) => fetchAPI<ExecutionHistory[]>(`/executions/${flowId}`),
};
