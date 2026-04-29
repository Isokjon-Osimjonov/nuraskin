import { db, carts, cartItems, products, productRegionalConfigs } from '@nuraskin/database';
import { eq, and, sql } from 'drizzle-orm';
import type { Cart, CartItem, NewCart, NewCartItem } from '@nuraskin/database';

export async function findByCustomerId(customerId: string, tx: any = db) {
  const [cart] = await tx
    .select()
    .from(carts)
    .where(eq(carts.customerId, customerId))
    .limit(1);
  return cart || null;
}

export async function createCart(customerId: string, tx: any = db) {
  const [cart] = await tx
    .insert(carts)
    .values({ customerId })
    .returning();
  return cart;
}

export async function getCartWithItems(customerId: string, region: 'UZB' | 'KOR') {
  let cart = await findByCustomerId(customerId);
  if (!cart) {
    cart = await createCart(customerId);
  }

  const items = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      productName: products.name,
      imageUrls: products.imageUrls,
      quantity: cartItems.quantity,
      weightGrams: products.weightGrams,
      slug: products.barcode,
      retailPrice: productRegionalConfigs.retailPrice,
      wholesalePrice: productRegionalConfigs.wholesalePrice,
      minWholesaleQty: productRegionalConfigs.minWholesaleQty,
      currency: productRegionalConfigs.currency,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .innerJoin(productRegionalConfigs, and(
      eq(products.id, productRegionalConfigs.productId),
      eq(productRegionalConfigs.regionCode, region)
    ))
    .where(eq(cartItems.cartId, cart.id));

  return {
    ...cart,
    items: items.map(item => ({
      ...item,
      retailPrice: item.retailPrice.toString(),
      wholesalePrice: item.wholesalePrice.toString(),
    })),
  };
}

export async function findItem(cartId: string, productId: string, tx: any = db) {
  const [item] = await tx
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)))
    .limit(1);
  return item || null;
}

export async function addItem(cartId: string, productId: string, quantity: number, tx: any = db) {
  const [inserted] = await tx
    .insert(cartItems)
    .values({ cartId, productId, quantity })
    .returning();
  return inserted;
}

export async function updateItemQuantity(itemId: string, quantity: number, tx: any = db) {
  const [updated] = await tx
    .update(cartItems)
    .set({ quantity, updatedAt: new Date() })
    .where(eq(cartItems.id, itemId))
    .returning();
  return updated;
}

export async function removeItem(itemId: string, tx: any = db) {
  await tx.delete(cartItems).where(eq(cartItems.id, itemId));
}

export async function clearItems(cartId: string, tx: any = db) {
  await tx.delete(cartItems).where(eq(cartItems.cartId, cartId));
}
