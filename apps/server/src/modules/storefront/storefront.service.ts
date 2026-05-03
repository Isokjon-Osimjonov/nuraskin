import * as storefrontRepository from './storefront.repository';
import * as ordersRepository from '../orders/orders.repository';
import * as ordersService from '../orders/orders.service';
import * as cartService from '../carts/carts.service';
import * as cartsRepository from '../carts/carts.repository';
import * as inventoryRepository from '../inventory/inventory.repository';
import * as couponsService from '../coupons/coupons.service';
import * as couponsRepository from '../coupons/coupons.repository';
import { db, customers, orders, orderItems, orderStatusHistory, products, settings, korShippingTiers, inventoryBatches, stockReservations, productWaitlist, exchangeRateSnapshots, productRegionalConfigs, customerAddresses } from '@nuraskin/database';
import { eq, desc, sql, and, asc, gt, isNull } from 'drizzle-orm';
import { NotFoundError, BadRequestError, PriceChangedError } from '../../common/errors/AppError';
import { logger } from '../../common/utils/logger';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../common/config/env';
import { calculateUzbPrice, calculateKorPrice, calculateKorCargo } from '../../common/utils/pricing';
import { reservationTimeoutQueue } from '../queues';
import axios from 'axios';
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

export async function listProducts(region: 'UZB' | 'KOR', categoryId?: string, search?: string, customerId?: string, limit?: number): Promise<StorefrontProductListItem[]> {
  const rawProducts = await storefrontRepository.findActiveProducts({ categoryId, search, limit });
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

    const cart = await cartsRepository.findByCustomerId(customerId, tx);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestError('Savatda mahsulot yo\'q');
    }

    for (const cartItem of cart.items) {
      const regionalConfig = await tx.query.productRegionalConfigs.findFirst({
        where: and(
          eq(productRegionalConfigs.productId, cartItem.productId),
          eq(productRegionalConfigs.regionCode, cart.regionCode)
        )
      });

      if (!regionalConfig) continue;

      let freshPrice: bigint;
      if (cart.regionCode === 'UZB') {
        const rateSnapshot = await cartsRepository.getLatestRateSnapshot(tx);
        if (!rateSnapshot) {
          throw new BadRequestError('Valyuta kursi topilmadi');
        }
        const product = await tx.query.products.findFirst({
          where: eq(products.id, cartItem.productId)
        });
        const { productPrice, cargoFee } = calculateUzbPrice(
          BigInt(regionalConfig.retailPrice),
          product?.weightGrams || 0,
          rateSnapshot
        );
        freshPrice = productPrice + cargoFee;
      } else {
        freshPrice = calculateKorPrice(BigInt(regionalConfig.retailPrice));
      }

      const snapshotPrice = BigInt(cartItem.priceSnapshot);

      const diff = freshPrice > snapshotPrice ? freshPrice - snapshotPrice : snapshotPrice - freshPrice;
      const tolerance = snapshotPrice / 100n;

      if (diff > tolerance) {
        throw new PriceChangedError({
          message: "Narxlar o'zgardi. Savatni yangilab, qayta urinib ko'ring.",
          changedItems: [{
            productId: cartItem.productId,
            productName: cartItem.productName,
            oldPrice: snapshotPrice.toString(),
            newPrice: freshPrice.toString()
          }]
        });
      }
    }

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

    let order;
    try {
        order = await ordersService.createOrder({
            ...input,
            customerId,
            regionCode: customer.regionCode as 'UZB' | 'KOR',
            currency: (customer.regionCode === 'UZB' ? 'UZS' : 'KRW') as any,
            couponId: couponData?.couponId,
            couponCode: couponCode,
            discountAmount: couponData?.discountAmount || 0n,
        }, tx);
    } catch (err: any) {
        logger.error({
            msg: 'Order creation transaction failed',
            error: err.message,
            stack: err.stack,
            detail: err.detail,
            constraint: err.constraint
        });
        throw err;
    }

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

    // Transition to PENDING_PAYMENT immediately (reserves stock)
    await ordersService.updateOrderStatus(order.id, { 
      to: 'PENDING_PAYMENT',
      note: 'Buyurtma tasdiqlandi, to\'lov kutilmoqda'
    }, undefined, tx);

    // Save address snapshot
    if (input.addressId) {
        const addr = await tx.query.customerAddresses.findFirst({
            where: and(
                eq(customerAddresses.id, input.addressId),
                eq(customerAddresses.customerId, customerId)
            )
        });
        
        if (addr) {
            let line1 = '';
            let line2 = '';
            let city = '';
            let postalCode = '';
            
            if (addr.regionCode === 'UZB') {
                line1 = addr.uzbStreet || '';
                city = `${addr.uzbCity}, ${addr.uzbRegion}`;
            } else {
                line1 = addr.korRoadAddress || '';
                line2 = addr.korDetail || '';
                city = addr.korBuilding || '';
                postalCode = addr.korPostalCode || '';
            }
            
            await tx.update(orders)
                .set({
                    deliveryFullName: addr.fullName,
                    deliveryPhone: addr.phone,
                    deliveryAddressLine1: line1,
                    deliveryAddressLine2: line2,
                    deliveryCity: city,
                    deliveryPostalCode: postalCode,
                    deliveryRegionCode: addr.regionCode,
                })
                .where(eq(orders.id, order.id));
        }
    } else if (input.deliveryAddress) {
        await tx.update(orders)
            .set({
                deliveryFullName: input.deliveryAddress.fullName,
                deliveryPhone: input.deliveryAddress.phone,
                deliveryAddressLine1: input.deliveryAddress.line1,
                deliveryAddressLine2: input.deliveryAddress.line2 || '',
                deliveryCity: input.deliveryAddress.city,
                deliveryPostalCode: input.deliveryAddress.postalCode || '',
                deliveryRegionCode: input.deliveryAddress.regionCode,
            })
            .where(eq(orders.id, order.id));
    }

    await cartService.clearCart(
      customerId, 
      input.regionCode || customer.regionCode, 
      tx
    );

    const settingsRow = await tx.query.settings.findFirst();
    const timeoutMinutes = Number(settingsRow?.paymentTimeoutMinutes || 30);
    const delayMs = timeoutMinutes * 60 * 1000;

    await reservationTimeoutQueue.add(
      'timeout',
      { orderId: order.id },
      { 
        delay: delayMs,
        jobId: `reservation-timeout-${order.id}`,
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    const [finalOrder] = await tx.select().from(orders).where(eq(orders.id, order.id)).limit(1);

    return {
        id: finalOrder.id,
        orderNumber: finalOrder.orderNumber,
        totalAmount: finalOrder.totalAmount.toString(),
        subtotal: finalOrder.subtotal.toString(),
        cargoFee: finalOrder.cargoFee.toString(),
        currency: finalOrder.currency,
        status: finalOrder.status,
        createdAt: finalOrder.createdAt.toISOString(),
        items: [],
        paymentReceiptUrl: finalOrder.paymentReceiptUrl,
        paymentSubmittedAt: finalOrder.paymentSubmittedAt?.toISOString() || null,
        paymentNote: finalOrder.paymentNote,
        paymentExpiresAt: null,
        deliveryFullName: finalOrder.deliveryFullName,
        deliveryPhone: finalOrder.deliveryPhone,
        deliveryAddressLine1: finalOrder.deliveryAddressLine1,
        deliveryAddressLine2: finalOrder.deliveryAddressLine2,
        deliveryCity: finalOrder.deliveryCity,
        deliveryPostalCode: finalOrder.deliveryPostalCode,
        deliveryRegionCode: finalOrder.deliveryRegionCode,
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

export async function uploadOrderReceipt(orderId: string, customerId: string, paymentProofUrl: string) {
    const order = await ordersRepository.findById(orderId);
    if (!order || order.customerId !== customerId) throw new NotFoundError('Buyurtma topilmadi');
    
    if (order.status !== 'PENDING_PAYMENT') {
        throw new BadRequestError('Faqat to\'lov kutilayotgan buyurtmaga chek yuborish mumkin');
    }

    await db.update(orders)
        .set({ 
            paymentReceiptUrl: paymentProofUrl,
            paymentSubmittedAt: new Date(),
            updatedAt: new Date() 
        })
        .where(eq(orders.id, orderId));

    return { success: true };
}

export async function getOrderReceipt(orderId: string, customerId: string) {
    const order = await ordersRepository.findById(orderId);
    if (!order || order.customerId !== customerId) throw new NotFoundError('Buyurtma topilmadi');
    return order.paymentReceiptUrl;
}

export async function searchJuso(keyword: string) {
  const apiKey = env.JUSO_API_KEY;

  if (!apiKey) {
    return { results: [], fallback: true };
  }

  try {
    const response = await axios.get('https://business.juso.go.kr/addrlink/addrLinkApi.do', {
      params: {
        confmKey: apiKey,
        currentPage: 1,
        countPerPage: 10,
        keyword,
        resultType: 'json',
      },
    });

    const data = response.data;
    if (data.results?.common?.errorCode !== '0') {
      console.warn('Juso API error code:', data.results?.common?.errorMessage);
      return { results: [], fallback: true };
    }

    const juso = data.results.juso || [];

    return {
      results: juso.map((item: any) => ({
        postal_code: item.zipNo,
        road_address: item.roadAddr,
        building_name: item.bdNm || '',
        jibun_address: item.jibunAddr,
      })),
      fallback: false,
    };
  } catch (error) {
    console.error('Juso API error:', error);
    return { results: [], fallback: true };
  }
}

