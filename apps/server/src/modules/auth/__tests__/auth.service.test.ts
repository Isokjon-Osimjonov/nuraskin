import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// Mock env before any service imports
vi.mock('../../../common/config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
    JWT_EXPIRES_IN: '7d',
    TELEGRAM_BOT_TOKEN: 'test-bot-token',
    DATABASE_URL: 'postgresql://localhost/test',
    PORT: 4000,
  },
}));

vi.mock('../auth.repository');

import * as repository from '../auth.repository';
import { adminLogin, telegramAuth } from '../auth.service';
import { UnauthorizedError } from '../../../common/errors/AppError';

const mockedRepo = vi.mocked(repository);

const FAKE_USER = {
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  email: 'admin@nuraskin.com',
  // bcrypt hash of 'admin123' (pre-computed)
  passwordHash: '$2b$10$34mSAtjy5qH4JfMcfT2qbeDukFEjGdS6mW1h8.z7oOQAGUJozG/M2',
  role: 'super_admin',
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const FAKE_TG_USER = {
  id: 'b2c3d4e5-0000-0000-0000-000000000002',
  telegramId: BigInt(123456789),
  firstName: 'Ali',
  lastName: null,
  username: 'ali_uz',
  photoUrl: null,
  authDate: new Date(),
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function buildTelegramPayload(overrides: Partial<{
  id: number;
  first_name: string;
  auth_date: number;
  hash: string;
  bot_token: string;
}> = {}): { id: number; first_name: string; auth_date: number; hash: string } {
  const bot_token = overrides.bot_token ?? 'test-bot-token';
  const id = overrides.id ?? 123456789;
  const first_name = overrides.first_name ?? 'Ali';
  const auth_date = overrides.auth_date ?? Math.floor(Date.now() / 1000);

  const fields = { id, first_name, auth_date };
  const dataCheckString = Object.entries(fields)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(bot_token).digest();
  const hash =
    overrides.hash ??
    crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return { id, first_name, auth_date, hash };
}

describe('auth.service — adminLogin', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns token for valid credentials', async () => {
    mockedRepo.findByEmail.mockResolvedValue(FAKE_USER);
    mockedRepo.updateLastLogin.mockResolvedValue(undefined);

    const result = await adminLogin({ input: { email: 'admin@nuraskin.com', password: 'admin123' } });

    expect(result.token).toBeTruthy();
    expect(result.user.email).toBe('admin@nuraskin.com');
    expect(result.user.role).toBe('super_admin');
  });

  it('throws UnauthorizedError for wrong password', async () => {
    mockedRepo.findByEmail.mockResolvedValue(FAKE_USER);

    await expect(
      adminLogin({ input: { email: 'admin@nuraskin.com', password: 'wrongpassword' } }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError when user not found', async () => {
    mockedRepo.findByEmail.mockResolvedValue(null);

    await expect(
      adminLogin({ input: { email: 'ghost@nuraskin.com', password: 'admin123' } }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe('auth.service — telegramAuth', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns token for valid Telegram hash (existing user)', async () => {
    const payload = buildTelegramPayload();
    mockedRepo.findByTelegramId.mockResolvedValue(FAKE_TG_USER);

    const result = await telegramAuth({ input: payload });

    expect(result.token).toBeTruthy();
    expect(result.user.firstName).toBe('Ali');
  });

  it('creates user and returns token when user does not exist', async () => {
    const payload = buildTelegramPayload();
    mockedRepo.findByTelegramId.mockResolvedValue(null);
    mockedRepo.createTelegramUser.mockResolvedValue(FAKE_TG_USER);

    const result = await telegramAuth({ input: payload });

    expect(mockedRepo.createTelegramUser).toHaveBeenCalledOnce();
    expect(result.token).toBeTruthy();
  });

  it('throws UnauthorizedError for invalid hash', async () => {
    const payload = buildTelegramPayload({ hash: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef' });

    await expect(telegramAuth({ input: payload })).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError for expired auth_date', async () => {
    const expiredAuthDate = Math.floor(Date.now() / 1000) - 90_000; // 25 hours ago
    const payload = buildTelegramPayload({ auth_date: expiredAuthDate });

    await expect(telegramAuth({ input: payload })).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
