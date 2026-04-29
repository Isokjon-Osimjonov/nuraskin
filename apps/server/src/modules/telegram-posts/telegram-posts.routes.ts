import { Router } from 'express';
import * as ctrl from './telegram-posts.controller';
import { asyncHandler } from '../../common/utils/async-handler';
import { requireAuth, requirePermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(requireAuth);
router.use(requirePermission('team:read'));

router.get('/', asyncHandler(ctrl.listPosts));
router.get('/:id', asyncHandler(ctrl.getPost));
router.post('/', asyncHandler(ctrl.createPost));
router.patch('/:id', asyncHandler(ctrl.updatePost));
router.post('/:id/send', asyncHandler(ctrl.sendPost));
router.post('/:id/schedule', asyncHandler(ctrl.schedulePost));
router.delete('/:id/cancel-schedule', asyncHandler(ctrl.cancelSchedule));
router.post('/generate-caption', asyncHandler(ctrl.generateCaption));
router.delete('/:id', asyncHandler(ctrl.removePost));

export default router;
