import {
  db,
  carts,
  cartItems,
  products,
  productRegionalConfigs,
  exchangeRateSnapshots,
  inventoryBatches,
} from '@nuraskin/database';
import { eq, and, desc, sql } from 'drizzle-orm';
import { calculateUzbPrice, calculateKorPrice } from '../../common/utils/pricing';
import {
  getActiveBoxes,
  getWeightScalingFactor,
} from '../../common/utils/box-recommendation';

export async function findByCustomerId(customerId: string, tx: any = db) {
  const [cart] = await tx.select().from(carts).where(eq(carts.customerId, customerId)).limit(1);

  if (!cart) return null;

  const items = await tx
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      productName: products.name,
      imageUrls: products.imageUrls,
      quantity: cartItems.quantity,
      priceSnapshot: cartItems.priceSnapshot,
      weightGrams: products.weightGrams,
      slug: products.barcode,
      retailPrice: productRegionalConfigs.retailPrice,
      wholesalePrice: productRegionalConfigs.wholesalePrice,
      minWholesaleQty: productRegionalConfigs.minWholesaleQty,
      currency: productRegionalConfigs.currency,
      totalStock: sql<number>`coalesce(sum(${inventoryBatches.currentQty})::int, 0)`,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .leftJoin(
      productRegionalConfigs,
      and(
        eq(products.id, productRegionalConfigs.productId),
        eq(productRegionalConfigs.regionCode, cart.regionCode)
      )
    )
    .leftJoin(inventoryBatches, eq(products.id, inventoryBatches.productId))
    .where(eq(cartItems.cartId, cart.id))
    .groupBy(
      cartItems.id,
      products.name,
      products.imageUrls,
      products.weightGrams,
      products.barcode,
      productRegionalConfigs.retailPrice,
      productRegionalConfigs.wholesalePrice,
      productRegionalConfigs.minWholesaleQty,
      productRegionalConfigs.currency
    );

  const totalProductWeight = items.reduce(
    (acc, item) => acc + (item.weightGrams || 0) * item.quantity,
    0
  );
  const activeBoxes = cart.regionCode === 'UZB' ? await getActiveBoxes() : [];
  const scalingFactor = getWeightScalingFactor(totalProductWeight, activeBoxes);

  let total = 0n;

  const rateSnapshot = await getLatestRateSnapshot(tx);

  const formattedItems = items.map((item: any) => {
    let calculatedRetail = '0';
    let calculatedWholesale = '0';
    let displayPrice = BigInt(item.priceSnapshot);

    if (cart.regionCode === 'UZB' && rateSnapshot) {
      const adjustedWeight = item.weightGrams * scalingFactor;

      const rPrices = calculateUzbPrice(
        BigInt(item.retailPrice || 0),
        adjustedWeight,
        rateSnapshot
      );
      calculatedRetail = (rPrices.productPrice + rPrices.cargoFee).toString();

      const wPrices = calculateUzbPrice(
        BigInt(item.wholesalePrice || 0),
        adjustedWeight,
        rateSnapshot
      );
      calculatedWholesale = (wPrices.productPrice + wPrices.cargoFee).toString();

      // Recalculate display price based on current quantity tier and scaling
      const isWholesale = item.quantity >= (item.minWholesaleQty || 5);
      const basePrice = isWholesale ? BigInt(item.wholesalePrice) : BigInt(item.retailPrice);
      const { productPrice, cargoFee } = calculateUzbPrice(
        basePrice,
        adjustedWeight,
        rateSnapshot
      );
      displayPrice = productPrice + cargoFee;
    } else {
      calculatedRetail = calculateKorPrice(BigInt(item.retailPrice || 0)).toString();
      calculatedWholesale = calculateKorPrice(BigInt(item.wholesalePrice || 0)).toString();
    }

    const subtotal = displayPrice * BigInt(item.quantity);
    total += subtotal;

    return {
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productImage: item.imageUrls?.[0] || null,
      imageUrls: item.imageUrls,
      quantity: item.quantity,
      priceSnapshot: item.priceSnapshot.toString(),
      price: displayPrice.toString(),
      subtotal: subtotal.toString(),
      weightGrams: item.weightGrams,
      slug: item.slug,
      retailPrice: calculatedRetail,
      wholesalePrice: calculatedWholesale,
      minWholesaleQty: item.minWholesaleQty,
      currency: item.currency || cart.regionCode,
      availableStock: item.totalStock,
    };
  });

  return {
    id: cart.id,
    customerId: cart.customerId,
    regionCode: cart.regionCode,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    items: formattedItems,
    total: total.toString(),
  };
}

export async function createCart(customerId: string, regionCode: string, tx: any = db) {
  const [cart] = await tx.insert(carts).values({ customerId, regionCode }).returning();
  return cart;
}

export async function findItem(cartId: string, productId: string, tx: any = db) {
  const [item] = await tx
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)))
    .limit(1);
  return item || null;
}

export async function findItemById(itemId: string, tx: any = db) {
  const [item] = await tx.select().from(cartItems).where(eq(cartItems.id, itemId)).limit(1);
  return item || null;
}

export async function addItem(
  cartId: string,
  productId: string,
  quantity: number,
  priceSnapshot: bigint,
  tx: any = db
) {
  const [inserted] = await tx
    .insert(cartItems)
    .values({ cartId, productId, quantity, priceSnapshot })
    .returning();
  return inserted;
}

export async function updateItemQuantity(
  itemId: string,
  quantity: number,
  priceSnapshot: bigint,
  tx: any = db
) {
  const [updated] = await tx
    .update(cartItems)
    .set({ quantity, priceSnapshot, updatedAt: new Date() })
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

export async function updateCartRegion(cartId: string, regionCode: string, tx: any = db) {
  const [updated] = await tx
    .update(carts)
    .set({ regionCode, updatedAt: new Date() })
    .where(eq(carts.id, cartId))
    .returning();
  return updated;
}

export async function getRegionalPrice(productId: string, regionCode: string, tx: any = db) {
  const [config] = await tx
    .select({ retailPrice: productRegionalConfigs.retailPrice })
    .from(productRegionalConfigs)
    .where(
      and(
        eq(productRegionalConfigs.productId, productId),
        eq(productRegionalConfigs.regionCode, regionCode)
      )
    )
    .limit(1);
  return config?.retailPrice || null;
}

export async function getLatestRateSnapshot(tx: any = db) {
  const [rate] = await tx
    .select()
    .from(exchangeRateSnapshots)
    .orderBy(desc(exchangeRateSnapshots.createdAt))
    .limit(1);
  return rate || null;
}
