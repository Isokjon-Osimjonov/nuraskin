import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/utils/async-handler';
import rateLimit from 'express-rate-limit';
import * as ctrl from './auth.controller';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

export const router = Router();

router.post('/login', limiter, asyncHandler(ctrl.login));
router.post('/telegram', limiter, asyncHandler(ctrl.telegramAuth));
router.get('/me', requireAuth, asyncHandler(ctrl.me));
