import 'express';

export interface AuthUser {
  sub: string;
  email?: string;
  role: string;
  telegramId?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

declare module 'express' {
  interface Request {
    user?: AuthUser;
  }
}
