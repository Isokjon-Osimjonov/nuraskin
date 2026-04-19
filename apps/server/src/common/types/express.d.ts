import 'express';

export interface AuthUser {
  sub: string;
  email: string;
  role: string;
}

declare module 'express' {
  interface Request {
    user?: AuthUser;
  }
}
