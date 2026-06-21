import * as storefrontRepository from './storefront.repository';
import * as ordersRepository from '../orders/orders.repository';
import * as ordersService from '../orders/orders.service';
import * as cartService from '../carts/carts.service';
import * as cartsRepository from '../carts/carts.repository';
import * as inventoryRepository from '../inventory/inventory.repository';
import * as couponsService from '../coupons/coupons.service';
import * as couponsRepository from '../coupons/coupons.repository';
import {
  db,
  customers,
  orders,
  products,
  settings,
  productWaitlist,
  exchangeRateSnapshots,
  productRegionalConfigs,
  customerAddresses,
  coupons,
  couponRedemptions,
  categories,
} from '@nuraskin/database';
import { eq, desc, sql, and, or, asc, gt, isNull, inArray } from 'drizzle-orm';
import { NotFoundError, BadRequestError, PriceChangedError } from '../../common/errors/AppError';
import { logger } from '../../common/utils/logger';
import { NotificationService } from '../notifications/notification.service';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../common/config/env';
import { calculateUzbPrice, calculateKorPrice } from '../../common/utils/pricing';
import { reservationTimeoutQueue } from '../queues';
import axios from 'axios';
import type {
  CreateStorefrontOrderInput,
  StorefrontProductListItem,
  StorefrontProductDetail,
  StorefrontOrderResponse,
  ValidateCouponInput,
  CouponValidationResponse,
  KorShippingTierInput,
  ShippingBoxInput,
} from '@nuraskin/shared-types';

// Initialize Cloudinary
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

let cachedRate: any = null;
let cachedRateTime: number = 0;

async function getCachedLatestRate() {
  const now = Date.now();
  if (cachedRate && now - cachedRateTime < 5 * 60 * 1000) {
    return cachedRate;
  }
  cachedRate = await ordersRepository.getLatestRateSnapshot();
  cachedRateTime = now;
  return cachedRate;
}

export async function listCategories(): Promise<any[]> {
  return await db
    .select()
    .from(categories)
    .where(isNull(categories.deletedAt))
    .orderBy(asc(categories.name));
}

export async function listProducts(
  region: 'UZB' | 'KOR',
  categoryId?: string,
  search?: string,
  customerId?: string,
  limit?: number
): Promise<StorefrontProductListItem[]> {
  const rawProducts = await storefrontRepository.findActiveProducts({ categoryId, search, limit });
  const latestRate = await getCachedLatestRate();

  const results: StorefrontProductListItem[] = [];

  for (const p of rawProducts) {
    const config = (p as any).configs.find((c: any) => c.regionCode === region);
    if (!config) continue;

    const availableStock = await inventoryRepository.getAvailableStock(p.id);

    let calculatedPrice = '0';
    let wholesalePrice = '0';
    if (region === 'UZB' && latestRate) {
      const { productPrice, cargoFee } = calculateUzbPrice(
        BigInt(config.retailPrice),
        p.weightGrams,
        latestRate
      );
      calculatedPrice = (productPrice + cargoFee).toString();

      const wsPrices = calculateUzbPrice(BigInt(config.wholesalePrice), p.weightGrams, latestRate);
      wholesalePrice = (wsPrices.productPrice + wsPrices.cargoFee).toString();
    } else {
      calculatedPrice = calculateKorPrice(BigInt(config.retailPrice)).toString();
      wholesalePrice = calculateKorPrice(BigInt(config.wholesalePrice)).toString();
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
      wholesalePrice,
      minWholesaleQty: config.minWholesaleQty,
      weightGrams: p.weightGrams,
      inStock: availableStock > 0,
      isOnWaitlist: false,
    });
  }

  return results;
}

