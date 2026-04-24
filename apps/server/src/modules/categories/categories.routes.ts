import { Router } from 'express';
import { asyncHandler } from '../../common/utils/async-handler';
import { requireAuth } from '../../common/middleware/auth.middleware';
import rateLimit from 'express-rate-limit';
import * as ctrl from './categories.controller';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

export const router = Router();

router.get('/', asyncHandler(ctrl.list));
router.get('/:id', asyncHandler(ctrl.get));
router.post('/upload-url', requireAuth, asyncHandler(ctrl.getUploadUrl));
router.post('/', requireAuth, limiter, asyncHandler(ctrl.create));
router.put('/:id', requireAuth, asyncHandler(ctrl.update));
router.delete('/:id', requireAuth, asyncHandler(ctrl.remove));
