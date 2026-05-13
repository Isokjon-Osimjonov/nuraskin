import type { Request, Response } from 'express';
import * as service from './settings.service';
import { updateSettingsSchema, korShippingTierSchema, updatePaymentInfoSchema } from '@nuraskin/shared-types';

export async function get(req: Request, res: Response) {
  const result = await service.getSettings();
  res.json(result);
}

export async function update(req: Request, res: Response) {
  const input = updateSettingsSchema.parse(req.body);
  const result = await service.updateSettings(input);
  res.json(result);
}

export async function getPaymentInfo(req: Request, res: Response) {
  const result = await service.getSettings();
  res.json({
    korBankEnabled: result.korBankEnabled,
    korBankName: result.korBankName,
    korBankHolder: result.korBankHolder,
    korBankNumber: result.korBankNumber,
    korE9payEnabled: result.korE9payEnabled,
    korE9payName: result.korE9payName,
    korE9payAccount: result.korE9payAccount,
    uzbBankEnabled: result.uzbBankEnabled,
    uzbBankName: result.uzbBankName,
    uzbBankHolder: result.uzbBankHolder,
    uzbBankNumber: result.uzbBankNumber,
    uzbE9payEnabled: result.uzbE9payEnabled,
    uzbE9payName: result.uzbE9payName,
    uzbE9payAccount: result.uzbE9payAccount,
  });
}

export async function updatePaymentInfo(req: Request, res: Response) {
  const input = updatePaymentInfoSchema.parse(req.body);
  const result = await service.updateSettings(input as any); // uses the same update logic
  res.json(result);
}

// Korea Shipping Tiers
export async function listTiers(req: Request, res: Response) {
  const result = await service.listShippingTiers();
  res.json(result);
}

export async function createTier(req: Request, res: Response) {
  const input = korShippingTierSchema.parse(req.body);
  const result = await service.createShippingTier(input);
  res.status(201).json(result);
}

export async function updateTier(req: Request, res: Response) {
  const input = korShippingTierSchema.partial().parse(req.body);
  const result = await service.updateShippingTier(req.params.id, input);
  res.json(result);
}

export async function removeTier(req: Request, res: Response) {
  await service.deleteShippingTier(req.params.id);
  res.status(204).end();
}
