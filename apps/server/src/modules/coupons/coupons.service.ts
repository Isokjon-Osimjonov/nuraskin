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
    if (coupon.startsAt) {
        const startDate = new Date(coupon.startsAt);
        startDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startDate > today) {
            throw new CouponNotApplicableError('Bu kupon hali faol emas');
        }
    }
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

    let minAmount = 0n;
    if (coupon.regionCode === 'ALL') {
        minAmount = regionCode === 'UZB' ? BigInt(coupon.minOrderUzs || 0) : BigInt(coupon.minOrderKrw || 0);
    } else {
        minAmount = BigInt(coupon.minOrderAmount || 0);
    }

    if (minAmount > 0n && applicableSubtotal < minAmount) {
        throw new CouponMinAmountError(minAmount);
    }
    
    if (applicableQty < coupon.minOrderQty) {
        throw new CouponNotApplicableError(`Minimal mahsulot miqdori: ${coupon.minOrderQty} ta`);
    }

    // Calculation
    let discount = 0n;
    if (coupon.type === 'PERCENTAGE') {
        let baseValue = 0n;
        if (coupon.regionCode === 'ALL') {
             baseValue = regionCode === 'UZB' ? BigInt(coupon.valueUzs || 0) : BigInt(coupon.valueKrw || 0);
        } else {
             baseValue = coupon.value;
        }
        discount = (applicableSubtotal * baseValue) / 100n;
        
        let maxCap = null;
        if (coupon.regionCode === 'ALL') {
             maxCap = regionCode === 'UZB' ? (coupon.maxDiscountUzs ? BigInt(coupon.maxDiscountUzs) : null) : (coupon.maxDiscountKrw ? BigInt(coupon.maxDiscountKrw) : null);
        } else {
             maxCap = coupon.maxDiscountCap ? BigInt(coupon.maxDiscountCap) : null;
        }

        if (maxCap && discount > maxCap) {
            discount = maxCap;
        }
    } else {
        if (coupon.regionCode === 'ALL') {
            discount = regionCode === 'UZB' ? BigInt(coupon.valueUzs || 0) : BigInt(coupon.valueKrw || 0);
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
    value: BigInt(input.value || 0),
    valueUzs: input.valueUzs ? BigInt(input.valueUzs) : null,
    valueKrw: input.valueKrw ? BigInt(input.valueKrw) : null,
    maxDiscountCap: input.maxDiscountCap ? BigInt(input.maxDiscountCap) : null,
    maxDiscountUzs: input.maxDiscountUzs ? BigInt(input.maxDiscountUzs) : null,
    maxDiscountKrw: input.maxDiscountKrw ? BigInt(input.maxDiscountKrw) : null,
    minOrderAmount: BigInt(input.minOrderAmount || 0),
    minOrderUzs: input.minOrderUzs ? BigInt(input.minOrderUzs) : null,
    minOrderKrw: input.minOrderKrw ? BigInt(input.minOrderKrw) : null,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    regionCode: input.regionCode || null,
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
  if (input.value !== undefined) updateData.value = BigInt(input.value || 0);
  if (input.valueUzs !== undefined) updateData.valueUzs = input.valueUzs ? BigInt(input.valueUzs) : null;
  if (input.valueKrw !== undefined) updateData.valueKrw = input.valueKrw ? BigInt(input.valueKrw) : null;
  if (input.maxDiscountCap !== undefined) updateData.maxDiscountCap = input.maxDiscountCap ? BigInt(input.maxDiscountCap) : null;
  if (input.maxDiscountUzs !== undefined) updateData.maxDiscountUzs = input.maxDiscountUzs ? BigInt(input.maxDiscountUzs) : null;
  if (input.maxDiscountKrw !== undefined) updateData.maxDiscountKrw = input.maxDiscountKrw ? BigInt(input.maxDiscountKrw) : null;
  if (input.minOrderAmount !== undefined) updateData.minOrderAmount = BigInt(input.minOrderAmount || 0);
  if (input.minOrderUzs !== undefined) updateData.minOrderUzs = input.minOrderUzs ? BigInt(input.minOrderUzs) : null;
  if (input.minOrderKrw !== undefined) updateData.minOrderKrw = input.minOrderKrw ? BigInt(input.minOrderKrw) : null;
  if (input.startsAt !== undefined) updateData.startsAt = input.startsAt ? new Date(input.startsAt) : null;
  if (input.expiresAt !== undefined) updateData.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
  if (input.regionCode !== undefined) updateData.regionCode = input.regionCode || null;

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
