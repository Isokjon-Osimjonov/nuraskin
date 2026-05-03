import * as repository from './carts.repository';
import * as storefrontRepository from '../storefront/storefront.repository';
import { db } from '@nuraskin/database';
import { BadRequestError, NotFoundError, ConflictError } from '../../common/errors/AppError';
import { calculateUzbPrice, calculateKorPrice } from '../../common/utils/pricing';

export async function getCart(customerId: string) {
  return await repository.findByCustomerId(customerId);
}

export async function addToCart(customerId: string, productId: string, quantity: number, incomingRegionCode: string) {
  const product = await storefrontRepository.findProductById(productId);
  if (!product) throw new NotFoundError('Mahsulot topilmadi');

  if (quantity <= 0) throw new BadRequestError('Miqdor musbat bo\'lishi shart');

  return await db.transaction(async (tx) => {
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

    const regionalPrice = await repository.getRegionalPrice(productId, currentRegion, tx);
    if (!regionalPrice) {
      throw new BadRequestError('Bu mahsulot bu mintaqada mavjud emas');
    }

    let priceSnapshot: bigint;

    if (currentRegion === 'UZB') {
      const rateSnapshot = await repository.getLatestRateSnapshot(tx);
      if (!rateSnapshot) {
        throw new BadRequestError('Valyuta kursi topilmadi');
      }
      const { productPrice, cargoFee } = calculateUzbPrice(
        BigInt(regionalPrice),
        product?.weightGrams || 0,
        rateSnapshot
      );
      priceSnapshot = productPrice + cargoFee;
    } else {
      priceSnapshot = calculateKorPrice(BigInt(regionalPrice));
    }

    const item = await repository.findItem(cart.id, productId, tx);
    if (item) {
      await repository.updateItemQuantity(item.id, item.quantity + quantity, priceSnapshot, tx);
    } else {
      await repository.addItem(cart.id, productId, quantity, priceSnapshot, tx);
    }

    return await repository.findByCustomerId(customerId, tx);
  });
}

export async function updateItemQuantity(customerId: string, itemId: string, quantity: number) {
  if (quantity < 0) throw new BadRequestError('Miqdor manfiy bo\'lishi mumkin emas');

  return await db.transaction(async (tx) => {
    const cart = await repository.findByCustomerId(customerId, tx);
    if (!cart) throw new NotFoundError('Savat topilmadi');

    const item = await repository.findItemById(itemId, tx);
    if (!item || item.cartId !== cart.id) throw new NotFoundError('Mahsulot savatda topilmadi');

    const productId = item.productId;

    if (quantity === 0) {
      await repository.removeItem(item.id, tx);
    } else {
      const regionalPrice = await repository.getRegionalPrice(productId, cart.regionCode, tx);
      if (!regionalPrice) {
        throw new BadRequestError('Bu mahsulot bu mintaqada mavjud emas');
      }

      let priceSnapshot: bigint;

      if (cart.regionCode === 'UZB') {
        const rateSnapshot = await repository.getLatestRateSnapshot(tx);
        if (!rateSnapshot) {
          throw new BadRequestError('Valyuta kursi topilmadi');
        }
        const product = await storefrontRepository.findProductById(productId);
        const { productPrice, cargoFee } = calculateUzbPrice(
          BigInt(regionalPrice),
          product?.weightGrams || 0,
          rateSnapshot
        );
        priceSnapshot = productPrice + cargoFee;
      } else {
        priceSnapshot = calculateKorPrice(BigInt(regionalPrice));
      }

      await repository.updateItemQuantity(item.id, quantity, priceSnapshot, tx);
    }

    return await repository.findByCustomerId(customerId, tx);
  });
}

export async function removeItem(customerId: string, itemId: string) {
  return await db.transaction(async (tx) => {
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

