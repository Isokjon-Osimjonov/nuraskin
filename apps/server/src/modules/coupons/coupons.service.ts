import * as repository from './coupons.repository';
import { 
  CouponNotFoundError, 
  CouponExpiredError, 
  CouponDepletedError, 
  CouponNotApplicableError, 
  CouponMinAmountError,
  BadRequestError
} from '../../common/errors/AppError';
import type { 
    ValidateCouponInput, 
    CouponValidationResponse,
    CreateCouponInput,
    UpdateCouponInput
} from '@nuraskin/shared-types';
import { db, couponRedemptions } from '@nuraskin/database';

export async function validateAndApply(
    code: string, 
    customerId: string, 
    cartItems: ValidateCouponInput['cartItems'], 
    regionCode: string, 
    tx: any = db
): Promise<{ discountAmount: bigint, discountedItems: string[], couponId: string }> {
    const coupon = await repository.findByCode(code, tx);
    
    // 1. Existence
    if (!coupon) throw new CouponNotFoundError();
    
    // 2. Status
    if (coupon.status !== 'ACTIVE') {
        throw new CouponNotApplicableError('Bu kupon hozirda faol emas');
    }

    // 3. Schedule
    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) throw new CouponNotApplicableError('Bu kupon hali faol emas');
    if (coupon.expiresAt && now > coupon.expiresAt) throw new CouponExpiredError();

    // 4. Usage Count (Total)
    if (coupon.maxUsesTotal !== null && coupon.usageCount >= coupon.maxUsesTotal) {
        throw new CouponDepletedError();
    }

    // 5. Region
    if (coupon.regionCode && coupon.regionCode !== 'ALL' && coupon.regionCode !== regionCode) {
        throw new CouponNotApplicableError('Bu kupon bu mintaqa uchun emas');
    }

    // 6. Targeting
    if (coupon.targetCustomerIds && coupon.targetCustomerIds.length > 0) {
        if (!coupon.targetCustomerIds.includes(customerId)) {
            throw new CouponNotApplicableError('Bu kupon faqat tanlangan mijozlar uchun');
        }
    }

    // 7. First Order Only
    if (coupon.firstOrderOnly) {
        const orderCount = await repository.getCustomerOrderCount(customerId, tx);
        if (orderCount > 0) {
            throw new CouponNotApplicableError('Bu kupon faqat birinchi xarid uchun');
        }
    }

    // 8. One Per Customer / Usage Per Customer
    const customerUsage = await repository.getCustomerUsageCount(coupon.id, customerId, tx);
    if (customerUsage >= coupon.maxUsesPerCustomer) {
        throw new CouponNotApplicableError('Siz bu kupondan foydalanib bo\'lgansiz');
    }

    // 9. Scope and Items
    let applicableItems = cartItems;
    if (coupon.scope === 'PRODUCTS' && coupon.applicableResourceIds) {
        applicableItems = cartItems.filter(i => coupon.applicableResourceIds!.includes(i.productId));
    } else if (coupon.scope === 'CATEGORIES' && coupon.applicableResourceIds) {
        applicableItems = cartItems.filter(i => coupon.applicableResourceIds!.includes(i.categoryId));
    } else if (coupon.scope === 'BRANDS' && coupon.applicableBrands) {
        applicableItems = cartItems.filter(i => i.brandName && coupon.applicableBrands!.includes(i.brandName));
    }

    if (applicableItems.length === 0) {
        throw new CouponNotApplicableError('Kupon savatchangizdagi mahsulotlarga mos kelmadi');
    }

    // 10. Min Amount / Qty checks (on applicable items)
    const applicableSubtotal = applicableItems.reduce((acc, item) => acc + BigInt(item.subtotal), 0n);
    const applicableQty = applicableItems.reduce((acc, item) => acc + item.quantity, 0);

    if (coupon.regionCode !== 'ALL' && coupon.minOrderAmount > 0n) {
        if (applicableSubtotal < coupon.minOrderAmount) {
            throw new CouponMinAmountError(coupon.minOrderAmount);
        }
    }
    
    if (applicableQty < coupon.minOrderQty) {
        throw new CouponNotApplicableError(`Minimal mahsulot miqdori: ${coupon.minOrderQty} ta`);
    }

    // Calculation
    let discount = 0n;
    if (coupon.type === 'PERCENTAGE') {
        discount = (applicableSubtotal * coupon.value) / 100n;
        if (coupon.maxDiscountCap && discount > coupon.maxDiscountCap) {
            discount = coupon.maxDiscountCap;
        }
    } else {
        if (coupon.regionCode === 'ALL' && regionCode === 'UZB') {
            const rateSnapshot = await db.query.exchangeRateSnapshots.findFirst({
              orderBy: (rates, { desc }) => [desc(rates.createdAt)]
            });
            if (!rateSnapshot) throw new BadRequestError('Valyuta kursi topilmadi');
            discount = coupon.value * BigInt(rateSnapshot.krwToUzs) * 100n;
        } else {
            discount = coupon.value;
        }
    }

    // Discount cannot exceed subtotal
    if (discount > applicableSubtotal) discount = applicableSubtotal;

    return {
        discountAmount: discount,
        discountedItems: applicableItems.map(i => i.productId),
        couponId: coupon.id
    };
}

export async function createCoupon(input: CreateCouponInput) {
  return await repository.create({
    ...input,
    value: BigInt(input.value),
    maxDiscountCap: input.maxDiscountCap ? BigInt(input.maxDiscountCap) : null,
    minOrderAmount: BigInt(input.minOrderAmount),
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
  } as any);
}

export async function updateCoupon(id: string, input: UpdateCouponInput) {
  const existing = await repository.findById(id);
  if (!existing) throw new CouponNotFoundError();
  
  // Can only update if DRAFT or PAUSED (business rule to avoid logic breaking active users)
  if (existing.status !== 'DRAFT' && existing.status !== 'PAUSED') {
    // Only allow status changes or certain fields if ACTIVE
    if (Object.keys(input).length === 1 && input.status) {
        // allowing status change
    } else {
        throw new BadRequestError('Faol kuponni tahrirlab bo\'lmaydi. Uni avval to\'xtating (Pause).');
    }
  }

  const updateData: any = { ...input };
  if (input.value) updateData.value = BigInt(input.value);
  if (input.maxDiscountCap !== undefined) updateData.maxDiscountCap = input.maxDiscountCap ? BigInt(input.maxDiscountCap) : null;
  if (input.minOrderAmount) updateData.minOrderAmount = BigInt(input.minOrderAmount);
  if (input.startsAt !== undefined) updateData.startsAt = input.startsAt ? new Date(input.startsAt) : null;
  if (input.expiresAt !== undefined) updateData.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

  return await repository.update(id, updateData);
}

export async function listCoupons(filters: any) {
  return await repository.list(filters);
}

export async function getCoupon(id: string) {
    const coupon = await repository.findById(id);
    if (!coupon) throw new CouponNotFoundError();
    
    const redemptions = await repository.findRedemptions(id);
    
    return {
        ...coupon,
        redemptions
    };
}

export async function deleteCoupon(id: string) {
    await repository.softDelete(id);
}

export async function recordRedemption(data: { couponId: string, customerId: string, orderId: string, discountAmount: bigint }, tx: any) {
    await tx.insert(couponRedemptions).values(data);
}
