import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/utils/async-handler';
import * as ctrl from './auth.controller';

export const router = Router();

router.post('/login', asyncHandler(ctrl.login));
router.post('/telegram', asyncHandler(ctrl.telegramAuth));
router.get('/me', requireAuth, asyncHandler(ctrl.me));
