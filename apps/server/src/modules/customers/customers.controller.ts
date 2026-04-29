import type { Request, Response } from 'express';
import * as service from './customers.service';
import { customerFiltersSchema, updateCustomerSchema } from '@nuraskin/shared-types';

export async function listCustomers(req: Request, res: Response) {
  const filters = customerFiltersSchema.parse(req.query);
  const result = await service.listCustomersAdmin(filters);
  res.json(result);
}

export async function getCustomer(req: Request, res: Response) {
  const result = await service.getCustomerDetailAdmin(req.params.id);
  res.json(result);
}

export async function updateCustomer(req: Request, res: Response) {
  const input = updateCustomerSchema.parse(req.body);
  const result = await service.updateCustomerAdmin(req.params.id, input);
  res.json(result);
}

export async function deleteCustomer(req: Request, res: Response) {
  await service.deleteCustomerAdmin(req.params.id);
  res.status(204).end();
}
