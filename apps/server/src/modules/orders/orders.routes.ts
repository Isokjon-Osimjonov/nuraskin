import { Router } from 'express';
import * as ctrl from './orders.controller';
import { asyncHandler } from '../../common/utils/async-handler';
import { requireAuth, requirePermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('orders:read'), asyncHandler(ctrl.listOrders));
router.post('/', requirePermission('orders:write'), asyncHandler(ctrl.createOrder));
router.get('/:id', requirePermission('orders:read'), asyncHandler(ctrl.getOrder));
router.post('/:id/items', requirePermission('orders:write'), asyncHandler(ctrl.addItem));
router.delete('/:id/items/:itemId', requirePermission('orders:write'), asyncHandler(ctrl.removeItem));
router.patch('/:id/status', requirePermission('orders:write'), asyncHandler(ctrl.updateStatus));
router.post('/:id/scan', requirePermission('inventory:write'), asyncHandler(ctrl.scanItem));
router.post('/:id/complete-packing', requirePermission('inventory:write'), asyncHandler(ctrl.completePacking));

router.get('/:id/expenses', requirePermission('orders:read'), asyncHandler(ctrl.getOrderExpenses));
router.post('/:id/expenses', requirePermission('orders:write'), asyncHandler(ctrl.createOrderExpense));
router.delete('/:id/expenses/:expenseId', requirePermission('orders:write'), asyncHandler(ctrl.deleteOrderExpense));

export default router;
