import * as repository from './order-expenses.repository';
import * as ordersRepository from './orders.repository';
import { NotFoundError, ForbiddenError } from '../../common/errors/AppError';
import type { CreateOrderExpenseInput } from '@nuraskin/shared-types';

export async function createOrderExpense(orderId: string, input: CreateOrderExpenseInput, adminId: string) {
  const order = await ordersRepository.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');

  const result = await repository.create({
    orderId,
    type: input.type,
    amountKrw: BigInt(input.amountKrw),
    note: input.note || null,
    createdBy: adminId,
    isAuto: false,
  });
  
  return {
    ...result,
    amountKrw: result.amountKrw.toString()
  };
}

export async function getOrderExpenses(orderId: string) {
  return await repository.findByOrderId(orderId);
}

export async function deleteOrderExpense(orderId: string, expenseId: string, adminId: string, isAdminSuper: boolean) {
  const expense = await repository.findById(expenseId);
  if (!expense || expense.orderId !== orderId) throw new NotFoundError('Order expense not found');

  if (expense.createdBy !== adminId && !isAdminSuper) {
    throw new ForbiddenError('Only SUPER_ADMIN or the creator can delete this expense');
  }

  await repository.deleteById(expenseId);
  return { success: true };
}
