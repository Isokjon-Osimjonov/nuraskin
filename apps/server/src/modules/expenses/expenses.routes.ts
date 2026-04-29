import { Router } from 'express';
import * as ctrl from './expenses.controller';
import { asyncHandler } from '../../common/utils/async-handler';
import { requireAuth } from '../../common/middleware/auth.middleware';

export const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(ctrl.listExpenses));
router.post('/', asyncHandler(ctrl.createExpense));
router.get('/summary', asyncHandler(ctrl.getSummary));
router.patch('/:id', asyncHandler(ctrl.updateExpense));
router.delete('/:id', asyncHandler(ctrl.deleteExpense));
