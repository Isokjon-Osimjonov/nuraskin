import { db, categories, products } from '@nuraskin/database';
import { eq, isNull, and, sql } from 'drizzle-orm';
import type { Category, NewCategory } from '@nuraskin/database';

export interface CategoryWithProductCount extends Category {
  productCount: number;
}

export async function findAll(): Promise<CategoryWithProductCount[]> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      imageUrl: categories.imageUrl,
      isActive: categories.isActive,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      deletedAt: categories.deletedAt,
      productCount: sql<number>`cast(count(${products.id}) as integer)`,
    })
    .from(categories)
    .leftJoin(products, and(eq(categories.id, products.categoryId), isNull(products.deletedAt)))
    .where(isNull(categories.deletedAt))
    .groupBy(categories.id);

  return rows;
}

export async function findById(id: string): Promise<CategoryWithProductCount | null> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      imageUrl: categories.imageUrl,
      isActive: categories.isActive,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      deletedAt: categories.deletedAt,
      productCount: sql<number>`cast(count(${products.id}) as integer)`,
    })
    .from(categories)
    .leftJoin(products, and(eq(categories.id, products.categoryId), isNull(products.deletedAt)))
    .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
    .groupBy(categories.id)
    .limit(1);

  return rows[0] ?? null;
}

export async function findBySlug(slug: string): Promise<Category | null> {
  const rows = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), isNull(categories.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

export async function create(data: NewCategory): Promise<CategoryWithProductCount> {
  const [category] = await db.insert(categories).values(data).returning();
  if (!category) throw new Error('Failed to create category');
  return { ...category, productCount: 0 };
}

export async function update(id: string, data: Partial<Category>): Promise<Category> {
  const updateData = { ...data, updatedAt: new Date() };
  const [category] = await db
    .update(categories)
    .set(updateData)
    .where(eq(categories.id, id))
    .returning();

  if (!category) throw new Error('Category not found');
  return category;
}

export async function softDelete(id: string): Promise<void> {
  await db.update(categories).set({ deletedAt: new Date() }).where(eq(categories.id, id));
}
