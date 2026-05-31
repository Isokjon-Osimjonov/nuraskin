import { api } from '@/lib/api';
import type {
  TelegramChannelResponse,
  CreateTelegramChannelInput,
  TelegramPostResponse,
  CreateTelegramPostInput,
  UpdateTelegramPostInput,
} from '@nuraskin/shared-types';

export const telegramApi = {
  // Channels
  listChannels: (): Promise<TelegramChannelResponse[]> => api.get<any>('/admin/telegram/channels'),
  addChannel: (data: CreateTelegramChannelInput): Promise<TelegramChannelResponse> =>
    api.post<any>('/admin/telegram/channels', data),
  toggleChannel: (id: string): Promise<TelegramChannelResponse> =>
    api.patch<any>(`/admin/telegram/channels/${id}/toggle`, {}),
  removeChannel: (id: string): Promise<void> => api.delete<any>(`/admin/telegram/channels/${id}`),
  testChannel: (chatId: string): Promise<{ ok: boolean; title: string }> =>
    api.post<any>('/admin/telegram/channels/test', { chatId }),

  // Posts
  listPosts: (filters: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: TelegramPostResponse[]; total: number }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.append(k, String(v));
    });
    return api.get<any>(`/admin/telegram/posts?${params.toString()}`);
  },
  getPost: (id: string): Promise<TelegramPostResponse & { channels: any[] }> =>
    api.get<any>(`/admin/telegram/posts/${id}`),
  createPost: (data: CreateTelegramPostInput): Promise<TelegramPostResponse> =>
    api.post<any>('/admin/telegram/posts', data),
  updatePost: (id: string, data: UpdateTelegramPostInput): Promise<TelegramPostResponse> =>
    api.patch<any>(`/admin/telegram/posts/${id}`, data),
  removePost: (id: string): Promise<void> => api.delete<any>(`/admin/telegram/posts/${id}`),
  sendPost: (id: string): Promise<any> => api.post<any>(`/admin/telegram/posts/${id}/send`, {}),
  schedulePost: (id: string, scheduledAt: string): Promise<void> =>
    api.post<any>(`/admin/telegram/posts/${id}/schedule`, { scheduledAt }),
  cancelSchedule: (id: string): Promise<void> =>
    api.delete<any>(`/admin/telegram/posts/${id}/cancel-schedule`),
  generateCaption: (
    productId: string,
    postType: string,
    language: string
  ): Promise<{ caption: string }> =>
    api.post<any>('/admin/telegram/posts/generate-caption', { productId, postType, language }),
};
