import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { env } from '../../common/config/env';
import { UnauthorizedError } from '../../common/errors/AppError';
import type { LoginInput, TelegramAuthInput } from './auth.schema';
import * as repository from './auth.repository';

const TELEGRAM_AUTH_MAX_AGE_SECONDS = 86_400; // 24 h

export interface AuthTokenResponse {
  token: string;
  user: { id: string; email: string; role: string };
}

export interface TelegramTokenResponse {
  token: string;
  user: { id: string; telegramId: string; firstName: string };
}

export async function adminLogin({ input }: { input: LoginInput }): Promise<AuthTokenResponse> {
  const user = await repository.findByEmail(input.email);
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }
  if (!user.isActive) {
    throw new UnauthorizedError('Account is inactive');
  }
  const valid = await bcryptjs.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid credentials');
  }
  await repository.updateLastLogin(user.id);
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );
  return { token, user: { id: user.id, email: user.email, role: user.role } };
}

export async function telegramAuth({
  input,
}: {
  input: TelegramAuthInput;
}): Promise<TelegramTokenResponse> {
  validateTelegramHash(input);

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (nowSeconds - input.auth_date > TELEGRAM_AUTH_MAX_AGE_SECONDS) {
    throw new UnauthorizedError('Telegram auth_date is too old');
  }

  const telegramId = BigInt(input.id);
  let tgUser = await repository.findByTelegramId(telegramId);

  if (!tgUser) {
    tgUser = await repository.createTelegramUser({
      telegramId,
      firstName: input.first_name,
      lastName: input.last_name ?? null,
      username: input.username ?? null,
      photoUrl: input.photo_url ?? null,
      authDate: new Date(input.auth_date * 1000),
    });
  }

  const token = jwt.sign(
    { sub: tgUser.id, telegramId: tgUser.telegramId.toString(), role: 'customer' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );

  return {
    token,
    user: { id: tgUser.id, telegramId: tgUser.telegramId.toString(), firstName: tgUser.firstName },
  };
}

function validateTelegramHash(input: TelegramAuthInput): void {
  const { hash, ...fields } = input;

  const dataCheckString = Object.entries(fields)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  console.log('[Auth] Validating Telegram hash for bot token:', env.TELEGRAM_BOT_TOKEN.slice(0, 10) + '...');
  console.log('[Auth] Data check string:\n' + dataCheckString);
  
  const secretKey = crypto.createHash('sha256').update(env.TELEGRAM_BOT_TOKEN).digest();
  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (
    expectedHash.length !== hash.length ||
    !crypto.timingSafeEqual(Buffer.from(expectedHash, 'hex'), Buffer.from(hash, 'hex'))
  ) {
    console.error('[Auth] Hash mismatch!', { expected: expectedHash, received: hash });
    throw new UnauthorizedError('Invalid Telegram hash');
  }
}
