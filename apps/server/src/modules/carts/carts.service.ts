import * as repository from './carts.repository';
import * as storefrontRepository from '../storefront/storefront.repository';
import { db } from '@nuraskin/database';
import { BadRequestError, NotFoundError } from '../../common/errors/AppError';

export async function getCart(customerId: string) {
  return await repository.findByCustomerId(customerId);
}

export async function addToCart(customerId: string, productId: string, quantity: number) {
  const product = await storefrontRepository.findProductById(productId);
  if (!product) throw new NotFoundError('Mahsulot topilmadi');

  if (quantity <= 0) throw new BadRequestError('Miqdor musbat bo\'lishi shart');

  return await db.transaction(async (tx) => {
    let cart = await repository.findByCustomerId(customerId, tx);
    if (!cart) {
      cart = await repository.createCart(customerId, tx);
    }

    const item = await repository.findItem(cart.id, productId, tx);
    if (item) {
      await repository.updateItemQuantity(item.id, item.quantity + quantity, tx);
    } else {
      await repository.addItem(cart.id, productId, quantity, tx);
    }

    return await repository.findByCustomerId(customerId, tx);
  });
}

export async function updateItemQuantity(customerId: string, productId: string, quantity: number) {
  if (quantity < 0) throw new BadRequestError('Miqdor manfiy bo\'lishi mumkin emas');

  return await db.transaction(async (tx) => {
    const cart = await repository.findByCustomerId(customerId, tx);
    if (!cart) throw new NotFoundError('Savat topilmadi');

    const item = await repository.findItem(cart.id, productId, tx);
    if (!item) throw new NotFoundError('Mahsulot savatda topilmadi');

    if (quantity === 0) {
      await repository.removeItem(item.id, tx);
    } else {
      await repository.updateItemQuantity(item.id, quantity, tx);
    }

    return await repository.findByCustomerId(customerId, tx);
  });
}

export async function removeItem(customerId: string, productId: string) {
  return await db.transaction(async (tx) => {
    const cart = await repository.findByCustomerId(customerId, tx);
    if (!cart) throw new NotFoundError('Savat topilmadi');

    const item = await repository.findItem(cart.id, productId, tx);
    if (!item) throw new NotFoundError('Mahsulot savatda topilmadi');

    await repository.removeItem(item.id, tx);
    return await repository.findByCustomerId(customerId, tx);
  });
}

export async function clearCart(customerId: string, tx?: any) {
  const cart = await repository.findByCustomerId(customerId, tx);
  if (cart) {
    await repository.clearItems(cart.id, tx);
  }
}
