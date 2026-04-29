import { Router } from 'express';
import * as ctrl from './exchange-rates.controller';
import { requireAuth } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/utils/async-handler';

export const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(ctrl.list));
router.post('/', asyncHandler(ctrl.create));
router.get('/latest', asyncHandler(ctrl.getLatest));

export default router;
