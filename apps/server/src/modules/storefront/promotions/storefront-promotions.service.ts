import { db, coupons } from '@nuraskin/database';
import { eq, and, or, isNull, gt, lte } from 'drizzle-orm';
import type { PromotionBannerItem } from '@nuraskin/shared-types';

export async function getActivePromotions(): Promise<PromotionBannerItem[]> {
  const now = new Date();

  const results = await db
    .select()
    .from(coupons)
    .where(
      and(
        eq(coupons.isPromotional, true),
        eq(coupons.status, 'ACTIVE'),
        or(isNull(coupons.startsAt), lte(coupons.startsAt, now)),
        or(isNull(coupons.expiresAt), gt(coupons.expiresAt, now))
      )
    );

  return results.map(c => ({
    code: c.code,
    type: c.type as 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING',
    valueKrw: c.valueKrw ? Number(c.valueKrw) : null,
    valueUzs: c.valueUzs ? Number(c.valueUzs) : null,
    displayText: c.promoDisplayText ?? c.name,
    isFirstPurchaseOnly: c.isFirstPurchaseOnly,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    regionCode: c.regionCode ?? null,
  }));
}
