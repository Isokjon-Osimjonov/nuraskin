import { db } from '../client';
import { users } from '../schema';

export async function adminUser(): Promise<void> {
  await db
    .insert(users)
    .values({
      email: 'manager@nuraskin.uz',
      passwordHash: '$2b$12$3raw3XSDczRX5x4v9vlm9uPQ4wgycHaM/rXx0W/2A.A5eoV9ZjbDq',
      role: 'SUPER_ADMIN',
      fullName: 'NuraSkin Manager',
      isActive: true,
    })
    .onConflictDoNothing();
}
