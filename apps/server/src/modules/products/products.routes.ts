import { Router } from 'express';
import { asyncHandler } from '../../common/utils/async-handler';
import { requireAuth } from '../../common/middleware/auth.middleware';
import rateLimit from 'express-rate-limit';
import * as ctrl from './products.controller';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

export const router = Router();

router.post('/analyze-image', requireAuth, asyncHandler(ctrl.analyzeImage));
router.get('/', asyncHandler(ctrl.list));
router.get('/:id', asyncHandler(ctrl.get));
router.get('/barcode/:barcode', asyncHandler(ctrl.getByBarcode));
router.post('/', requireAuth, limiter, asyncHandler(ctrl.create));
router.patch('/:id', requireAuth, limiter, asyncHandler(ctrl.update));
router.patch('/:id/regional-config/:region', requireAuth, asyncHandler(ctrl.updateRegionalConfig));
router.delete('/:id', requireAuth, asyncHandler(ctrl.remove));