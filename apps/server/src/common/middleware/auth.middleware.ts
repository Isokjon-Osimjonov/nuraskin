import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError';
import type { AuthUser } from '../types/express';

const SUPER_ADMIN_ROLE = 'super_admin';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = payload;
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError('Not authenticated');
    }
    if (user.role === SUPER_ADMIN_ROLE) {
      next();
      return;
    }
    const allowed = ROLE_PERMISSIONS[user.role] ?? [];
    if (!allowed.includes(permission)) {
      throw new ForbiddenError(`Permission denied: ${permission}`);
    }
    next();
  };
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'auth:read',
    'products:read',
    'orders:read',
    'orders:write',
    'customers:read',
  ],
};
