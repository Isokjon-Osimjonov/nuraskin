import { Router } from 'express';
import * as ctrl from './users.controller';
import { asyncHandler } from '../../common/utils/async-handler';
import { requireAuth, requirePermission } from '../../common/middleware/auth.middleware';

const router = Router();

// Admin team management routes
router.use(requireAuth);

router.get('/', requirePermission('team:read'), asyncHandler(ctrl.listTeam));
router.post('/', requirePermission('team:write'), asyncHandler(ctrl.inviteUser));
router.patch('/:id', requirePermission('team:write'), asyncHandler(ctrl.updateUser));
router.patch('/:id/change-password', asyncHandler(ctrl.changePassword)); // No extra permission needed to change OWN password
router.delete('/:id', requirePermission('team:write'), asyncHandler(ctrl.deleteUser));

export default router;
