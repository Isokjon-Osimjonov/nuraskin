import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../.env') });

import { create } from './src/modules/categories/categories.repository';

async function test() {
  try {
    const res = await create({
      name: 'Test Category 2',
      slug: 'test-category-2',
      imageUrl: 'http://example.com/test.jpg',
      isActive: true,
    });
    console.log('Created:', res);
  } catch (error) {
    console.error('Error:', error);
  }
}

test().then(() => process.exit(0)).catch(console.error);
