import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError';
import type { AuthUser } from '../types/express';
import * as usersRepository from '../../modules/users/users.repository';

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Avtorizatsiya talab qilinadi'));
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser;

    // For admin users, check mustChangePassword
    if (payload.role !== 'customer') {
      const user = await usersRepository.findById(payload.sub);
      if (!user) return next(new UnauthorizedError('User not found'));
      if (!user.isActive) return next(new UnauthorizedError('User is inactive'));

      if (user.mustChangePassword && !req.path.endsWith('/change-password')) {
        res.status(403).json({ code: 'MUST_CHANGE_PASSWORD', message: 'Parolni o\'zgartirishingiz shart' });
        return;
      }
    }

    req.user = payload;
    next();
  } catch (err) {
    next(new UnauthorizedError('Token muddati tugagan yoki noto\'g\'ri'));
  }
};

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      if (!user) {
        return next(new UnauthorizedError('Not authenticated'));
      }

      // Normalize role check
      const currentRole = user.role.toUpperCase();
      if (currentRole === SUPER_ADMIN_ROLE) {
        next();
        return;
      }

      const allowed = ROLE_PERMISSIONS[currentRole] ?? [];
      if (!allowed.includes(permission)) {
        return next(new ForbiddenError(`Permission denied: ${permission}`));
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    'auth:read',
    'categories:read', 'categories:write',
    'products:read', 'products:write',
    'inventory:read', 'inventory:write',
    'orders:read', 'orders:write',
    'customers:read', 'customers:write',
    'settings:read', 'settings:write',
    'team:read', 'team:write',
  ],
  WAREHOUSE: [
    'products:read',
    'inventory:read', 'inventory:write',
    'orders:read',
  ],
  VIEWER: [
    'categories:read',
    'products:read',
    'inventory:read',
    'orders:read',
    'customers:read',
  ],
};
