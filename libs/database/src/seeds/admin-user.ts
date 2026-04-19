import { db } from '../client';
import { users } from '../schema';

export async function adminUser(): Promise<void> {
  await db
    .insert(users)
    .values({
      email: 'admin@nuraskin.com',
      passwordHash: '$2b$10$34mSAtjy5qH4JfMcfT2qbeDukFEjGdS6mW1h8.z7oOQAGUJozG/M2',
      role: 'super_admin',
    })
    .onConflictDoNothing();
}
