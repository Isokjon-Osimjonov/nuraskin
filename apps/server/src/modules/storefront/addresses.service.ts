import { db, customerAddresses } from '@nuraskin/database';
import { eq, and, desc, ne, sql } from 'drizzle-orm';
import { BadRequestError, NotFoundError } from '../../common/errors/AppError';
import type { CreateAddressInput, UpdateAddressInput } from '@nuraskin/shared-types';

export async function list(customerId: string) {
  return await db.query.customerAddresses.findMany({
    where: eq(customerAddresses.customerId, customerId),
    orderBy: [desc(customerAddresses.isDefault), desc(customerAddresses.createdAt)],
  });
}

export async function create(customerId: string, input: CreateAddressInput) {
  const existingCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customerAddresses)
    .where(eq(customerAddresses.customerId, customerId))
    .then(res => res[0]?.count || 0);

  if (existingCount >= 5) {
    throw new BadRequestError("Maksimal 5 ta manzil saqlash mumkin. Eskisini o'chiring.");
  }

  return await db.transaction(async (tx) => {
    const isFirst = existingCount === 0;
    const shouldBeDefault = input.isDefault || isFirst;

    if (shouldBeDefault) {
      await tx
        .update(customerAddresses)
        .set({ isDefault: false })
        .where(eq(customerAddresses.customerId, customerId));
    }

    const [address] = await tx
      .insert(customerAddresses)
      .values({
        ...input,
        customerId,
        isDefault: shouldBeDefault,
      })
      .returning();

    return address;
  });
}

export async function update(customerId: string, addressId: string, input: UpdateAddressInput) {
  const address = await db.query.customerAddresses.findFirst({
    where: and(eq(customerAddresses.id, addressId), eq(customerAddresses.customerId, customerId)),
  });

  if (!address) throw new NotFoundError('Manzil topilmadi');

  return await db.transaction(async (tx) => {
    if (input.isDefault) {
      await tx
        .update(customerAddresses)
        .set({ isDefault: false })
        .where(and(eq(customerAddresses.customerId, customerId), ne(customerAddresses.id, addressId)));
    }

    const [updated] = await tx
      .update(customerAddresses)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(customerAddresses.id, addressId))
      .returning();

    return updated;
  });
}

export async function remove(customerId: string, addressId: string) {
  const address = await db.query.customerAddresses.findFirst({
    where: and(eq(customerAddresses.id, addressId), eq(customerAddresses.customerId, customerId)),
  });

  if (!address) throw new NotFoundError('Manzil topilmadi');

  await db.transaction(async (tx) => {
    await tx.delete(customerAddresses).where(eq(customerAddresses.id, addressId));

    if (address.isDefault) {
      const newest = await tx.query.customerAddresses.findFirst({
        where: eq(customerAddresses.customerId, customerId),
        orderBy: [desc(customerAddresses.createdAt)],
      });

      if (newest) {
        await tx
          .update(customerAddresses)
          .set({ isDefault: true })
          .where(eq(customerAddresses.id, newest.id));
      }
    }
  });

  return { success: true };
}

export async function setDefault(customerId: string, addressId: string) {
  const address = await db.query.customerAddresses.findFirst({
    where: and(eq(customerAddresses.id, addressId), eq(customerAddresses.customerId, customerId)),
  });

  if (!address) throw new NotFoundError('Manzil topilmadi');

  return await db.transaction(async (tx) => {
    await tx
      .update(customerAddresses)
      .set({ isDefault: false })
      .where(eq(customerAddresses.customerId, customerId));

    const [updated] = await tx
      .update(customerAddresses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(customerAddresses.id, addressId))
      .returning();

    return updated;
  });
}
