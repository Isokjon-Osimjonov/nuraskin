import * as repository from './carts.repository';
import * as storefrontRepository from '../storefront/storefront.repository';
import { db, inventoryBatches, productRegionalConfigs } from '@nuraskin/database';
import { BadRequestError, NotFoundError, ConflictError } from '../../common/errors/AppError';
import {
  calculateUzbPrice,
  calculateKorPrice,
  calculateBoxFeeUzs,
} from '../../common/utils/pricing';
import { getActiveBoxes } from '../../common/utils/box-recommendation';
import { eq, and, sql } from 'drizzle-orm';

async function getAvailableStock(productId: string, tx: any = db) {
  const [stockRow] = await tx
    .select({ total: sql<number>`coalesce(sum(${inventoryBatches.currentQty})::int, 0)` })
    .from(inventoryBatches)
    .where(eq(inventoryBatches.productId, productId));
  return stockRow?.total || 0;
}

export async function getCart(customerId: string) {
  return await repository.findByCustomerId(customerId);
}

export async function getBoxOptions(customerId: string) {
  const cart = await repository.findByCustomerId(customerId);
  if (!cart || cart.regionCode !== 'UZB') return null;

  const totalProductWeight = cart.items.reduce(
    (acc, item) => acc + (item.weightGrams || 0) * item.quantity,
    0
  );

  const activeBoxes = await getActiveBoxes();
  const latestRate = await repository.getLatestRateSnapshot();
  if (!latestRate) return null;

  const rateData = {
    krwToUzs: parseFloat(latestRate.krwToUzs),
    cargoRateKrwPerKg: latestRate.cargoRateKrwPerKg,
  };

  const largestBox = [...activeBoxes].sort((a, b) => b.maxWeightGrams - a.maxWeightGrams)[0];

  if (totalProductWeight > largestBox.maxWeightGrams) {
    const quantityNeeded = Math.ceil(totalProductWeight / largestBox.maxWeightGrams);
    const singleBoxFee = calculateBoxFeeUzs(largestBox, rateData);

    return {
      multiBoxRequired: true,
      boxId: largestBox.id,
      boxName: largestBox.name,
      boxLabel: largestBox.label,
      quantityNeeded,
      feeUzs: (singleBoxFee * BigInt(quantityNeeded)).toString(),
    };
  }

  const options = activeBoxes.map(box => {
    const isEligible = box.maxWeightGrams >= totalProductWeight;
    const feeUzs = calculateBoxFeeUzs(box, rateData);

    return {
      boxId: box.id,
      name: box.name,
      label: box.label,
      maxWeightGrams: box.maxWeightGrams,
      eligible: isEligible,
      feeUzs: feeUzs.toString(),
      isRecommended: false,
    };
  });

  // Smallest eligible box is recommended
  const recommended = [...options]
    .filter(o => o.eligible)
    .sort((a, b) => a.maxWeightGrams - b.maxWeightGrams)[0];

  if (recommended) {
    recommended.isRecommended = true;
  }

  return {
    multiBoxRequired: false,
    options,
  };
}

