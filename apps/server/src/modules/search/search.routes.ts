import { Router } from 'express';
import * as controller from './search.controller';
import { requireAuth } from '../../common/middleware/auth.middleware';

export const router = Router();

router.get('/', requireAuth, controller.search);
