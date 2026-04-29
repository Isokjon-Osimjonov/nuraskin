import { Router } from 'express';
import * as ctrl from './expenses.controller';
import { asyncHandler } from '../../common/utils/async-handler';
import { requireAuth } from '../../common/middleware/auth.middleware';

export const router = Router();

router.use(requireAuth);

router.get('/summary', asyncHandler(ctrl.getAccountingSummary));
router.get('/export', asyncHandler(ctrl.exportAccounting));
