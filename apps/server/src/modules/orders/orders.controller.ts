import type { Request, Response } from 'express';
import * as service from './orders.service';
import * as orderExpensesService from './order-expenses.service';
import { addOrderItemSchema, updateOrderStatusSchema, scanItemSchema, createOrderExpenseSchema } from '@nuraskin/shared-types';

export async function listOrders(req: Request, res: Response) {
  const filters = {
    customerId: req.query.customerId as string,
    status: req.query.status as string,
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 20,
  };
  const result = await service.getOrders(filters);
  res.json(result);
}

export async function getOrder(req: Request, res: Response) {
  const result = await service.getOrderDetail(req.params.id);
  res.json(result);
}

export async function createOrder(req: Request, res: Response) {
  // admin create order logic...
  // Usually admins create DRAFT orders
  const result = await service.createOrder(req.body);
  res.status(201).json(result);
}

export async function addItem(req: Request, res: Response) {
  const input = addOrderItemSchema.parse(req.body);
  const result = await service.addOrderItem(req.params.id, input);
  res.json(result);
}

export async function removeItem(req: Request, res: Response) {
  const result = await service.removeOrderItem(req.params.id, req.params.itemId);
  res.json(result);
}

export async function updateStatus(req: Request, res: Response) {
  const input = updateOrderStatusSchema.parse(req.body);
  const adminId = req.user?.sub;
  const result = await service.updateOrderStatus(req.params.id, input, adminId);
  res.json(result);
}

export async function scanItem(req: Request, res: Response) {
  const input = scanItemSchema.parse(req.body);
  const adminId = req.user?.sub;
  // implement logic in service if needed, or placeholder
  // const result = await service.scanItem(req.params.id, input, adminId);
  res.json({ success: true });
}

export async function completePacking(req: Request, res: Response) {
    const adminId = req.user?.sub;
    const result = await service.completePacking(req.params.id, adminId);
    res.json(result);
}

export async function getOrderExpenses(req: Request, res: Response) {
  const result = await orderExpensesService.getOrderExpenses(req.params.id);
  res.json(result);
}

export async function createOrderExpense(req: Request, res: Response) {
  const input = createOrderExpenseSchema.parse(req.body);
  const adminId = req.user?.sub!;
  const result = await orderExpensesService.createOrderExpense(req.params.id, input, adminId);
  res.status(201).json(result);
}

export async function deleteOrderExpense(req: Request, res: Response) {
  const adminId = req.user?.sub!;
  const isAdminSuper = req.user?.role === 'SUPER_ADMIN';
  const result = await orderExpensesService.deleteOrderExpense(req.params.id, req.params.expenseId, adminId, isAdminSuper);
  res.json(result);
}

