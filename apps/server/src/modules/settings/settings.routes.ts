import { Router } from 'express';
import * as ctrl from './settings.controller';
import { asyncHandler } from '../../common/utils/async-handler';
import { requireAuth, requirePermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(ctrl.get));
router.patch('/', requirePermission('settings:write'), asyncHandler(ctrl.update));

router.get('/payment-info', asyncHandler(ctrl.getPaymentInfo));
router.patch('/payment-info', requirePermission('settings:write'), asyncHandler(ctrl.updatePaymentInfo));

// Korea Shipping Tiers
router.get('/shipping-tiers', asyncHandler(ctrl.listTiers));
router.post('/shipping-tiers', requirePermission('settings:write'), asyncHandler(ctrl.createTier));
router.patch('/shipping-tiers/:id', requirePermission('settings:write'), asyncHandler(ctrl.updateTier));
router.delete('/shipping-tiers/:id', requirePermission('settings:write'), asyncHandler(ctrl.removeTier));

// Shipping Boxes
router.get('/shipping-boxes', asyncHandler(ctrl.listBoxes));
router.post('/shipping-boxes', requirePermission('settings:write'), asyncHandler(ctrl.createBox));
router.patch('/shipping-boxes/:id', requirePermission('settings:write'), asyncHandler(ctrl.updateBox));
router.delete('/shipping-boxes/:id', requirePermission('settings:write'), asyncHandler(ctrl.removeBox));

export default router;
