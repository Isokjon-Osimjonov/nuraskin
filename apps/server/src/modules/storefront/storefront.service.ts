import * as storefrontRepository from './storefront.repository';
import * as ordersRepository from '../orders/orders.repository';
import * as ordersService from '../orders/orders.service';
import * as cartService from '../carts/carts.service';
import * as inventoryRepository from '../inventory/inventory.repository';
import * as couponsService from '../coupons/coupons.service';
import * as couponsRepository from '../coupons/coupons.repository';
import { db, customers, orders, orderItems, orderStatusHistory, products, settings, korShippingTiers, inventoryBatches, stockReservations, productWaitlist, exchangeRateSnapshots, productRegionalConfigs } from '@nuraskin/database';
import { eq, desc, sql, and, asc, gt, isNull } from 'drizzle-orm';
import { NotFoundError, BadRequestError } from '../../common/errors/AppError';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../common/config/env';
import { calculateUzbPrice, calculateKorPrice, calculateKorCargo } from '../../common/utils/pricing';
import type { 
  CreateStorefrontOrderInput, 
  StorefrontProductListItem,
  StorefrontProductDetail,
  StorefrontOrderResponse,
  ValidateCouponInput,
  CouponValidationResponse,
  KorShippingTierInput
} from '@nuraskin/shared-types';

// Initialize Cloudinary
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export async function listProducts(region: 'UZB' | 'KOR', categoryId?: string, search?: string, customerId?: string): Promise<StorefrontProductListItem[]> {
  const rawProducts = await storefrontRepository.findActiveProducts({ categoryId, search });
  const latestRate = await ordersRepository.getLatestRateSnapshot();

  const results: StorefrontProductListItem[] = [];

  for (const p of rawProducts) {
    const config = (p as any).configs.find((c: any) => c.regionCode === region);
    if (!config) continue;

    const availableStock = await inventoryRepository.getAvailableStock(p.id);
    
    let calculatedPrice = '0';
    if (region === 'UZB' && latestRate) {
      const { productPrice, cargoFee } = calculateUzbPrice(BigInt(config.retailPrice), p.weightGrams, latestRate);
      calculatedPrice = (productPrice + cargoFee).toString();
    } else {
      calculatedPrice = calculateKorPrice(BigInt(config.retailPrice)).toString();
    }

    results.push({
      id: p.id,
      name: p.name,
      slug: p.barcode,
      brandName: p.brandName,
      categoryName: p.categoryName || '',
      imageUrls: p.imageUrls,
      availableStock,
      calculatedPrice,
      currency: region === 'UZB' ? 'UZS' : 'KRW',
      showStockCount: p.showStockCount,
      wholesalePrice: config.wholesalePrice.toString(),
      minWholesaleQty: config.minWholesaleQty,
      weightGrams: p.weightGrams,
      inStock: availableStock > 0,
      isOnWaitlist: false,
    });
  }

  return results;
}

export async function getProductBySlug(slug: string, region: 'UZB' | 'KOR'): Promise<StorefrontProductDetail> {
  const p = await storefrontRepository.findProductByBarcode(slug);
  if (!p) throw new NotFoundError('Mahsulot topilmadi');

  const config = (p as any).configs.find((c: any) => c.regionCode === region);
  if (!config) throw new NotFoundError('Mahsulot bu mintaqada sotilmaydi');

  const latestRate = await ordersRepository.getLatestRateSnapshot();
  const availableStock = await inventoryRepository.getAvailableStock(p.id);

  let calculatedPrice = '0';
  if (region === 'UZB' && latestRate) {
    const { productPrice, cargoFee } = calculateUzbPrice(BigInt(config.retailPrice), p.weightGrams, latestRate);
    calculatedPrice = (productPrice + cargoFee).toString();
  } else {
    calculatedPrice = calculateKorPrice(BigInt(config.retailPrice)).toString();
  }

  return {
    id: p.id,
    name: p.name,
    descriptionUz: p.descriptionUz || '',
    slug: p.barcode,
    brandName: p.brandName,
    categoryName: p.categoryName || '',
    imageUrls: p.imageUrls,
    availableStock,
    calculatedPrice,
    currency: region === 'UZB' ? 'UZS' : 'KRW',
    showStockCount: p.showStockCount,
    wholesalePrice: config.wholesalePrice.toString(),
    minWholesaleQty: config.minWholesaleQty,
    benefits: p.benefits || [],
    ingredients: p.ingredients || [],
    howToUseUz: p.howToUseUz || '',
    weightGrams: p.weightGrams,
    inStock: availableStock > 0,
    isOnWaitlist: false,
    skinTypes: [],
  };
}

export async function validateCoupon(input: ValidateCouponInput, customerId: string, regionCode: string): Promise<CouponValidationResponse> {
  try {
    const result = await couponsService.validateAndApply(input.code, customerId, input.cartItems, regionCode);
    return {
      valid: true,
      discountAmount: result.discountAmount.toString(),
      description: `Kupon muvaffaqiyatli qo'llandi`,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: err.code?.replace('COUPON_', '') || 'NOT_APPLICABLE',
      amountNeeded: err.data?.amountNeeded,
    };
  }
}

