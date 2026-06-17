import * as repository from './settings.repository';
import type {
  UpdateSettingsInput,
  KorShippingTierInput,
  ShippingBoxInput,
} from '@nuraskin/shared-types';
import * as storefrontService from '../storefront/storefront.service';

export async function getSettings() {
  return await repository.get();
}

export async function updateSettings(input: UpdateSettingsInput) {
  const data: any = {};
  if (input.debtLimitDefault !== undefined)
    data.debtLimitDefault = BigInt(Math.round(input.debtLimitDefault));
  if (input.lowStockThreshold !== undefined) data.lowStockThreshold = input.lowStockThreshold;
  if (input.adminCardNumber !== undefined) data.adminCardNumber = input.adminCardNumber;
  if (input.adminCardHolder !== undefined) data.adminCardHolder = input.adminCardHolder;
  if (input.adminCardBank !== undefined) data.adminCardBank = input.adminCardBank;
  if (input.adminPhone !== undefined) data.adminPhone = input.adminPhone;
  if (input.telegramUrl !== undefined) data.telegramUrl = input.telegramUrl;
  if (input.instagramUrl !== undefined) data.instagramUrl = input.instagramUrl;
  if (input.websiteUrl !== undefined) data.websiteUrl = input.websiteUrl;
  if (input.paymentTimeoutMinutes !== undefined)
    data.paymentTimeoutMinutes = input.paymentTimeoutMinutes;

  if (input.korBankEnabled !== undefined) data.korBankEnabled = input.korBankEnabled;
  if (input.korBankName !== undefined) data.korBankName = input.korBankName;
  if (input.korBankHolder !== undefined) data.korBankHolder = input.korBankHolder;
  if (input.korBankNumber !== undefined) data.korBankNumber = input.korBankNumber;
  if (input.korE9payEnabled !== undefined) data.korE9payEnabled = input.korE9payEnabled;
  if (input.korE9payName !== undefined) data.korE9payName = input.korE9payName;
  if (input.korE9payAccount !== undefined) data.korE9payAccount = input.korE9payAccount;

  if (input.uzbBankEnabled !== undefined) data.uzbBankEnabled = input.uzbBankEnabled;
  if (input.uzbBankName !== undefined) data.uzbBankName = input.uzbBankName;
  if (input.uzbBankHolder !== undefined) data.uzbBankHolder = input.uzbBankHolder;
  if (input.uzbBankNumber !== undefined) data.uzbBankNumber = input.uzbBankNumber;
  if (input.uzbE9payEnabled !== undefined) data.uzbE9payEnabled = input.uzbE9payEnabled;
  if (input.uzbE9payName !== undefined) data.uzbE9payName = input.uzbE9payName;
  if (input.uzbE9payAccount !== undefined) data.uzbE9payAccount = input.uzbE9payAccount;

  // These are inputs from admin in whole units (som / KRW).
  // For UZS we convert to minor units (tiyin).
  // For KRW we keep as whole units.
  if (input.minOrderUzbUzs !== undefined)
    data.minOrderUzbUzs = BigInt(Math.round(input.minOrderUzbUzs * 100));
  if (input.minOrderKorKrw !== undefined)
    data.minOrderKorKrw = BigInt(Math.round(input.minOrderKorKrw));

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

// Delegate shipping boxes to storefront service
export async function listShippingBoxes() {
  return await storefrontService.listShippingBoxes();
}

export async function createShippingBox(input: ShippingBoxInput) {
  return await storefrontService.createShippingBox(input);
}

export async function updateShippingBox(id: string, input: Partial<ShippingBoxInput>) {
  return await storefrontService.updateShippingBox(id, input);
}

export async function deleteShippingBox(id: string) {
  return await storefrontService.deleteShippingBox(id);
}
