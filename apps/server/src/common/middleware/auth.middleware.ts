import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError';
import type { AuthUser } from '../types/express';
import * as usersRepository from '../../modules/users/users.repository';

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    
    // For admin users, check mustChangePassword
    if (payload.role !== 'customer') {
      const user = await usersRepository.findById(payload.sub);
      if (!user) throw new UnauthorizedError('User not found');
      if (!user.isActive) throw new UnauthorizedError('User is inactive');
      
      if (user.mustChangePassword && !req.path.endsWith('/change-password')) {
        _res.status(403).json({ code: 'MUST_CHANGE_PASSWORD', message: 'Parolni o\'zgartirishingiz shart' });
        return;
      }
    }

    req.user = payload;
    next();
  } catch (err: any) {
    if (err.statusCode === 403) {
        // already handled mustChangePassword
        return;
    }
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError('Not authenticated');
    }
    
    // Normalize role check
    const currentRole = user.role.toUpperCase();
    if (currentRole === SUPER_ADMIN_ROLE) {
      next();
      return;
    }

    const allowed = ROLE_PERMISSIONS[currentRole] ?? [];
    if (!allowed.includes(permission)) {
      throw new ForbiddenError(`Permission denied: ${permission}`);
    }
    next();
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
