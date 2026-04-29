import { vi, describe, it, expect, beforeEach } from 'vitest';
import { login } from '../auth.service';
import * as repository from '../auth.repository';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../../common/config/env';
import { UnauthorizedError } from '../../../common/errors/AppError';

vi.mock('../auth.repository');
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');

describe('AuthService', () => {
  const mockUser = {
    id: 'user-123',
    fullName: 'Admin User',
    email: 'admin@example.com',
    passwordHash: 'hashed-password',
    role: 'ADMIN',
    isActive: true,
    lastLoginAt: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should return a token and user info on valid credentials', async () => {
      vi.mocked(repository.findByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as any);
      vi.mocked(jwt.sign).mockReturnValue('mock-token' as any);

      const result = await login('admin@example.com', 'password');

      expect(result).toEqual({
        token: 'mock-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          fullName: mockUser.fullName,
          role: mockUser.role,
        },
      });
      expect(repository.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw UnauthorizedError on invalid email', async () => {
      vi.mocked(repository.findByEmail).mockResolvedValue(null);

      await expect(login('wrong@example.com', 'password')).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError on invalid password', async () => {
      vi.mocked(repository.findByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as any);

      await expect(login('admin@example.com', 'wrong-pass')).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if user is inactive', async () => {
      vi.mocked(repository.findByEmail).mockResolvedValue({ ...mockUser, isActive: false } as any);

      await expect(login('admin@example.com', 'password')).rejects.toThrow(UnauthorizedError);
    });
  });
});
