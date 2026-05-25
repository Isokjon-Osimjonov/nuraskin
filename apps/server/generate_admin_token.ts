import jwt from 'jsonwebtoken';
import { env } from './src/common/config/env';

const token = jwt.sign(
  {
    sub: '63c90a5d-588c-4831-868f-601a5337c722',
    email: 'admin@nuraskin.com',
    role: 'admin',
  },
  env.JWT_SECRET,
  { expiresIn: '90d' }
);
console.log(token);
