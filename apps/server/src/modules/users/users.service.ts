import * as repository from './users.repository';
import { ConflictError, NotFoundError, ForbiddenError, UnauthorizedError } from '../../common/errors/AppError';
import type { InviteUserInput, UpdateUserInput, ChangePasswordInput } from '@nuraskin/shared-types';
import bcrypt from 'bcryptjs';

export async function listTeam() {
  return await repository.findAllAdmin();
}

export async function inviteAdminUser(input: InviteUserInput) {
  const existing = await repository.findByEmail(input.email);
  if (existing) throw new ConflictError('Ushbu email bilan foydalanuvchi mavjud');

  const passwordHash = await bcrypt.hash(input.initialPassword, 10);

  const user = await repository.create({
    fullName: input.fullName,
    email: input.email,
    role: input.role,
    passwordHash,
    mustChangePassword: input.mustChangePassword,
  });

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  };
}

export async function changePassword(id: string, input: ChangePasswordInput) {
  const user = await repository.findById(id);
  if (!user) throw new NotFoundError('Foydalanuvchi topilmadi');

  const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!isValid) throw new UnauthorizedError('Joriy parol noto\'g\'ri');

  const passwordHash = await bcrypt.hash(input.newPassword, 10);
  await repository.updatePassword(id, passwordHash);
}

export async function updateAdminUser(id: string, input: UpdateUserInput, currentUserId: string) {
  const user = await repository.findById(id);
  if (!user) throw new NotFoundError('Foydalanuvchi topilmadi');

  if (id === currentUserId && input.isActive === false) {
    throw new ForbiddenError('O\'zingizni faolsizlantira olmaysiz');
  }

  return await repository.update(id, input);
}

export async function deleteAdminUser(id: string, currentUserId: string) {
  if (id === currentUserId) {
    throw new ForbiddenError('O\'zingizni o\'chira olmaysiz');
  }

  const user = await repository.findById(id);
  if (!user) throw new NotFoundError('Foydalanuvchi topilmadi');

  await repository.softDelete(id);
}
