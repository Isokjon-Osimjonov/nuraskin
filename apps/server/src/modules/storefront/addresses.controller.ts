import type { Request, Response } from 'express';
import * as service from './addresses.service';
import { createAddressSchema, updateAddressSchema } from '@nuraskin/shared-types';

export async function list(req: Request, res: Response) {
  const customerId = (req as any).customer.id;
  const result = await service.list(customerId);
  res.json(result);
}

export async function create(req: Request, res: Response) {
  const customerId = (req as any).customer.id;
  const input = createAddressSchema.parse(req.body);
  const result = await service.create(customerId, input);
  res.status(201).json(result);
}

export async function update(req: Request, res: Response) {
  const customerId = (req as any).customer.id;
  const addressId = req.params.id;
  const input = updateAddressSchema.parse(req.body);
  const result = await service.update(customerId, addressId, input);
  res.json(result);
}

export async function remove(req: Request, res: Response) {
  const customerId = (req as any).customer.id;
  const addressId = req.params.id;
  const result = await service.remove(customerId, addressId);
  res.json(result);
}

export async function setDefault(req: Request, res: Response) {
  const customerId = (req as any).customer.id;
  const addressId = req.params.id;
  const result = await service.setDefault(customerId, addressId);
  res.json(result);
}
