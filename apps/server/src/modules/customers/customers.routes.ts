import { Router } from 'express';
import * as ctrl from './customers.controller';
import { asyncHandler } from '../../common/utils/async-handler';
import { requireAuth, requirePermission } from '../../common/middleware/auth.middleware';

const router = Router();

// Admin routes
router.use(requireAuth);
// Admin listing uses GET /api/customers
router.get('/', requirePermission('customers:read'), asyncHandler(ctrl.listCustomers));
router.get('/:id', requirePermission('customers:read'), asyncHandler(ctrl.getCustomer));
router.patch('/:id', requirePermission('customers:read'), asyncHandler(ctrl.updateCustomer));
router.delete('/:id', requirePermission('customers:read'), asyncHandler(ctrl.deleteCustomer));

export default router;