export async function getProductBySlug(
  slug: string,
  region: 'UZB' | 'KOR'
): Promise<StorefrontProductDetail> {
  const p = await storefrontRepository.findProductByBarcode(slug);
  if (!p) throw new NotFoundError('Mahsulot topilmadi');

  const config = (p as any).configs.find((c: any) => c.regionCode === region);
  if (!config) throw new NotFoundError('Mahsulot bu mintaqada sotilmaydi');

  const latestRate = await getCachedLatestRate();
  const availableStock = await inventoryRepository.getAvailableStock(p.id);

  let calculatedPrice = '0';
  let wholesalePrice = '0';
  if (region === 'UZB' && latestRate) {
    const { productPrice, cargoFee } = calculateUzbPrice(
      BigInt(config.retailPrice),
      p.weightGrams,
      latestRate
    );
    calculatedPrice = (productPrice + cargoFee).toString();

    const wsPrices = calculateUzbPrice(BigInt(config.wholesalePrice), p.weightGrams, latestRate);
    wholesalePrice = (wsPrices.productPrice + wsPrices.cargoFee).toString();
  } else {
    calculatedPrice = calculateKorPrice(BigInt(config.retailPrice)).toString();
    wholesalePrice = calculateKorPrice(BigInt(config.wholesalePrice)).toString();
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
    wholesalePrice,
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

export async function validateCoupon(
  input: ValidateCouponInput,
  customerId: string,
  regionCode: string
): Promise<CouponValidationResponse> {
  try {
    const result = await couponsService.validateAndApply(
      input.code,
      customerId,
      input.cartItems,
      regionCode
    );
    return {
      valid: true,
      discountAmount: result.discountAmount.toString(),
      description: `Kupon muvaffaqiyatli qo'llandi`,
      isFreeShipping: (result as any).isFreeShipping,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: err.code?.replace('COUPON_', '') || 'NOT_APPLICABLE',
      amountNeeded: err.data?.amountNeeded,
      description: err.message,
    };
  }
}

export async function listCoupons(customerId: string, requestRegion: string) {
  const cart = await cartsRepository.findByCustomerId(customerId);
  const cartItemsFull: Array<{
    productId: string;
    categoryId: string | null;
    brandName: string | null;
  }> = [];
  let cartSubtotal = 0n;

  if (cart && cart.items.length > 0) {
    for (const item of cart.items) {
      const p = await db.query.products.findFirst({ where: eq(products.id, item.productId) });
      if (p) {
        cartItemsFull.push({
          productId: p.id,
          categoryId: p.categoryId,
          brandName: p.brandName,
        });
        cartSubtotal += BigInt(item.priceSnapshot) * BigInt(item.quantity);
      }
    }
  }

  const allCoupons = await db.query.coupons.findMany({
    where: and(
      eq(coupons.status, 'ACTIVE'),
      or(isNull(coupons.targetCustomerIds), sql`${customerId} = ANY(${coupons.targetCustomerIds})`),
      or(isNull(coupons.expiresAt), gt(coupons.expiresAt, new Date())),
      or(
        isNull(coupons.regionCode),
        eq(coupons.regionCode, 'ALL'),
        eq(coupons.regionCode, requestRegion)
      )
    ),
    orderBy: [desc(coupons.createdAt)],
  });

  const customerRedemptions = await db.query.couponRedemptions.findMany({
    where: eq(couponRedemptions.customerId, customerId),
  });

  const usageCounts = customerRedemptions.reduce(
    (acc, r) => {
      acc[r.couponId] = (acc[r.couponId] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const results = [];

  for (const c of allCoupons) {
    // Check total uses depleted
    if (c.maxUsesTotal !== null && (c.usageCount || 0) >= c.maxUsesTotal) continue;

    const isUsed = (usageCounts[c.id] || 0) >= c.maxUsesPerCustomer;

    // Evaluate scope matching
    let scopeMatched = false;
    let applicableProductNames: string[] = [];
    let applicableCategoryNames: string[] = [];

    if (c.scope === 'ENTIRE_ORDER') {
      scopeMatched = true;
    } else if (c.scope === 'PRODUCTS' && c.applicableResourceIds?.length) {
      const hasProduct = cartItemsFull.some(i => c.applicableResourceIds!.includes(i.productId));
      if (hasProduct || cartItemsFull.length === 0) scopeMatched = true; // Still show if cart is empty
      // Fetch names
      const prods = await db.query.products.findMany({
        where: inArray(products.id, c.applicableResourceIds),
      });
      applicableProductNames = prods.map(p => p.name);
    } else if (c.scope === 'CATEGORIES' && c.applicableResourceIds?.length) {
      const hasCategory = cartItemsFull.some(
        i => i.categoryId && c.applicableResourceIds!.includes(i.categoryId)
      );
      if (hasCategory || cartItemsFull.length === 0) scopeMatched = true;
      // Fetch names
      const cats = await db.query.categories.findMany({
        where: inArray(categories.id, c.applicableResourceIds),
      });
      applicableCategoryNames = cats.map(cat => cat.name);
    } else if (c.scope === 'BRANDS' && c.applicableBrands?.length) {
      const hasBrand = cartItemsFull.some(
        i => i.brandName && c.applicableBrands!.includes(i.brandName)
      );
      if (hasBrand || cartItemsFull.length === 0) scopeMatched = true;
    }

    if (!scopeMatched) continue;

    let autoApplied = false;
    if (c.autoApply && !isUsed) {
      let minAmount = 0n;
      if (c.regionCode === 'ALL') {
        minAmount =
          requestRegion === 'UZB' ? BigInt(c.minOrderUzs || 0) : BigInt(c.minOrderKrw || 0);
      } else {
        minAmount = BigInt(c.minOrderAmount || 0);
      }

      if (cartSubtotal >= minAmount && cartItemsFull.length >= c.minOrderQty) {
        autoApplied = true;
      }
    }

    results.push({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      type: c.type,
      value: c.value.toString(),
      valueUzs: c.valueUzs?.toString(),
      valueKrw: c.valueKrw?.toString(),
      minOrderAmount: c.minOrderAmount?.toString(),
      minOrderUzs: c.minOrderUzs?.toString(),
      minOrderKrw: c.minOrderKrw?.toString(),
      maxRedemptions: c.maxUsesTotal,
      usageCount: c.usageCount,
      expiresAt: c.expiresAt?.toISOString(),
      regionCode: c.regionCode,
      scope: c.scope,
      isUsed,
      autoApplied,
      applicableProductNames,
      applicableCategoryNames,
      applicableBrands: c.applicableBrands || [],
      isTargeted: c.targetCustomerIds && c.targetCustomerIds.length > 0,
      isStackable: c.isStackable,
    });
  }

  return results;
}

export async function createOrder(
  customerId: string,
  input: CreateStorefrontOrderInput
): Promise<StorefrontOrderResponse> {
  return await db.transaction(async tx => {
    const settingsRow = await tx.query.settings.findFirst();

    const customer = await tx.query.customers.findFirst({
      where: eq(customers.id, customerId),
    });
    if (!customer) throw new NotFoundError('Mijoz topilmadi');

    const cart = await cartsRepository.findByCustomerId(customerId, tx);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestError("Savatda mahsulot yo'q");
    }

    const subtotal = cart.items.reduce(
      (acc, item) => acc + BigInt(item.priceSnapshot) * BigInt(item.quantity),
      0n
    );

    // Min order validation
    const minOrderAmount =
      input.regionCode === 'KOR'
        ? BigInt((settingsRow as any)?.minOrderKorKrw || 0n)
        : BigInt((settingsRow as any)?.minOrderUzbUzs || 0n);

    if (minOrderAmount > 0n && subtotal < minOrderAmount) {
      const formatted =
        input.regionCode === 'KOR'
          ? `${Number(minOrderAmount).toLocaleString()} ₩`
          : `${Number(minOrderAmount / 100n).toLocaleString()} so'm`;

      throw new BadRequestError(`Minimal buyurtma summasi ${formatted} bo'lishi kerak`);
    }

    for (const cartItem of cart.items) {
      const regionalConfig = await tx.query.productRegionalConfigs.findFirst({
        where: and(
          eq(productRegionalConfigs.productId, cartItem.productId),
          eq(productRegionalConfigs.regionCode, cart.regionCode)
        ),
      });

      if (!regionalConfig) continue;

      let freshPrice: bigint;
      const isWholesale = cartItem.quantity >= regionalConfig.minWholesaleQty;
      const basePrice = isWholesale
        ? BigInt(regionalConfig.wholesalePrice)
        : BigInt(regionalConfig.retailPrice);

      if (cart.regionCode === 'UZB') {
        const rateSnapshot = await cartsRepository.getLatestRateSnapshot(tx);
        if (!rateSnapshot) {
          throw new BadRequestError('Valyuta kursi topilmadi');
        }
        const product = await tx.query.products.findFirst({
          where: eq(products.id, cartItem.productId),
        });
        const { productPrice, cargoFee } = calculateUzbPrice(
          basePrice,
          product?.weightGrams || 0,
          rateSnapshot
        );
        freshPrice = productPrice + cargoFee;
      } else {
        freshPrice = calculateKorPrice(basePrice);
      }

      const snapshotPrice = BigInt(cartItem.priceSnapshot);

      const diff =
        freshPrice > snapshotPrice ? freshPrice - snapshotPrice : snapshotPrice - freshPrice;
      const tolerance = snapshotPrice / 100n;

      if (diff > tolerance) {
        throw new PriceChangedError({
          message: "Narxlar o'zgardi. Savatni yangilab, qayta urinib ko'ring.",
          changedItems: [
            {
              productId: cartItem.productId,
              productName: cartItem.productName,
              oldPrice: snapshotPrice.toString(),
              newPrice: freshPrice.toString(),
            },
          ],
        });
      }
    }

    let couponData = null;
    const couponCode = input.couponCode;

    if (couponCode) {
      const fullItems = await Promise.all(
        input.items.map(async i => {
          const p = await tx.query.products.findFirst({ where: eq(products.id, i.productId) });
          const latestRate = await tx.query.exchangeRateSnapshots.findFirst({
            orderBy: [desc(exchangeRateSnapshots.createdAt)],
          });
          const config = await tx.query.productRegionalConfigs.findFirst({
            where: and(
              eq(productRegionalConfigs.productId, i.productId),
              eq(productRegionalConfigs.regionCode, input.regionCode)
            ),
          });

          const baseKrw =
            i.quantity >= (config.minWholesaleQty || 5)
              ? BigInt(config.wholesalePrice)
              : BigInt(config.retailPrice);

          let subtotal = 0n;
          if (input.regionCode === 'UZB' && latestRate && config) {
            const { productPrice, cargoFee } = calculateUzbPrice(
              baseKrw,
              p?.weightGrams || 0,
              latestRate
            );
            subtotal = (productPrice + cargoFee) * BigInt(i.quantity);
          } else if (config) {
            const productPrice = calculateKorPrice(baseKrw);
            subtotal = productPrice * BigInt(i.quantity);
          }

          return {
            productId: i.productId,
            quantity: i.quantity,
            categoryId: p?.categoryId || '',
            brandName: p?.brandName || '',
            subtotal: subtotal.toString(),
          };
        })
      );

      couponData = await couponsService.validateAndApply(
        couponCode,
        customerId,
        fullItems,
        input.regionCode,
        tx
      );
    }

    let order;
    try {
      order = await ordersService.createOrder(
        {
          ...input,
          customerId,
          regionCode: input.regionCode as 'UZB' | 'KOR',
          currency: (input.regionCode === 'UZB' ? 'UZS' : 'KRW') as any,
          couponId: couponData?.couponId,
          couponCode: couponCode,
          discountAmount: couponData?.discountAmount || 0n,
        },
        tx
      );
    } catch (err: any) {
      logger.error({
        msg: 'Order creation transaction failed',
        error: err.message,
        stack: err.stack,
        detail: err.detail,
        constraint: err.constraint,
      });
      throw err;
    }

    if (couponData && order) {
      await couponsRepository.incrementUsage(couponData.couponId, tx);
      await couponsService.recordRedemption(
        {
          couponId: couponData.couponId,
          customerId,
          orderId: order.id,
          discountAmount: couponData.discountAmount,
        },
        tx
      );
    }

    if (!order) throw new Error('Failed to create order');

    // Transition to PENDING_PAYMENT immediately (reserves stock)
    await ordersService.updateOrderStatus(
      order.id,
      {
        to: 'PENDING_PAYMENT',
        note: "Buyurtma tasdiqlandi, to'lov kutilmoqda",
      },
      undefined,
      tx
    );

    // Save address snapshot
    if (input.addressId) {
      const addr = await tx.query.customerAddresses.findFirst({
        where: and(
          eq(customerAddresses.id, input.addressId),
          eq(customerAddresses.customerId, customerId)
        ),
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

        await tx
          .update(orders)
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
      await tx
        .update(orders)
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

    await cartService.clearCart(customerId, input.regionCode || customer.regionCode, tx);

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

    const itemsForNotification = cart.items.map((item: any) => ({
      name: item.productName,
      qty: item.quantity,
      subtotal: BigInt(item.priceSnapshot) * BigInt(item.quantity),
    }));

    process.nextTick(async () => {
      try {
        await NotificationService.sendOrderPlaced(
          finalOrder,
          itemsForNotification,
          customer.telegramId as any
        );
        await NotificationService.sendAdminNewOrder(
          finalOrder.id,
          finalOrder.orderNumber,
          finalOrder.totalAmount,
          finalOrder.regionCode,
          customer.fullName,
          cart.items.length
        );
      } catch (e) {
        logger.error({ e }, 'Failed to send order placed notification');
      }
    });

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
  const settingsRow = await storefrontRepository.getStorefrontSettings();
  return {
    minOrderAmountKrw: Number(settingsRow?.minOrderKorKrw || 0),
    minOrderAmountUzs: settingsRow?.minOrderUzbUzs ? settingsRow.minOrderUzbUzs.toString() : '0',
  };
}

export async function getPaymentInfo(region: 'UZB' | 'KOR') {
  const [settingsRow] = await db.select().from(settings).limit(1);
  if (!settingsRow) return {};

  if (region === 'KOR') {
    return {
      bank: {
        enabled: settingsRow.korBankEnabled,
        bankName: settingsRow.korBankName,
        holderName: settingsRow.korBankHolder,
        accountNumber: settingsRow.korBankNumber,
      },
      e9pay: {
        enabled: settingsRow.korE9payEnabled,
        name: settingsRow.korE9payName,
        account: settingsRow.korE9payAccount,
      },
    };
  } else {
    return {
      bank: {
        enabled: settingsRow.uzbBankEnabled,
        bankName: settingsRow.uzbBankName,
        holderName: settingsRow.uzbBankHolder,
        accountNumber: settingsRow.uzbBankNumber,
      },
      e9pay: {
        enabled: settingsRow.uzbE9payEnabled,
        name: settingsRow.uzbE9payName,
        account: settingsRow.uzbE9payAccount,
      },
    };
  }
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

// Shipping Boxes
export async function listShippingBoxes() {
  return await storefrontRepository.listShippingBoxes();
}

export async function createShippingBox(input: ShippingBoxInput) {
  return await storefrontRepository.createShippingBox(input);
}

export async function updateShippingBox(id: string, input: Partial<ShippingBoxInput>) {
  return await storefrontRepository.updateShippingBox(id, input);
}

export async function deleteShippingBox(id: string) {
  return await storefrontRepository.deleteShippingBox(id);
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
  await db
    .insert(productWaitlist)
    .values({
      productId,
      customerId,
      regionCode: region,
    })
    .onConflictDoNothing({
      target: [productWaitlist.productId, productWaitlist.customerId],
    });
}

export async function removeFromWaitlist(productId: string, customerId: string) {
  await db
    .delete(productWaitlist)
    .where(
      and(eq(productWaitlist.productId, productId), eq(productWaitlist.customerId, customerId))
    );
}

export async function getMyWaitlist(customerId: string, region: 'UZB' | 'KOR') {
  const rows = await db
    .select()
    .from(productWaitlist)
    .where(and(eq(productWaitlist.customerId, customerId), eq(productWaitlist.regionCode, region)));
  const latestRate = await getCachedLatestRate();

  const results = [];
  for (const row of rows) {
    const p = await storefrontRepository.findProductById(row.productId);
    if (!p) continue;

    const config = (p as any).configs.find((c: any) => c.regionCode === region);
    if (!config) continue;

    const availableStock = await inventoryRepository.getAvailableStock(p.id);

    let calculatedPrice = '0';
    let wholesalePrice = '0';
    if (region === 'UZB' && latestRate) {
      const { productPrice, cargoFee } = calculateUzbPrice(
        BigInt(config.retailPrice),
        p.weightGrams,
        latestRate
      );
      calculatedPrice = (productPrice + cargoFee).toString();

      const wsPrices = calculateUzbPrice(BigInt(config.wholesalePrice), p.weightGrams, latestRate);
      wholesalePrice = (wsPrices.productPrice + wsPrices.cargoFee).toString();
    } else {
      calculatedPrice = calculateKorPrice(BigInt(config.retailPrice)).toString();
      wholesalePrice = calculateKorPrice(BigInt(config.wholesalePrice)).toString();
    }

    results.push({
      id: row.id,
      product: {
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
        wholesalePrice,
        minWholesaleQty: config.minWholesaleQty,
        weightGrams: p.weightGrams,
        inStock: availableStock > 0,
      },
    });
  }
  return results;
}

export async function cancelOrder(orderId: string, customerId: string) {
  const order = await ordersRepository.findById(orderId);
  if (!order || order.customerId !== customerId) throw new NotFoundError('Buyurtma topilmadi');
  if (order.status !== 'PENDING_PAYMENT' && order.status !== 'PAYMENT_SUBMITTED') {
    throw new BadRequestError("Bu buyurtmani bekor qilib bo'lmaydi");
  }

  const result = await ordersService.updateOrderStatus(orderId, { to: 'CANCELED' });

  process.nextTick(async () => {
    try {
      const customer = await db.query.customers.findFirst({ where: eq(customers.id, customerId) });
      const { sendToAdmin } = await import('../../common/services/telegram.service');
      await sendToAdmin(`❌ Buyurtma bekor qilindi: ${order.orderNumber} — ${customer?.fullName}`);
    } catch (e) {
      logger.error({ e }, 'Failed to send order cancellation admin notification');
    }
  });

  return result;
}

export async function uploadOrderReceipt(
  orderId: string,
  customerId: string,
  paymentProofUrl: string
) {
  const order = await ordersRepository.findById(orderId);
  if (!order || order.customerId !== customerId) throw new NotFoundError('Buyurtma topilmadi');

  if (order.status !== 'PENDING_PAYMENT') {
    throw new BadRequestError("Faqat to'lov kutilayotgan buyurtmaga chek yuborish mumkin");
  }

  await db
    .update(orders)
    .set({
      paymentReceiptUrl: paymentProofUrl,
      paymentSubmittedAt: new Date(),
      updatedAt: new Date(),
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
