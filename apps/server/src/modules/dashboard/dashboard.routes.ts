import { Router } from 'express';
import * as controller from './dashboard.controller';
import { requireAuth } from '../../common/middleware/auth.middleware';

export const router = Router();

router.get('/kpis', requireAuth, controller.getKPIs);
router.get('/trend', requireAuth, controller.getTrend);
