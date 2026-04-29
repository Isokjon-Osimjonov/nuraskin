import * as repository from './settings.repository';
import type { UpdateSettingsInput, KorShippingTierInput } from '@nuraskin/shared-types';
import * as storefrontService from '../storefront/storefront.service';

export async function getSettings() {
  return await repository.get();
}

export async function updateSettings(input: UpdateSettingsInput) {
  const data: any = {};
  if (input.debtLimitDefault !== undefined) data.debtLimitDefault = BigInt(Math.round(input.debtLimitDefault)); 
  if (input.lowStockThreshold !== undefined) data.lowStockThreshold = input.lowStockThreshold;
  if (input.adminCardNumber !== undefined) data.adminCardNumber = input.adminCardNumber;
  if (input.adminCardHolder !== undefined) data.adminCardHolder = input.adminCardHolder;
  if (input.adminCardBank !== undefined) data.adminCardBank = input.adminCardBank;
  if (input.adminPhone !== undefined) data.adminPhone = input.adminPhone;
  if (input.telegramUrl !== undefined) data.telegramUrl = input.telegramUrl;
  if (input.instagramUrl !== undefined) data.instagramUrl = input.instagramUrl;
  if (input.websiteUrl !== undefined) data.websiteUrl = input.websiteUrl;
  
  // These are inputs from admin in whole units (som / KRW).
  // For UZS we convert to minor units (tiyin).
  // For KRW we keep as whole units.
  if (input.minOrderUzbUzs !== undefined) data.minOrderUzbUzs = BigInt(Math.round(input.minOrderUzbUzs * 100));
  if (input.minOrderKorKrw !== undefined) data.minOrderKorKrw = BigInt(Math.round(input.minOrderKorKrw));

  return await repository.update(data);
}

// Delegate shipping tiers to storefront service (where logic resides)
export async function listShippingTiers() {
    return await storefrontService.listShippingTiers();
}

export async function createShippingTier(input: KorShippingTierInput) {
    return await storefrontService.createShippingTier(input);
}

export async function updateShippingTier(id: string, input: Partial<KorShippingTierInput>) {
    return await storefrontService.updateShippingTier(id, input);
}

export async function deleteShippingTier(id: string) {
    return await storefrontService.deleteShippingTier(id);
}
