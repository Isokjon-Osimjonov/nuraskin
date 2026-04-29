import { z } from 'zod';

export const adminRoleSchema = z.enum(['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE', 'VIEWER']);
export type AdminRole = z.infer<typeof adminRoleSchema>;

export const inviteUserSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  role: adminRoleSchema,
  initialPassword: z.string().min(8),
  mustChangePassword: z.boolean().default(true),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  role: adminRoleSchema.optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Parollar mos kelmadi",
  path: ["confirmPassword"],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface AdminUserResponse {
  id: string;
  fullName: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}
