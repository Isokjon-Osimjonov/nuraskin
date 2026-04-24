import { resolve } from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: resolve(process.cwd(), '../../.env') });

import jwt from 'jsonwebtoken';
import { env } from './src/common/config/env';

async function test() {
  const token = jwt.sign({ id: '123e4567-e89b-12d3-a456-426614174000', role: 'admin' }, env.JWT_SECRET);
  console.log('Generated token:', token);
  
  const createReq = await fetch('http://localhost:4000/api/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({name: 'Test Category ' + Date.now(), slug: 'test-category-' + Date.now(), imageUrl: 'http://example.com/cat.jpg', isActive: true})
  });
  
  const text = await createReq.text();
  console.log('Status:', createReq.status, 'Response:', text);
}

test().catch(console.error);
