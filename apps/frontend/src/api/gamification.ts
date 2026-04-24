export interface CouponValidation {
  discountAmount: number;
  couponCode: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

export interface CheckoutCoupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  applicable: boolean;
  minimumPurchaseAmount: number;
  expiresAt: string;
  targetCategories?: { name: string }[];
  inapplicableReason?: string;
}

export async function getCheckoutCoupons(productIds: string[], subtotal: number) {
  return {
    data: [] as CheckoutCoupon[],
  };
}