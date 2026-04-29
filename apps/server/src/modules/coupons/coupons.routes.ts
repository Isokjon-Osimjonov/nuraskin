import { Router } from 'express';
import * as ctrl from './coupons.controller';
import { asyncHandler } from '../../common/utils/async-handler';
import { requireAuth, requirePermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('settings:read'), asyncHandler(ctrl.listCoupons));
router.get('/:id', requirePermission('settings:read'), asyncHandler(ctrl.getCoupon));
router.post('/', requirePermission('settings:write'), asyncHandler(ctrl.createCoupon));
router.patch('/:id', requirePermission('settings:write'), asyncHandler(ctrl.updateCoupon));
router.delete('/:id', requirePermission('settings:write'), asyncHandler(ctrl.deleteCoupon));

export default router;
