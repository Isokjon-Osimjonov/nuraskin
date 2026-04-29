import { Router } from 'express';
import * as ctrl from './telegram-channels.controller';
import { asyncHandler } from '../../common/utils/async-handler';
import { requireAuth, requirePermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(requireAuth);
router.use(requirePermission('team:read')); // using team:read as a baseline for admin telegram management

router.get('/', asyncHandler(ctrl.listChannels));
router.post('/', asyncHandler(ctrl.addChannel));
router.patch('/:id/toggle', asyncHandler(ctrl.toggleActive));
router.delete('/:id', asyncHandler(ctrl.removeChannel));
router.post('/test', asyncHandler(ctrl.testConnection));

export default router;
