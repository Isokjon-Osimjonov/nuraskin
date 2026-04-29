import { db, settings } from '@nuraskin/database';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '../../common/errors/AppError';

export async function get() {
  const [row] = await db.select().from(settings).limit(1);
  if (!row) throw new NotFoundError('Settings not found');
  return {
    ...row,
    debtLimitDefault: row.debtLimitDefault.toString(),
    minOrderUzbUzs: row.minOrderUzbUzs.toString(),
    minOrderKorKrw: row.minOrderKorKrw.toString(),
  };
}

export async function update(data: any) {
  const [row] = await db.select().from(settings).limit(1);
  if (!row) throw new NotFoundError('Settings not found');

  const updateData = { ...data, updatedAt: new Date() };
  if (data.debtLimitDefault !== undefined) updateData.debtLimitDefault = BigInt(data.debtLimitDefault);
  if (data.minOrderUzbUzs !== undefined) updateData.minOrderUzbUzs = BigInt(data.minOrderUzbUzs);
  if (data.minOrderKorKrw !== undefined) updateData.minOrderKorKrw = BigInt(data.minOrderKorKrw);

  const [updated] = await db
    .update(settings)
    .set(updateData)
    .where(eq(settings.id, row.id))
    .returning();

  return {
    ...updated,
    debtLimitDefault: updated.debtLimitDefault.toString(),
    minOrderUzbUzs: updated.minOrderUzbUzs.toString(),
    minOrderKorKrw: updated.minOrderKorKrw.toString(),
  };
}
