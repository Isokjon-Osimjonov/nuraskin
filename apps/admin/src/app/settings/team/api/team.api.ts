import { useAuthStore } from '@/stores/auth.store';
import type { 
  AdminUserResponse, 
  InviteUserInput, 
  UpdateUserInput,
  ChangePasswordInput
} from '@nuraskin/shared-types';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const { token } = useAuthStore.getState();
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Xatolik yuz berdi' }));
    // Return structured error for MUST_CHANGE_PASSWORD handling
    throw { ...error, status: res.status };
  }

  if (res.status === 204) return null;
  return res.json();
}

export const teamApi = {
  getAll: (): Promise<AdminUserResponse[]> => fetchWithAuth('/admin/team'),

  invite: (data: InviteUserInput): Promise<AdminUserResponse> =>
    fetchWithAuth('/admin/team', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateUserInput): Promise<AdminUserResponse> =>
    fetchWithAuth(`/admin/team/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  changePassword: (id: string, data: ChangePasswordInput): Promise<void> =>
    fetchWithAuth(`/admin/team/${id}/change-password`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    fetchWithAuth(`/admin/team/${id}`, {
      method: 'DELETE',
    }),
};
