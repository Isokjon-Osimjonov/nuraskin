import { Router } from 'express';
import * as ctrl from './settings.controller';
import { asyncHandler } from '../../common/utils/async-handler';
import { requireAuth } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(ctrl.get));
router.patch('/', asyncHandler(ctrl.update));

router.get('/payment-info', asyncHandler(ctrl.getPaymentInfo));
router.patch('/payment-info', asyncHandler(ctrl.updatePaymentInfo));

// Korea Shipping Tiers
router.get('/shipping-tiers', asyncHandler(ctrl.listTiers));
router.post('/shipping-tiers', asyncHandler(ctrl.createTier));
router.patch('/shipping-tiers/:id', asyncHandler(ctrl.updateTier));
router.delete('/shipping-tiers/:id', asyncHandler(ctrl.removeTier));

// Shipping Boxes
router.get('/shipping-boxes', asyncHandler(ctrl.listBoxes));
router.post('/shipping-boxes', asyncHandler(ctrl.createBox));
router.patch('/shipping-boxes/:id', asyncHandler(ctrl.updateBox));
router.delete('/shipping-boxes/:id', asyncHandler(ctrl.removeBox));

export default router;
