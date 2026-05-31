import { api } from '@/lib/api';
import type {
  AdminUserResponse,
  InviteUserInput,
  UpdateUserInput,
  ChangePasswordInput,
} from '@nuraskin/shared-types';

export const teamApi = {
  getAll: (): Promise<AdminUserResponse[]> => api.get<any>('/admin/team'),

  invite: (data: InviteUserInput): Promise<AdminUserResponse> => api.post<any>('/admin/team', data),

  update: (id: string, data: UpdateUserInput): Promise<AdminUserResponse> =>
    api.patch<any>(`/admin/team/${id}`, data),

  changePassword: (id: string, data: ChangePasswordInput): Promise<void> =>
    api.patch<any>(`/admin/team/${id}/change-password`, data),

  delete: (id: string): Promise<void> => api.delete<any>(`/admin/team/${id}`),
};
