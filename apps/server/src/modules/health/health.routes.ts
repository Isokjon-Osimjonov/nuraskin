import { Router } from 'express';
import { asyncHandler } from '../../common/utils/async-handler';
import * as ctrl from './health.controller';

export const router = Router();

router.get('/', asyncHandler(ctrl.check));
