import type { Request, Response } from 'express';
import * as service from './expenses.service';
import { createExpenseSchema, updateExpenseSchema } from '@nuraskin/shared-types';

export async function listExpenses(req: Request, res: Response) {
  const month = req.query.month as string;
  const category = req.query.category as string | undefined;
  
  const result = await service.listExpenses(month, category);
  res.json(result);
}

export async function createExpense(req: Request, res: Response) {
  const input = createExpenseSchema.parse(req.body);
  const adminId = req.user?.sub!;
  const result = await service.createExpense(input, adminId);
  res.status(201).json({ ...result, amountKrw: result.amountKrw.toString() });
}

export async function updateExpense(req: Request, res: Response) {
  const input = updateExpenseSchema.parse(req.body);
  const adminId = req.user?.sub!;
  const isAdminSuper = req.user?.role === 'SUPER_ADMIN';
  
  const result = await service.updateExpense(req.params.id, input, adminId, isAdminSuper);
  res.json({ ...result, amountKrw: result.amountKrw.toString() });
}

export async function deleteExpense(req: Request, res: Response) {
  const adminId = req.user?.sub!;
  const isAdminSuper = req.user?.role === 'SUPER_ADMIN';
  const result = await service.deleteExpense(req.params.id, adminId, isAdminSuper);
  res.json(result);
}

export async function getSummary(req: Request, res: Response) {
  const month = req.query.month as string;
  const result = await service.getMonthlyExpenseSummary(month);
  res.json(result);
}

export async function getAccountingSummary(req: Request, res: Response) {
  const month = req.query.month as string;
  const result = await service.getAccountingSummary(month);
  res.json(result);
}

export async function exportAccounting(req: Request, res: Response) {
  const month = req.query.month as string;
  const buffer = await service.exportAccountingToExcel(month);
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="nuraskin-hisobot-${month}.xlsx"`);
  res.send(buffer);
}
