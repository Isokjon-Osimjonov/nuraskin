import type { Product, NewProduct, ProductRegionalConfig } from '@nuraskin/database';
import type { CreateProductInput, UpdateProductInput } from '@nuraskin/shared-types';
import * as repository from './products.repository';
import { NotFoundError } from '../../common/errors/AppError';

export async function listProducts(filters?: {
  categoryId?: string;
  isActive?: boolean;
  search?: string;
  deleted?: boolean;
}) {
  return repository.findAll(filters);
}

export async function getProduct(id: string) {
  const product = await repository.findById(id);
  if (!product) throw new NotFoundError('Product not found');
  return product;
}

export async function getProductByBarcode(barcode: string) {
  const product = await repository.findByBarcode(barcode);
  if (!product) throw new NotFoundError('Product not found');
  return product;
}

export async function createProduct(input: CreateProductInput) {
  const data: NewProduct = {
    barcode: input.barcode,
    sku: input.sku,
    name: input.name,
    brandName: input.brandName,
    categoryId: input.categoryId,
    descriptionUz: input.descriptionUz ?? null,
    howToUseUz: input.howToUseUz ?? null,
    ingredients: input.ingredients ?? [],
    skinTypes: input.skinTypes ?? [],
    benefits: input.benefits ?? [],
    weightGrams: input.weightGrams,
    imageUrls: input.imageUrls,
    isActive: true,
  };

  const regionalConfigs = input.regionalConfigs.map((rc) => ({
    productId: '' as unknown as string,
    regionCode: rc.regionCode,
    // KRW has no cents, store as whole units
    retailPrice: BigInt(Math.round(rc.retailPrice)),
    wholesalePrice: BigInt(Math.round(rc.wholesalePrice)),
    currency: 'KRW',
    minWholesaleQty: rc.minWholesaleQty,
    minOrderQty: rc.minOrderQty,
    isAvailable: true,
  }));

  return repository.create(data, regionalConfigs);
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const existing = await repository.findById(id);
  if (!existing) throw new NotFoundError('Product not found');

  const data: Partial<Product> = {};
  if (input.sku !== undefined) data.sku = input.sku;
  if (input.name !== undefined) data.name = input.name;
  if (input.brandName !== undefined) data.brandName = input.brandName;
  if (input.categoryId !== undefined) data.categoryId = input.categoryId;
  if (input.descriptionUz !== undefined) data.descriptionUz = input.descriptionUz;
  if (input.howToUseUz !== undefined) data.howToUseUz = input.howToUseUz;
  if (input.ingredients !== undefined) data.ingredients = input.ingredients;
  if (input.skinTypes !== undefined) data.skinTypes = input.skinTypes;
  if (input.benefits !== undefined) data.benefits = input.benefits;
  if (input.weightGrams !== undefined) data.weightGrams = input.weightGrams;
  if (input.imageUrls !== undefined) data.imageUrls = input.imageUrls;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  if (input.regionalConfigs) {
    for (const rc of input.regionalConfigs) {
      const rcData: any = {};
      if (rc.retailPrice !== undefined) rcData.retailPrice = Number(rc.retailPrice);
      if (rc.wholesalePrice !== undefined) rcData.wholesalePrice = Number(rc.wholesalePrice);
      rcData.currency = 'KRW';
      if (rc.minWholesaleQty !== undefined) rcData.minWholesaleQty = rc.minWholesaleQty;
      if (rc.minOrderQty !== undefined) rcData.minOrderQty = rc.minOrderQty;
      
      await updateRegionalConfig(id, rc.regionCode, rcData);
    }
  }

  return repository.update(id, data);
}

export async function deleteProduct(id: string) {
  const existing = await repository.findById(id);
  if (!existing) throw new NotFoundError('Product not found');
  await repository.softDelete(id);
}

export async function restoreProduct(id: string) {
  return repository.restore(id);
}

export async function updateRegionalConfig(
  productId: string,
  regionCode: string,
  input: {
    retailPrice?: number;
    wholesalePrice?: number;
    currency?: string;
    minWholesaleQty?: number;
    minOrderQty?: number;
    isAvailable?: boolean;
  },
) {
  const data: Partial<ProductRegionalConfig> = {};
  // KRW has no cents, store as whole units
  if (input.retailPrice !== undefined) data.retailPrice = BigInt(Math.round(input.retailPrice));
  if (input.wholesalePrice !== undefined) data.wholesalePrice = BigInt(Math.round(input.wholesalePrice));
  data.currency = 'KRW';
  if (input.minWholesaleQty !== undefined) data.minWholesaleQty = input.minWholesaleQty;
  if (input.minOrderQty !== undefined) data.minOrderQty = input.minOrderQty;
  if (input.isAvailable !== undefined) data.isAvailable = input.isAvailable;

  return repository.updateRegionalConfig(productId, regionCode, data);
}

export { analyzeImage } from './product-analyzer.service';
export type { AnalyzeImageResult } from './product-analyzer.service';
