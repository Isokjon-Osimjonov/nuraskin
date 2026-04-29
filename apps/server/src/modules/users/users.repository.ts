import { db, users } from '@nuraskin/database';
import { eq, and, isNull, sql } from 'drizzle-orm';
import type { AdminUserResponse } from '@nuraskin/shared-types';

export async function findAllAdmin() {
  const rows = await db
    .select()
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(users.fullName);
  
  return rows.map(r => ({
    id: r.id,
    fullName: r.fullName,
    email: r.email,
    role: r.role as any,
    isActive: r.isActive,
    mustChangePassword: r.mustChangePassword,
    lastLoginAt: r.lastLoginAt ? r.lastLoginAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  })) as AdminUserResponse[];
}

export async function findById(id: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);
  return user || null;
}

export async function findByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user || null;
}

export async function create(data: any) {
  const [user] = await db
    .insert(users)
    .values(data)
    .returning();
  return user;
}

export async function update(id: string, data: any) {
  const [updated] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return updated;
}

export async function updatePassword(id: string, passwordHash: string) {
  await db
    .update(users)
    .set({ 
      passwordHash, 
      mustChangePassword: false,
      updatedAt: new Date() 
    })
    .where(eq(users.id, id));
}

export async function softDelete(id: string) {
  await db
    .update(users)
    .set({ deletedAt: new Date(), updatedAt: new Date(), isActive: false })
    .where(eq(users.id, id));
}
