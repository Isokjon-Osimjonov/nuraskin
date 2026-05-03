import type { Request, Response } from 'express';
import * as service from './storefront.service';
import { createStorefrontOrderSchema, validateCouponInputSchema } from '@nuraskin/shared-types';
import jwt from 'jsonwebtoken';
import { env } from '../../common/config/env';

function getRegion(req: Request): 'UZB' | 'KOR' {
  return (req.query.region as 'UZB' | 'KOR') || 'UZB';
}

async function tryGetCustomerId(req: Request): Promise<string | undefined> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return undefined;
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, env.JWT_SECRET);
    const customer = await service.findCustomerByTelegramId(BigInt(decoded.sub));
    return customer?.id;
  } catch {
    return undefined;
  }
}

export async function listProducts(req: Request, res: Response) {
  const region = getRegion(req);
  const categoryId = req.query.categoryId as string;
  const search = req.query.search as string;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  const customerId = await tryGetCustomerId(req);
  const result = await service.listProducts(region, categoryId, search, customerId, limit);
  res.json(result);
}

export async function getProduct(req: Request, res: Response) {
  const region = getRegion(req);
  const customerId = await tryGetCustomerId(req);
  const result = await service.getProductBySlug(req.params.slug, region); // sync with service
  res.json(result);
}

export async function getSettings(req: Request, res: Response) {
  const result = await service.getPublicSettings();
  res.json(result);
}

export async function getLatestRates(req: Request, res: Response) {
  const result = await service.getLatestRates();
  res.json(result);
}

export async function listShippingTiers(req: Request, res: Response) {
  const result = await service.listShippingTiers(); // sync with service
  res.json(result);
}

export async function validateCoupon(req: Request, res: Response) {
    const input = validateCouponInputSchema.parse(req.body);
    const customerId = (req as any).customer.id;
    const region = (req as any).customer.regionCode || 'UZB';
    const result = await service.validateCoupon(input, customerId, region);
    res.json(result);
}

export async function createOrder(req: Request, res: Response) {
  const input = createStorefrontOrderSchema.parse(req.body);
  const customerId = (req as any).customer.id;
  const result = await service.createOrder(customerId, input);
  res.status(201).json(result);
}

export async function cancelOrder(req: Request, res: Response) {
  const customerId = (req as any).customer.id;
  const orderId = req.params.id;
  const result = await service.cancelOrder(orderId, customerId);
  res.json(result);
}

export async function uploadReceipt(req: Request, res: Response) {
  const customerId = (req as any).customer.id;
  const orderId = req.params.id;
  const { payment_proof_url } = req.body;
  const result = await service.uploadOrderReceipt(orderId, customerId, payment_proof_url);
  res.json(result);
}

export async function getReceipt(req: Request, res: Response) {
  const customerId = (req as any).customer.id;
  const orderId = req.params.id;
  const result = await service.getOrderReceipt(orderId, customerId);
  if (!result) {
    res.status(404).json({ error: 'Chek topilmadi' });
    return;
  }
  res.json({ receipt_url: result });
}

export async function getMyOrders(req: Request, res: Response) {
  const customerId = (req as any).customer.id;
  const result = await service.getMyOrders(customerId);
  res.json(result);
}

export async function getOrder(req: Request, res: Response) {
  const customerId = (req as any).customer.id;
  const result = await service.getOrderDetails(req.params.id, customerId);
  res.json(result);
}

export async function addToWaitlist(req: Request, res: Response) {
  const customerId = (req as any).customer.id;
  const region = getRegion(req);
  const { productId } = req.body;
  await service.addToWaitlist(productId, customerId, region);
  res.status(201).end();
}

export async function removeFromWaitlist(req: Request, res: Response) {
  const customerId = (req as any).customer.id;
  const productId = req.params.productId;
  await service.removeFromWaitlist(productId, customerId);
  res.status(204).end();
}

export async function getMyWaitlist(req: Request, res: Response) {
  const customerId = (req as any).customer.id;
  const region = getRegion(req);
  const result = await service.getMyWaitlist(customerId, region);
  res.json(result);
}

export async function searchJuso(req: Request, res: Response) {
  const q = req.query.q as string;
  if (!q || q.length < 2) {
    res.json({ results: [], fallback: true });
    return;
  }
  const result = await service.searchJuso(q);
  res.json(result);
}
