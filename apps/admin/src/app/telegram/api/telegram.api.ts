import { useAuthStore } from '@/stores/auth.store';
import type { 
  TelegramChannelResponse, 
  CreateTelegramChannelInput,
  TelegramPostResponse,
  CreateTelegramPostInput,
  UpdateTelegramPostInput
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
    throw new Error(error.message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const telegramApi = {
  // Channels
  listChannels: (): Promise<TelegramChannelResponse[]> => fetchWithAuth('/admin/telegram/channels'),
  addChannel: (data: CreateTelegramChannelInput): Promise<TelegramChannelResponse> => 
    fetchWithAuth('/admin/telegram/channels', { method: 'POST', body: JSON.stringify(data) }),
  toggleChannel: (id: string): Promise<TelegramChannelResponse> => 
    fetchWithAuth(`/admin/telegram/channels/${id}/toggle`, { method: 'PATCH' }),
  removeChannel: (id: string): Promise<void> => 
    fetchWithAuth(`/admin/telegram/channels/${id}`, { method: 'DELETE' }),
  testChannel: (chatId: string): Promise<{ ok: boolean, title: string }> => 
    fetchWithAuth('/admin/telegram/channels/test', { method: 'POST', body: JSON.stringify({ chatId }) }),

  // Posts
  listPosts: (filters: { status?: string, page?: number, limit?: number }): Promise<{ data: TelegramPostResponse[], total: number }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, String(v)); });
    return fetchWithAuth(`/admin/telegram/posts?${params.toString()}`);
  },
  getPost: (id: string): Promise<TelegramPostResponse & { channels: any[] }> => fetchWithAuth(`/admin/telegram/posts/${id}`),
  createPost: (data: CreateTelegramPostInput): Promise<TelegramPostResponse> => 
    fetchWithAuth('/admin/telegram/posts', { method: 'POST', body: JSON.stringify(data) }),
  updatePost: (id: string, data: UpdateTelegramPostInput): Promise<TelegramPostResponse> => 
    fetchWithAuth(`/admin/telegram/posts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  removePost: (id: string): Promise<void> => 
    fetchWithAuth(`/admin/telegram/posts/${id}`, { method: 'DELETE' }),
  sendPost: (id: string): Promise<any> => fetchWithAuth(`/admin/telegram/posts/${id}/send`, { method: 'POST' }),
  schedulePost: (id: string, scheduledAt: string): Promise<void> => 
    fetchWithAuth(`/admin/telegram/posts/${id}/schedule`, { method: 'POST', body: JSON.stringify({ scheduledAt }) }),
  cancelSchedule: (id: string): Promise<void> => 
    fetchWithAuth(`/admin/telegram/posts/${id}/cancel-schedule`, { method: 'DELETE' }),
  generateCaption: (productId: string, postType: string, language: string): Promise<{ caption: string }> => 
    fetchWithAuth('/admin/telegram/posts/generate-caption', { method: 'POST', body: JSON.stringify({ productId, postType, language }) }),
};
