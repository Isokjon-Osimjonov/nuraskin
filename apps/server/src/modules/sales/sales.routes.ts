import { Router } from 'express';
import * as ctrl from './sales.controller';
import { asyncHandler } from '../../common/utils/async-handler';
import { requireAuth } from '../../common/middleware/auth.middleware';

export const router = Router();

router.use(requireAuth);

router.get('/live', asyncHandler(ctrl.getLiveSales));
router.get('/summary', asyncHandler(ctrl.getSummarySales));