export async function addToCart(
  customerId: string,
  productId: string,
  quantity: number,
  incomingRegionCode: string
) {
  const product = await storefrontRepository.findProductById(productId);
  if (!product) throw new NotFoundError('Mahsulot topilmadi');

  if (quantity <= 0) throw new BadRequestError("Miqdor musbat bo'lishi shart");

  return await db.transaction(async tx => {
    let cart = await repository.findByCustomerId(customerId, tx);
    let currentRegion = incomingRegionCode;

    if (cart) {
      // Cart has items AND region differs -> block
      if (cart.items.length > 0 && cart.regionCode !== incomingRegionCode) {
        throw new ConflictError(
          "Savatingiz boshqa mintaqa uchun. Mintaqani o'zgartirish uchun savatni bo'shating.",
          'REGION_MISMATCH',
          { cart_region: cart.regionCode }
        );
      }

      // Cart is empty AND region differs -> update region
      if (cart.items.length === 0 && cart.regionCode !== incomingRegionCode) {
        await repository.updateCartRegion(cart.id, incomingRegionCode, tx);
        currentRegion = incomingRegionCode;
      } else {
        currentRegion = cart.regionCode;
      }
    } else {
      cart = await repository.createCart(customerId, incomingRegionCode, tx);
    }

    const item = cart ? await repository.findItem(cart.id, productId, tx) : null;
    const currentQty = item ? item.quantity : 0;
    const newQty = currentQty + quantity;

    const availableStock = await getAvailableStock(productId, tx);
    if (newQty > availableStock) {
      throw new BadRequestError(`INSUFFICIENT_STOCK: Faqat ${availableStock} ta mavjud`);
    }

    const config = await db.query.productRegionalConfigs.findFirst({
      where: and(
        eq(productRegionalConfigs.productId, productId),
        eq(productRegionalConfigs.regionCode, currentRegion)
      ),
    });

    if (!config) {
      throw new BadRequestError('Bu mahsulot bu mintaqada mavjud emas');
    }

    const isWholesale = newQty >= config.minWholesaleQty;
    const basePrice = isWholesale ? BigInt(config.wholesalePrice) : BigInt(config.retailPrice);

    let priceSnapshot: bigint;

    if (currentRegion === 'UZB') {
      const rateSnapshot = await repository.getLatestRateSnapshot(tx);
      if (!rateSnapshot) {
        throw new BadRequestError('Valyuta kursi topilmadi');
      }

      const { productPrice, cargoFee } = calculateUzbPrice(
        basePrice,
        product?.weightGrams || 0,
        rateSnapshot
      );
      priceSnapshot = productPrice + cargoFee;
    } else {
      priceSnapshot = calculateKorPrice(basePrice);
    }

    if (item) {
      await repository.updateItemQuantity(item.id, newQty, priceSnapshot, tx);
    } else {
      await repository.addItem(cart.id, productId, quantity, priceSnapshot, tx);
    }

    return await repository.findByCustomerId(customerId, tx);
  });
}

export async function updateItemQuantity(customerId: string, itemId: string, quantity: number) {
  if (quantity < 0) throw new BadRequestError("Miqdor manfiy bo'lishi mumkin emas");

  return await db.transaction(async tx => {
    const cart = await repository.findByCustomerId(customerId, tx);
    if (!cart) throw new NotFoundError('Savat topilmadi');

    const item = await repository.findItemById(itemId, tx);
    if (!item || item.cartId !== cart.id) throw new NotFoundError('Mahsulot savatda topilmadi');

    const productId = item.productId;

    if (quantity === 0) {
      await repository.removeItem(item.id, tx);
    } else {
      const availableStock = await getAvailableStock(productId, tx);
      if (quantity > availableStock) {
        throw new BadRequestError(`INSUFFICIENT_STOCK: Faqat ${availableStock} ta mavjud`);
      }

      const config = await db.query.productRegionalConfigs.findFirst({
        where: and(
          eq(productRegionalConfigs.productId, productId),
          eq(productRegionalConfigs.regionCode, cart.regionCode)
        ),
      });

      if (!config) {
        throw new BadRequestError('Bu mahsulot bu mintaqada mavjud emas');
      }

      const isWholesale = quantity >= config.minWholesaleQty;
      const basePrice = isWholesale ? BigInt(config.wholesalePrice) : BigInt(config.retailPrice);

      let priceSnapshot: bigint;

      if (cart.regionCode === 'UZB') {
        const rateSnapshot = await repository.getLatestRateSnapshot(tx);
        if (!rateSnapshot) {
          throw new BadRequestError('Valyuta kursi topilmadi');
        }
        const product = await storefrontRepository.findProductById(productId);

        const { productPrice, cargoFee } = calculateUzbPrice(
          basePrice,
          product?.weightGrams || 0,
          rateSnapshot
        );
        priceSnapshot = productPrice + cargoFee;
      } else {
        priceSnapshot = calculateKorPrice(basePrice);
      }

      await repository.updateItemQuantity(item.id, quantity, priceSnapshot, tx);
    }

    return await repository.findByCustomerId(customerId, tx);
  });
}

export async function removeItem(customerId: string, itemId: string) {
  return await db.transaction(async tx => {
    const cart = await repository.findByCustomerId(customerId, tx);
    if (!cart) throw new NotFoundError('Savat topilmadi');

    const item = await repository.findItemById(itemId, tx);
    if (!item || item.cartId !== cart.id) throw new NotFoundError('Mahsulot savatda topilmadi');

    await repository.removeItem(item.id, tx);
    return await repository.findByCustomerId(customerId, tx);
  });
}

export async function clearCart(customerId: string, regionCode?: string, txIn?: any) {
  const runner = txIn || db;
  const cart = await repository.findByCustomerId(customerId, runner);
  if (cart) {
    await repository.clearItems(cart.id, runner);
    if (regionCode) {
      await repository.updateCartRegion(cart.id, regionCode, runner);
    }
  }
  return cart ? await repository.findByCustomerId(customerId, runner) : null;
}