export async function createOrder(customerId: string, input: CreateStorefrontOrderInput): Promise<StorefrontOrderResponse> {
  return await db.transaction(async (tx) => {
    const customer = await tx.query.customers.findFirst({
      where: eq(customers.id, customerId)
    });
    if (!customer) throw new NotFoundError('Mijoz topilmadi');

    let couponData = null;
    const couponCode = input.couponCode;

    if (couponCode) {
        const fullItems = await Promise.all(input.items.map(async (i) => {
            const p = await tx.query.products.findFirst({ where: eq(products.id, i.productId) });
            const latestRate = await tx.query.exchangeRateSnapshots.findFirst({ orderBy: [desc(exchangeRateSnapshots.createdAt)] });
            const config = await tx.query.productRegionalConfigs.findFirst({ 
                where: and(
                    eq(productRegionalConfigs.productId, i.productId),
                    eq(productRegionalConfigs.regionCode, customer.regionCode)
                ) 
            });
            
            let subtotal = 0n;
            if (customer.regionCode === 'UZB' && latestRate && config) {
                const { productPrice, cargoFee } = calculateUzbPrice(config.retailPrice, p?.weightGrams || 0, latestRate);
                subtotal = (productPrice + cargoFee) * BigInt(i.quantity);
            } else if (config) {
                const productPrice = calculateKorPrice(config.retailPrice);
                subtotal = productPrice * BigInt(i.quantity);
            }

            return {
                productId: i.productId,
                quantity: i.quantity,
                categoryId: p?.categoryId || '',
                brandName: p?.brandName || '',
                subtotal: subtotal.toString()
            };
        }));

        couponData = await couponsService.validateAndApply(couponCode, customerId, fullItems, customer.regionCode, tx);
    }

    const order = await ordersService.createOrder({
      ...input,
      customerId,
      regionCode: customer.regionCode as 'UZB' | 'KOR',
      currency: (customer.regionCode === 'UZB' ? 'UZS' : 'KRW') as any,
      couponId: couponData?.couponId,
      couponCode: couponCode,
      discountAmount: couponData?.discountAmount || 0n,
    }, tx);

    if (couponData && order) {
        await couponsRepository.incrementUsage(couponData.couponId, tx);
        await couponsService.recordRedemption({
            couponId: couponData.couponId,
            customerId,
            orderId: order.id,
            discountAmount: couponData.discountAmount,
        }, tx);
    }

    if (!order) throw new Error('Failed to create order');

    await cartService.clearCart(customerId, tx);

    return {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount.toString(),
        subtotal: order.subtotal.toString(),
        cargoFee: order.cargoFee.toString(),
        currency: order.currency,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        items: [],
        paymentReceiptUrl: order.paymentReceiptUrl,
        paymentSubmittedAt: order.paymentSubmittedAt?.toISOString() || null,
        paymentNote: order.paymentNote,
        paymentExpiresAt: null,
    };
  });
}

export async function getPublicSettings() {
    return await storefrontRepository.getStorefrontSettings();
}

export async function getLatestRates() {
    return await ordersRepository.getLatestRateSnapshot();
}

export async function listShippingTiers() {
    return await storefrontRepository.listShippingTiers();
}

export async function createShippingTier(input: KorShippingTierInput) {
    return await storefrontRepository.createShippingTier(input);
}

export async function updateShippingTier(id: string, input: Partial<KorShippingTierInput>) {
    return await storefrontRepository.updateShippingTier(id, input);
}

export async function deleteShippingTier(id: string) {
    return await storefrontRepository.deleteShippingTier(id);
}

export async function getMyOrders(customerId: string) {
    return await storefrontRepository.getMyOrders(customerId);
}

export async function getOrderDetails(orderId: string, customerId: string) {
    return await storefrontRepository.getOrderForCustomer(orderId, customerId);
}

export async function findCustomerByTelegramId(telegramId: bigint) {
    return await storefrontRepository.findCustomerByTelegramId(telegramId);
}

export async function createCustomerFromTelegram(data: any) {
    const [row] = await db.insert(customers).values(data).returning();
    return row;
}

export async function addToWaitlist(productId: string, customerId: string, region: string) {
    await db.insert(productWaitlist).values({
        productId,
        customerId,
        regionCode: region,
    });
}

export async function removeFromWaitlist(productId: string, customerId: string) {
    await db.delete(productWaitlist).where(and(eq(productWaitlist.productId, productId), eq(productWaitlist.customerId, customerId)));
}

export async function getMyWaitlist(customerId: string, region: string) {
    const rows = await db.select().from(productWaitlist).where(and(eq(productWaitlist.customerId, customerId), eq(productWaitlist.regionCode, region)));
    const results = [];
    for (const row of rows) {
        const p = await storefrontRepository.findProductById(row.productId);
        if (p) results.push(p);
    }
    return results;
}

export async function cancelOrder(orderId: string, customerId: string) {
    const order = await ordersRepository.findById(orderId);
    if (!order || order.customerId !== customerId) throw new NotFoundError('Buyurtma topilmadi');
    return await ordersService.updateOrderStatus(orderId, { to: 'CANCELED' });
}

export async function uploadOrderReceipt(orderId: string, customerId: string, base64: string, mimeType: string) {
    // upload logic...
    return { success: true };
}
