import { db, products, productRegionalConfigs, inventoryBatches } from '@nuraskin/database';
import { eq, isNull, and, like, or, sql, inArray } from 'drizzle-orm';
import type { Product, NewProduct, ProductRegionalConfig, NewProductRegionalConfig } from '@nuraskin/database';
import { ConflictError, NotFoundError } from '../../common/errors/AppError';

export interface ProductWithStock {
  id: string;
  barcode: string;
  sku: string;
  name: string;
  brandName: string;
  categoryId: string;
  descriptionUz: string | null;
  howToUseUz: string | null;
  ingredients: string[];
  skinTypes: string[];
  benefits: string[];
  weightGrams: number;
  imageUrls: string[];
  isActive: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  totalStock: number;
  uzbRetail: string | null;
  uzbWholesale: string | null;
  korRetail: string | null;
  korWholesale: string | null;
}

export interface ProductDetail extends Omit<ProductWithStock, 'uzbRetail' | 'uzbWholesale' | 'korRetail' | 'korWholesale'> {
  regionalConfigs: any[];
}

export async function findAll(filters?: {
  categoryId?: string;
  isActive?: boolean;
  search?: string;
}): Promise<ProductWithStock[]> {
  const conditions = [isNull(products.deletedAt)];

  if (filters?.categoryId) conditions.push(eq(products.categoryId, filters.categoryId));
  if (filters?.isActive !== undefined) conditions.push(eq(products.isActive, filters.isActive));
  if (filters?.search) {
    const search = `%${filters.search}%`;
    conditions.push(
      or(like(products.name, search), like(products.barcode, search), like(products.sku, search), like(products.brandName, search))!,
    );
  }

  const rows = await db
    .select({
      id: products.id,
      barcode: products.barcode,
      sku: products.sku,
      name: products.name,
      brandName: products.brandName,
      categoryId: products.categoryId,
      descriptionUz: products.descriptionUz,
      howToUseUz: products.howToUseUz,
      ingredients: products.ingredients,
      skinTypes: products.skinTypes,
      benefits: products.benefits,
      weightGrams: products.weightGrams,
      imageUrls: products.imageUrls,
      isActive: products.isActive,
      deletedAt: products.deletedAt,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      totalStock: sql<number>`coalesce(sum(${inventoryBatches.currentQty})::int, 0)`,
    })
    .from(products)
    .leftJoin(inventoryBatches, eq(products.id, inventoryBatches.productId))
    .where(and(...conditions))
    .groupBy(products.id)
    .orderBy(products.name);

  if (rows.length === 0) return [];

  const productIds = rows.map((r) => r.id);
  const allConfigs = await db
    .select()
    .from(productRegionalConfigs)
    .where(inArray(productRegionalConfigs.productId, productIds));

  const configMap = new Map<string, ProductRegionalConfig[]>();
  for (const c of allConfigs) {
    const list = configMap.get(c.productId) ?? [];
    list.push(c);
    configMap.set(c.productId, list);
  }

  return rows.map((p) => {
    const cfg = configMap.get(p.id) ?? [];
    return {
      ...p,
      uzbRetail: cfg.find((c) => c.regionCode === 'UZB')?.retailPrice?.toString() ?? null,
      uzbWholesale: cfg.find((c) => c.regionCode === 'UZB')?.wholesalePrice?.toString() ?? null,
      korRetail: cfg.find((c) => c.regionCode === 'KOR')?.retailPrice?.toString() ?? null,
      korWholesale: cfg.find((c) => c.regionCode === 'KOR')?.wholesalePrice?.toString() ?? null,
    } as ProductWithStock;
  });
}

export async function findById(id: string): Promise<ProductDetail | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), isNull(products.deletedAt)))
    .limit(1);

  if (!product) return null;

  const configs = await db
    .select()
    .from(productRegionalConfigs)
    .where(eq(productRegionalConfigs.productId, id));

  const [stockRow] = await db
    .select({ total: sql<number>`coalesce(sum(${inventoryBatches.currentQty})::int, 0)` })
    .from(inventoryBatches)
    .where(eq(inventoryBatches.productId, id));

  return {
    ...product,
    totalStock: stockRow?.total ?? 0,
    regionalConfigs: configs.map((c) => ({
      ...c,
      retailPrice: c.retailPrice.toString(),
      wholesalePrice: c.wholesalePrice.toString(),
    })),
  } as ProductDetail;
}

export async function findByBarcode(barcode: string): Promise<ProductDetail | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.barcode, barcode), isNull(products.deletedAt)))
    .limit(1);

  if (!product) return null;

  const configs = await db
    .select()
    .from(productRegionalConfigs)
    .where(eq(productRegionalConfigs.productId, product.id));

  const [stockRow] = await db
    .select({ total: sql<number>`coalesce(sum(${inventoryBatches.currentQty})::int, 0)` })
    .from(inventoryBatches)
    .where(eq(inventoryBatches.productId, product.id));

  return {
    ...product,
    totalStock: stockRow?.total ?? 0,
    regionalConfigs: configs.map((c) => ({
      ...c,
      retailPrice: c.retailPrice.toString(),
      wholesalePrice: c.wholesalePrice.toString(),
    })),
  } as ProductDetail;
}

export async function create(
  data: NewProduct,
  regionalConfigs: NewProductRegionalConfig[],
): Promise<Product> {
  const [existingBarcode] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.barcode, data.barcode))
    .limit(1);

  if (existingBarcode) throw new ConflictError('Product with this barcode already exists');

  const [existingSku] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.sku, data.sku))
    .limit(1);

  if (existingSku) throw new ConflictError('Product with this SKU already exists');

  const [product] = await db.insert(products).values(data).returning();
  if (!product) throw new Error('Failed to create product');

  if (regionalConfigs.length > 0) {
    await db.insert(productRegionalConfigs).values(
      regionalConfigs.map((rc) => ({ ...rc, productId: product.id })),
    );
  }

  return product;
}

export async function update(id: string, data: Partial<Product>): Promise<Product> {
  const [updated] = await db
    .update(products)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(products.id, id), isNull(products.deletedAt)))
    .returning();

  if (!updated) throw new NotFoundError('Product not found');
  return updated;
}

export async function softDelete(id: string): Promise<void> {
  const [existing] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, id), isNull(products.deletedAt)))
    .limit(1);

  if (!existing) throw new NotFoundError('Product not found');
  await db.update(products).set({ deletedAt: new Date() }).where(eq(products.id, id));
}

export async function updateRegionalConfig(
  productId: string,
  regionCode: string,
  data: Partial<NewProductRegionalConfig>,
): Promise<ProductRegionalConfig> {
  const [existing] = await db
    .select()
    .from(productRegionalConfigs)
    .where(and(eq(productRegionalConfigs.productId, productId), eq(productRegionalConfigs.regionCode, regionCode)))
    .limit(1);

  if (!existing) throw new NotFoundError('Regional config not found');

  const [updated] = await db
    .update(productRegionalConfigs)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(productRegionalConfigs.productId, productId), eq(productRegionalConfigs.regionCode, regionCode)))
    .returning();

  return updated;
}