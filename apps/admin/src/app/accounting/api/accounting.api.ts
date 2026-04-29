import { useAuthStore } from '../../../stores/auth.store';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    throw new Error('Failed to fetch');
  }
  return response.json();
}

export const accountingApi = {
  getSummary: async (month: string): Promise<any> => {
    return await fetchWithAuth(`/api/admin/accounting/summary?month=${month}`);
  },

  listExpenses: async (month: string, category?: string): Promise<any[]> => {
    const params = new URLSearchParams({ month });
    if (category) params.append('category', category);
    return await fetchWithAuth(`/api/admin/expenses?${params.toString()}`);
  },
  
  createExpense: async (data: any) => {
    return await fetchWithAuth('/api/admin/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateExpense: async (id: string, data: any) => {
    return await fetchWithAuth(`/api/admin/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteExpense: async (id: string) => {
    return await fetchWithAuth(`/api/admin/expenses/${id}`, {
      method: 'DELETE',
    });
  },

  deleteOrderExpense: async (orderId: string, expenseId: string) => {
    return await fetchWithAuth(`/api/admin/orders/${orderId}/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  },

  getUploadUrl: async (): Promise<{ url: string; timestamp: number; signature: string; apiKey: string }> => {
    return await fetchWithAuth('/api/categories/upload-url', { method: 'POST' });
  },

  exportExcel: async (month: string) => {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_BASE}/api/admin/accounting/export?month=${month}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nuraskin-hisobot-${month}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
